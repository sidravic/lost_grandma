const Bull = require('bull');
const logger = require('../../config/logger');
const redisUrl = process.env.REDIS_URL
const {asyncSAdd} = require('./../../config/redis_client')
const ClarifaiUploaderQueue = new Bull('clarifai-uploader-queue', redisUrl, {
    limiter: {max: 2, duration: 1000},
    defaultJobOptions: {removeOnComplete: true, removeOnFail: true}
});
const {uploadImagesWithTag} = require('./../../services/classification_services/clarifai_classification_services/uploader')
/**
 * The service downloads images from the source URLS that point to sephora website and stores the
 * images on S3
 * @param {*} job
 * @param {*} done
 */
const ClarifaiUploaderQueueWorker = async (job, done) => {
    const data = job.data;
    logger.info({src: 'ClarifaiUploaderQueueWorker', data: {jobId: job.id, status: 'started'}});

    const parsedJSON = JSON.parse(data);
    const productPayload = parsedJSON.product;
    const uploadKey = parsedJSON.uploadKey;

    try {
        if (!productPayload.Images) {
            throw new Error(`No images for productId ${productPayload.id}. ProductName: ${productPayload.name}`)
        }

        if (productPayload.Images.length < 3) {
            throw new Error(`Less than 3 images for productId ${productPayload.id}. ProductName: ${productPayload.name}`)
        }

        const uploadResponse = await uploadImagesWithTag(productPayload);
        await asyncSAdd(uploadKey, productPayload.id);
        logger.info({
            src: 'ClarifaiUploaderQueueWorker', event: 'completed',
            data: {job: job.id, status: 'success'}
        })
        done();
    } catch (e) {
        logger.error({
            src: 'ClarifaiUploaderQueueWorker', event: 'failed',
            data: {job: job.id, status: 'error'},
            error: {message: e.message, stack: e.stack}
        })
        done();
    };

    return;

}

module.exports.ClarifaiUploaderQueue = ClarifaiUploaderQueue;
module.exports.ClarifaiUploaderQueueWorker = ClarifaiUploaderQueueWorker;