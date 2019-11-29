const logger = require('./../../config/logger');
const Sequelize = require('sequelize');
const {Brand, Product, Source, Image, ImageLabel, Review, ReviewComment, dbConn} = require('./../../models')
const {findInBatches} = require('./../db_operations/find_in_batches')
const {BaseService, BaseServiceResponse} = require('./../base_service');
const {detectLabels} = require('./label_detection');
const {syncError, any} = require('./../utils');


const onEachBatch = (images) => {
    const LabelDetectionQueue = require('./../../workers/label_detection_services/label_detection_queue').LabelDetectionQueue;

    images.map(async (image) => {
        let imageBlob = {
            ...image.dataValues
        }

        const retryOptions = {removeOnComplete: true, attempts: 1};
        const job = await LabelDetectionQueue.add('label_detection_queue', JSON.stringify(imageBlob), retryOptions)
        logger.info({src: 'Coordinator', event: 'ImageAddedToLabelDetectionQueue', data: {imageBlob: imageBlob}});
    })
}

const fetchImagesWithoutLabels = async () => {

    const op = Sequelize.Op;
    const options = {
        includedModels: [
            {
                model: ImageLabel,
                required: false,
                where: {
                    id: {[op.is]: null}
                },
                attributes: ['id']
            }
        ],
        whereClause: {
            [op.and]: {
                s3_image_url: {[op.not]: null},
            },
        },
        attributes: ['id', 's3_image_url', 'azure_image_url', 'image_url'],
        limit: 100
    }
    await findInBatches(Image, 100, onEachBatch, options)
    return;
}

const fetchLabels = async (service) => {
    const imageBlob = service.imageBlob;
    try {
        logger.info({
            src: 'Coordinator',
            event: 'fetchLabels',
            status: 'detecting',
            data: {s3_url: imageBlob.s3_image_url, image_id: imageBlob.id}
        })
        const labelsDetected = await detectLabels(imageBlob.s3_image_url);
        service.detectedLabels = labelsDetected;
        logger.info({
            src: 'Coordinator',
            event: 'fetchLabels',
            status: 'completed',
            data: {labels: labelsDetected, imageBlob: imageBlob}
        });
    } catch (e) {
        logger.info({
            src: 'Coordinator',
            event: 'fetchLabels',
            status: 'error',
            data: {},
            error: {message: e.message, stack: e.stack}
        });
        service.addErrors([e.message]);
        service.errorCode = 'error_fetching_labels'
    }
}

const persistLabels = async (service) => {
    if (service.anyErrors()) {
        return;
    }
    let imageLabels, errors;

    const detectedLabels = service.detectedLabels;
    const bulkCreateOptions = detectedLabels.map((label) => {
        return {
            cosmetics_image_id: service.imageBlob.id,
            ...label
        }
    });


    [imageLabels, errors] = await syncError(ImageLabel.bulkCreate(bulkCreateOptions));

    if (any(errors)) {
        service.addErrors(errors);
        service.ErrorCode = 'error_persisting_image_labels';
        logger.error({
            src: 'Coordinator',
            event: 'persistLabels',
            data: {imageBlob: service.imageBlob, detectedLabels: service.detectedLabels},
            errors: {message: errors, stack: null}
        })
    }

    return

}

const getImage = async (imageId) => {
    const op = Sequelize.Op;

    const [image, error] = await syncError(Image.findOne({
        where: {id: imageId},
        attributes: ['id', 's3_image_url', 'azure_image_url', 'image_url'],
        include: [{
            model: ImageLabel,
            required: false,
            where: {
                id: {[op.is]: null}
            },
            attributes: ['id']
        }]
    }))
    return [image, error];
}

const getImageBlob = async (imageId) => {

    const [image, error] = await getImage(imageId);

    return (new Promise((resolve, reject) => {
        if (any(error)) {
            logger.error({src: 'Coordinator', event: 'addToQueue', data: {imageId: imageId}, error: {message: error}})
            reject(error);
        }

        if (!image.s3_image_url) {
            logger.error({
                src: 'Coordinator',
                event: 'addToQueue',
                data: {imageId: imageId},
                error: {message: 's3_image_url not present'}
            })
            reject(error);
        }

        if (any(image.ImageLabels)) {
            logger.error({
                src: 'Coordinator',
                event: 'addToQueue',
                data: {imageId: imageId},
                error: {message: 'image labels already exist'}
            })
            reject(error);
        }

        let imageBlob = {...image.dataValues};
        resolve(imageBlob);
    }))
}

class Coordinator extends BaseService {
    constructor() {
        super();

        this.imageBlob = null;
        this.detectedLabels = [];
    }

    async batch() {
        await fetchImagesWithoutLabels()
        return true;
    }

    async addToQueue(imageId) {

        try {
            const imageBlob = await getImageBlob(imageId);
            const LabelDetectionQueue = require('./../../workers/label_detection_services/label_detection_queue').LabelDetectionQueue;
            const retryOptions = {removeOnComplete: true, attempts: 1};
            const job = await LabelDetectionQueue.add('label_detection_queue', JSON.stringify(imageBlob), retryOptions)
            logger.info({src: 'Coordinator', event: 'addToQueue', data: {imageBlob: imageBlob}});
            return job;
        } catch (e) {
            logger.error({
                src: 'Coordinator',
                event: 'addToQueue',
                data: {imageId: imageId},
                error: {message: e.message, stack: e.stack}
            })
            return new Promise((resolve, reject) => {
                reject(e)
            });
        }
    }

    async invoke(imageBlob) {

        try {
            this.imageBlob = imageBlob;
            await fetchLabels(this);
            await persistLabels(this);

            return (new Promise((resolve, reject) => {

                const response = new CoordinatorResponse(this.errors, this.errorCode, this.imageBlob, this.detectedLabels)
                if (this.anyErrors()) {
                    reject(response);
                } else {
                    resolve(response);
                }
            }))
        } catch (e) {
            logger.error({src: 'Coordinator', event: 'invoke', data: {}, error: {message: e.message, stack: e.stack}})
        }
    }
}

class CoordinatorResponse extends BaseServiceResponse {
    constructor(errors, errorCode, imageBlob, detectedLabels) {
        super(errors, errorCode);
        this.imageBlob = imageBlob;
        this.detectedLabels = detectedLabels;
    }
}

Coordinator.getImageBlob = getImageBlob;
Coordinator.getImage = getImage;
module.exports = Coordinator;