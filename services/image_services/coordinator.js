const Sequelize = require('sequelize');
const logger = require('./../../config/logger');
const {Brand, Product, Source, Image, Review, ReviewComment, dbConn} = require('./../../models')
const {findInBatches} = require('../db_operations/find_in_batches');
const {BaseService, BaseServiceResponse} = require('./../base_service');
const DownloadableProductImages = require('./downloadable_product_images');
const {s3StoreObjectFromImageUrl, s3UploadFromInputStream} = require('./s3_operations')
const {any} = require('./../utils')


const onEachBatch = (products) => {

    const UploadToS3Queue = require('./../../workers/image_services/upload_to_s3_queue').UploadToS3Queue;
    let downloadableProductImages = products.map(product => {
        return (
            DownloadableProductImages.fromProduct(product).asJSON())
    })
    downloadableProductImages.map(async (dpi, index) => {
        const retryOptions = {removeOnComplete: true, removeOnFail: true, attempts: 0}
        const job = await UploadToS3Queue.add('upload_to_s3_queue', JSON.stringify(dpi), retryOptions);
        logger.info({src: 'Coordinator', event: 'ImageAddedToDownloadQueue', data: {downloadImagePayload: dpi}});
    });
}

const uploadImagesToS3AndPersist = async (downloadableImagePayload, service) => {
    const imageUrls = downloadableImagePayload.imageUrls;
    const folderName = downloadableImagePayload.folderName;
    const imageUrlToId = downloadableImagePayload.imageUrlToId;
    const bucketName = process.env.S3_IMAGES_BUCKET_NAME;

    return Promise.all(imageUrls.map(async (imageUrl, _index) => {

        let fileName = imageUrl.split('/').slice(-1).pop();
        let s3ObjectPath = `${bucketName}/${folderName}/${fileName}`

        try {
            let status = {uploadStatus: null, persistStatus: null};

            let uploadStatus = await s3StoreObjectFromImageUrl(s3ObjectPath, imageUrl)
            logger.info({
                event: 'downloadImages',
                src: 'Coordinator',
                data: {folderName: folderName, status: 'complete'}
            })
            const persistStatus = await persistS3Url(uploadStatus, imageUrl, imageUrlToId, service);

            status.persistStatus = persistStatus;
            status.uploadStatus = uploadStatus;
            service.status.push(status);

            return service.status;
        } catch (e) {
            service.addErrors([e.message])
            service.s3uploadFailures.push({
                imageUrl: imageUrl,
                error: e.message,
                productId: downloadableImagePayload.productId,
                brandId: downloadableImagePayload.brandId,
                folderName: downloadableImagePayload.folderName,
                imageId: imageUrlToId[imageUrl]
            });
            service.errorCode = 'error_uploading_images_to_s3';
            logger.error({
                event: 'downloadImages',
                src: 'Coordinator',
                data: {imageUrl: imageUrl, status: 'error'},
                error: {message: e.message, stack: e.stack}
            })
        }
    }))
}

const persistS3Url = async (uploadStatus, imageUrl, imageUrlToId, service) => {

    const imageId = imageUrlToId[imageUrl];
    try {
        const persistStatus = await Image.update({s3_image_url: uploadStatus.Location.toString()}, {where: {id: imageId}})
        logger.info({event: 'persistS3Url', src: 'Coordinator', data: {imageUrl: imageUrl, status: 'completed'}})
        return persistStatus;
    } catch (e) {
        logger.error({
            event: 'persistS3Url',
            src: 'Coordinator',
            data: {imageUrl: imageUrl, status: 'error'},
            error: {message: e.message, stack: e.stack}
        })
        service.addErrors([e.message]);
        service.errorCode('error_persist_s3_url');
    }
}

