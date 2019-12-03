const logger = require('./../../config/logger');
const {BaseService, BaseServiceResponse} = require('./../base_service')
const RetryableUpload = require('./retryable_upload');
const { Image } = require('./../../models')
const s3UploadFromInputStream = require('./../image_services/s3_operations').s3UploadFromInputStream;
const getDownloadReadStreamWithoutProxy = require('./../image_services/download_operations').getDownloadReadStreamWithoutProxy;

const uploadToS3 = async (service, retryable, bucketName = process.env.S3_IMAGES_BUCKET_NAME) => {
    if (retryable.anyErrors()) {
        return;
    }

    let fileName = retryable.imageUrl.split('/').slice(-1).pop();
    let s3ObjectPath = `${bucketName}/${retryable.productId}/${fileName}`

    try {
        const readstream = await getDownloadReadStreamWithoutProxy(retryable.imageUrl);
        const uploadStatus = await s3UploadFromInputStream(readstream, s3ObjectPath)
        retryable.uploadStatus = uploadStatus;
        return retryable;
    } catch (e) {
        logger.error({src: 'image_fetch_retry/coordinator', event: 'uploadToS3', error: {message: e.message, stack: e.stack}})
        retryable.addErrors([e.message]);
        retryable.errorCode = 'error_retrying_upload_to_s3';
        return retryable;
    }
};

const persistS3Url = async (service, retryable) => {
    if (retryable.anyErrors()) {
        return;
    }

    try {
        const updateStatus = await Image.update({s3_image_url: retryable.uploadStatus.Location.toString()}, {where: {id: retryable.imageId}})
        retryable.persistStatus = updateStatus;
        return retryable;
    } catch (e) {
        logger.error({src: 'image_fetch_retry/coordinator', event: 'persistS3Url', error: {message: e.message, stack: e.stack}})
        retryable.addErrors([e.message]);
        retryable.errorCode = 'error_persisting_retried_s3_url';
        return retryable;
    }

}

const retry = async (service) => {
    service.retryables = service.retryablePayload.map((retryable) => {
        return (
            new RetryableUpload(retryable.imageUrl,
                retryable.error,
                retryable.productId,
                retryable.brandId,
                retryable.imageId)
        )
    })

    const processPromise = Promise.all(service.retryables.map(async (retryable) => {
        await uploadToS3(service, retryable)
        await persistS3Url(service, retryable);
        return;
    }))

    try {
        await processPromise
        return;
    }catch(e) {
        logger.error({src: 'image_fetch_retry/coordinator', event: 'persistS3Url', error: {message: e.message, stack: e.stack}})
        return;
    }
}

class Coordinator extends BaseService {
    constructor() {
        super()
        this.retryablePayload = null;
    }

    async invoke(retryablePayload) {
        this.retryablePayload = retryablePayload;
        this.retryables = []
        await retry(this);

        const coordinatorResponse = new CoordinatorResponse(this.errors, this.errorCode, this.retryablePayload, this.retryables)

        return (new Promise((resolve, reject) => {
            if (this.anyErrors()) {
                reject(coordinatorResponse);
            } else {
                resolve(coordinatorResponse);
            }
        }))
    }
}

class CoordinatorResponse extends BaseServiceResponse {
    constructor(errors, errorCode, retryablePayload, retryables) {
        super(errors, errorCode);
        this.retryablePayload = retryablePayload;
        this.retryables = retryables
    }
}

module.exports = Coordinator;
