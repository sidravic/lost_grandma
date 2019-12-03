const fs = require('fs')
const util = require('util')
const Bull = require('bull');
const logger = require('../../config/logger');
const blocked = require('blocked');
const redisUrl = process.env.REDIS_URL
const SimilarImagesQueue = new Bull('similar_images_queue', redisUrl, {
    defaultJobOptions: {removeOnComplete: true},
    settings: {maxStalledCount: 0}
    // limiter: {max: 1, duration: 1000},
});

// Avoid circular dependency loading problems
const CoordinatorService = require('./../../services/similar_images_service/coordinator');

SimilarImagesQueue.on('waiting', (jobId) => {
    logger.info({src: 'similar_images_queue', event: 'SimilarImagesQueue.waiting', data: {jobId: jobId}})
})

SimilarImagesQueue.on('stalled', async (job) => {
    logger.error({src: 'similar_images_queue', event: 'SimilarImagesQueue.stalled', data: {jobId: job}})
    await job.discard();
    await job.moveToFailed(new Error('stalled for unknown reasons'), true)
    return;
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
const checkEventLoopBlocked = (done) => {

    blocked((ms) => {
        logger.error({ src: 'logger.js', event: 'EventLoopBlocked', data: {blockedFor: ms.toString()}})
    }, {threshold: 1500, interval: 1000 })
}

const SimilarImagesQueueWorker = async (job, done) => {
    const data = JSON.parse(job.data);
    logger.info({src: 'SimiliarImagesQueueWorker', data: job.id, status: 'started'});
    const productId = data.productId;
    const batchId = data.batchId;

    checkEventLoopBlocked(done);
    const service = new CoordinatorService();
    try {
        const serviceResponse = await service.invoke(productId, batchId);
        done();
    } catch (e) {
        done();
    }

    // await ifCompleteTriggerNext(SimilarImagesQueue, LabelDetectionServiceTask);

}





module.exports.SimilarImagesQueue = SimilarImagesQueue;
module.exports.SimilarImagesQueueWorker = SimilarImagesQueueWorker;