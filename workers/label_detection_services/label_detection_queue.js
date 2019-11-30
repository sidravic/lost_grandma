const fs = require('fs')
const util = require('util')
const Bull = require('bull');
const logger = require('../../config/logger');
const redisUrl = process.env.REDIS_URL
const LabelDetectionQueue = new Bull('label_detection_queue', redisUrl, {
    defaultJobOptions: {removeOnComplete: true},
    limiter: {max: 1, duration: 1000},
});

// Avoid circular dependency loading problems
const CoordinatorService = require('./../../services/label_detection_services/coordinator');

LabelDetectionQueue.on('waiting', (jobId) => {
    logger.info({src: 'label_detection_queue', event: 'LabelDetectionQueue.waiting', data: {jobId: jobId}})
})

LabelDetectionQueue.on('stalled', (jobId) => {
    logger.info({src: 'label_detection_queue', event: 'LabelDetectionQueue.stalled', data: {jobId: jobId}})
})

LabelDetectionQueue.on('progress', (job, progress) => {
    logger.info({
        src: 'label_detection_queue',
        event: 'LabelDetectionQueue.progress',
        data: {job: job, progress: progress}
    })
})

/**
 * The service fetches Rekognition labels from images to identify if they're actual product images
 * images on S3
 * @param {*} job
 * @param {*} done
 */
const LabelDetectionQueueWorker = async (job, done) => {
    const data = job.data;
    logger.info({src: 'LabelDetectionQueueWorker', data: {jobId: job.id, status: 'started'}});

    const imageBlob = JSON.parse(data);
    const service = new CoordinatorService();
    try {
        const response = await service.invoke(imageBlob)

        logger.info({
            src: 'LabelDetectionQueueWorker', event: 'completed',
            data: {job: job.id, status: response}
        })
        done();
    } catch (e) {

        logger.error({
            src: 'LabelDetectionQueueWorker', event: 'failed',
            data: {job: job.id, status: 'error'},
            error: {message: e.message, stack: e.stack}
        })

        done();
    }
}

module.exports.LabelDetectionQueue = LabelDetectionQueue;
module.exports.LabelDetectionQueueWorker = LabelDetectionQueueWorker;