const createMetadataFile = async (downloadableImagePayload, service) => {

    const bucketName = process.env.S3_IMAGES_BUCKET_NAME;
    const folderName = downloadableImagePayload.folderName;
    const s3ObjectPath = `${bucketName}/${folderName}/metadata.json`

    try {
        const metadataUploadStatus = await s3UploadFromInputStream(JSON.stringify(downloadableImagePayload), s3ObjectPath);
        logger.info({src: 'Coordinator', event: 'createMetaDataFile', data: {status: 'success', path: s3ObjectPath}})
        service.metadataUploadStatus = metadataUploadStatus;
        return service.metadataUploadStatus;
    } catch (e) {
        logger.info({src: 'Coordinator', event: 'createMetaDataFile', data: {status: 'success', path: s3ObjectPath}})
        service.addErrors([e.message]);
        service.errorCode('error_uploading_metadata.json');
    }
}

const retryFailedImages = async (downloadableImagePayload, service) => {
    const ImageFetchRetryCoordinator = require('./../image_fetch_retry_service/coordinator');
    const imageFetchRetryService = new ImageFetchRetryCoordinator();
    const s3uploadFailures = service.s3uploadFailures;

    if(!any(s3uploadFailures)) { return }
    try {
        const retryResponse = await imageFetchRetryService.invoke(s3uploadFailures);
        service.retryResponse = retryResponse;
        logger.info({src: 'Coordinator', event: 'retryFailedImages', data: {status: 'success', path: retryResponse }})
    }catch(e){
        service.addErrors([e.message]);
        service.errorCode = 'error_retrying_image_fetch'
        logger.info({src: 'Coordinator', event: 'retryFailedImages', data: {status: 'failed' }})
    }
    return;

}

class CoordinatorService extends BaseService {
    constructor() {
        super();

        this.status = [];
        this.metadataUploadStatus = null;
        this.downloadableImagePayload = null;
        this.s3uploadFailures = []
        this.retryResponse = null;
    }

    async batch() {
        await this.fetchProductsInBatches();
        return true;
    }

    async fetchProductsInBatches() {

        const op = Sequelize.Op;
        const options = {
            includedModels: [
                {
                    model: Image,
                    required: true,
                    where: {s3_image_url: {[op.is]: null}}
                },
                {
                    model: Brand,
                    required: true
                }
            ],
            limit: 100
        }
        await findInBatches(Product, 100, onEachBatch, options)
        return;
    }

    async invoke(downloadableImagePayload) {
        try {
            this.downloadableImagePayload = downloadableImagePayload;
            await uploadImagesToS3AndPersist(downloadableImagePayload, this)
            await createMetadataFile(downloadableImagePayload, this);
            await retryFailedImages(downloadableImagePayload, this);
            const coordinatorResponse = new CoordinatorServiceResponse(this.errors, this.errorCode,
                this.downloadableImagePayload, this.status, this.metadataUploadStatus, this.s3uploadFailures, this.retryResponse)

            return (new Promise((resolve, reject) => {
                if (this.anyErrors()) {
                    reject(coordinatorResponse);
                } else {
                    resolve(coordinatorResponse)
                }
            }));
        } catch (e) {
            logger.error({
                event: 'downloadImage',
                src: 'Coordinator',
                data: {folderName: downloadableImagePayload},
                error: {message: e.message, stack: e.stack}
            })

            let coordinatorResponse = new CoordinatorServiceResponse([e.message], 'exception_coordinator_image_download', downloadableImagePayload, null, null);
            return (new Promise((_resolve, reject) => {
                reject(coordinatorResponse);
            }));
        }
    }
}

class CoordinatorServiceResponse extends BaseServiceResponse {
    constructor(errors, errorCode, downloadableImagePayload, uploadStatus, metadataUploadStatus, s3UploadFailures, retryResponse) {
        super(errors, errorCode);
        this.uploadStatus = uploadStatus;
        this.metadataUploadStatus = metadataUploadStatus;
        this.downloadableImagePayload = downloadableImagePayload
        this.s3UploadFailures = s3UploadFailures
        this.retryResponse = retryResponse
    }
}

module.exports = CoordinatorService;