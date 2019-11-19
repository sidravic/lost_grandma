const fs = require('fs')
const util = require('util')
const Bull = require('bull');
const logger = require('../../config/logger');
const redisUrl = process.env.REDIS_URL
const DailyTriggerUploadToS3Queue = new Bull('daily_trigger_upload_to_s3_queue', redisUrl,
    {
        limiter: { max: 1, duration: 86400 },
        defaultJobOptions: { removeOnComplete: true }
    });

const CoordinatorService = require('../../services/image_services/coordinator');

const DailyTriggerUploadToS3QueueWorker = async (job, done) => {
    const data = job.data;
    logger.info({ src: 'DailyTriggerUploadToS3QueueWorker', data: job.id, status: 'started' });
    debugger;
    await new CoordinatorService().invoke();
    console.log('Job done')
    logger.info({ src: 'DailyTriggerUploadToS3QueueWorker', data: job.id, status: 'completed' });
    done();
}

module.exports.DailyTriggerUploadToS3Queue = DailyTriggerUploadToS3Queue;
module.exports.DailyTriggerUploadToS3QueueWorker = DailyTriggerUploadToS3QueueWorker;
