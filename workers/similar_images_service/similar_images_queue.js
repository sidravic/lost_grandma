const fs = require('fs')
const util = require('util')
const Bull = require('bull');
const logger = require('../../config/logger');
const redisUrl = process.env.REDIS_URL
const SimilarImagesQueue = new Bull('similar_images_queue', redisUrl, {
    defaultJobOptions: {removeOnComplete: true},
    limiter: {max: 5, duration: 5000},
});

// Avoid circular dependency loading problems
const CoordinatorService = require('./../../services/similar_images_service/coordinator');

SimilarImagesQueue.on('waiting', (jobId) => {
    logger.debug({src: 'similar_images_queue', event: 'SimilarImagesQueue.waiting', data: {jobId: jobId}})
})

SimilarImagesQueue.on('stalled', (jobId) => {
    logger.info({src: 'similar_images_queue', event: 'SimilarImagesQueue.stalled', data: {jobId: jobId}})
})

SimilarImagesQueue.on('progress', (job, progress) => {
    logger.info({
        src: 'similar_images_queue',
        event: 'SimilarImagesQueue.progress',
        data: {job: job, progress: progress}
    })
})

/**
 * The service fetches Rekognition labels from images to identify if they're actual product images
 * images on S3
 * @param {*} job
 * @param {*} done
 */
const SimilarImagesQueueWorker = async (job, done) => {
    const data = JSON.parse(job.data);
    logger.info({src: 'SimiliarImagesQueueWorker', data: job.id, status: 'started'});
    const productId = data.productId;
    const batchId = data.batchId;

    const service = new CoordinatorService();
    try {
        const serviceResponse = await service.invoke(productId, batchId);
        logger.info({
            src: 'workers/similar_images_service/similar_images_queue.js',
            event: 'processor',
            data: {success: true, productId: productId, projectId: batchId, response: serviceResponse}
        })
    } catch (e) {
        logger.error({
            src: 'workers/similar_images_service/similar_images_queue.js',
            event: 'processor',
            data: {success: false, productId: productId, batchId: batchId },
            error: {message: e.message, stack: e.stack}
        });
    }

    // await ifCompleteTriggerNext(SimilarImagesQueue, LabelDetectionServiceTask);
    done();
}


module.exports.SimilarImagesQueue = SimilarImagesQueue;
module.exports.SimilarImagesQueueWorker = SimilarImagesQueueWorker;