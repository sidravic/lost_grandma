const logger = require('./../../config/logger');
const {findInBatches} = require('./../db_operations/find_in_batches');
const Sequelize = require('sequelize');
const {Brand, Product, Source, Image, ImageLabel, Review, ReviewComment, dbConn} = require('./../../models')

const Constants = require('./../constants')

const onBatch = (batchId) => {
    const SimilarImagesQueue = require('./../../workers/similar_images_service/similar_images_queue').SimilarImagesQueue;

    return (async (products) => {
        await Promise.all(products.map(async (product) => {
            const jobPayload = {productId: product.id, batchId: batchId};
            const retryOptions = {removeOnComplete: true, removeOnFail: true, attempts: 0};
            const job = await SimilarImagesQueue.add('similar_images_queue', JSON.stringify(jobPayload), retryOptions);
            logger.info({src: 'task', event: 'SimilarImagesQueueJobAdded', data: {similarImagesBlob: jobPayload}});
        }))
    })

}

const findProductsWithLessThan5ImagesAndNonRestrictedLabels = async (batchId) => {
    const op = Sequelize.Op;

    const batchOptions = {
        includedModels: [
            {
                model: Brand,
                required: true,
                attributes: ['name', 'id']
            },
            {
                model: Image,
                required: true,
                attributes: ['id', 'image_url', 's3_image_url'],
                where: {
                    [op.and]: [
                        { s3_image_url: {[op.not]: null}},
                        { source: 'sephora'}
                    ]
                }
            }
        ]
    }

    const onEachBatch = onBatch(batchId);
    await findInBatches(Product, 1000, onEachBatch, batchOptions);
}


const main = async () => {
    const uuid = require('uuid')
    await findProductsWithLessThan5ImagesAndNonRestrictedLabels(uuid.v4())
    return
}

module.exports = main;
