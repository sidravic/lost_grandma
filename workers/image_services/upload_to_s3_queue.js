const fs = require('fs')
const util = require('util')
const Bull = require('bull');
const logger = require('../../config/logger');
const redisUrl = process.env.REDIS_URL
const UploadToS3Queue = new Bull('upload_to_s3_queue', redisUrl, { 
    limiter: { max: 1, duration: 10000 },
    defaultJobOptions: { removeOnComplete: true }
});

// Avoid circular dependency loading problems
const CoordinatorService = require('../../services/image_services/coordinator');

/**
 * The service downloads images from the source URLS that point to sephora website and stores the
 * images on S3
 * @param {*} job 
 * @param {*} done 
 */
const UploadToS3QueueWorker = async (job, done) => {
    const data = job.data;
    logger.info({ src: 'UploadToS3QueueWorker', data: job.id, status: 'started' });

    const downloadableImagePayload = JSON.parse(data);
    const service = new CoordinatorService();
    try {
        const uploadStatus = await service.saveToS3(downloadableImagePayload)

        logger.info({
            src: 'UploadToS3QueueWorker', event: 'completed',
            data: { job: job.id, status: uploadStatus }
        })
        done();
    } catch (e){
        logger.error({
            src: 'UploadToS3QueueWorker', event: 'failed',
            data: { job: job.id, status: 'error' },
            error: { message: e.message, stack: e.stack}
        })
        done();
    }
}

module.exports.UploadToS3Queue = UploadToS3Queue;
module.exports.UploadToS3QueueWorker = UploadToS3QueueWorker;