const fs = require('fs')
const util = require('util')
const Bull = require('bull');
const logger = require('../../config/logger');
const redisUrl = process.env.REDIS_URL
const LabelDetectionQueue = new Bull('label_detection_queue', redisUrl, {     
    defaultJobOptions: { removeOnComplete: true },
    limiter: { max: 1, duration: 10000 },
});

// Avoid circular dependency loading problems
const CoordinatorService = require('./../../services/label_detection_services/coordinator');

/**
 * The service fetches Rekognition labels from images to identify if they're actual product images
 * images on S3
 * @param {*} job 
 * @param {*} done 
 */
const LabelDetectionQueueWorker = async (job, done) => {
    const data = job.data;
    logger.info({ src: 'LabelDetectionQueueWorker', data: job.id, status: 'started' });

    const imageBlob = JSON.parse(data);
    const service = new CoordinatorService();
    try {
        const response = await service.invoke(imageBlob)

        logger.info({
            src: 'LabelDetectionQueueWorker', event: 'completed',
            data: { job: job.id, status: response }
        })
        debugger;
        done();
    } catch (e){
        debugger;
        logger.error({
            src: 'LabelDetectionQueueWorker', event: 'failed',
            data: { job: job.id, status: 'error' },
            error: { message: e.message, stack: e.stack}
        })
        done();
    }
}

module.exports.LabelDetectionQueue = LabelDetectionQueue;
module.exports.LabelDetectionQueueWorker = LabelDetectionQueueWorker;