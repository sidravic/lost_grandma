const redisClient = require('./../../config/redis_client');
const logger = require('./../../config/logger');
logger.defaultMeta.service = 'upload-to-s3-queue-worker'

const { UploadToS3Queue, UploadToS3QueueWorker } = require('./upload_to_s3_queue');
const { DailyTriggerUploadToS3Queue, DailyTriggerUploadToS3QueueWorker } = require('./daily_trigger_upload_to_s3_queue');

UploadToS3Queue.process('upload_to_s3_queue', 1, UploadToS3QueueWorker)

UploadToS3Queue.on('waiting', (jobId) => {
    logger.debug({ src: 'workers/image_services/app.js', event: 'UploadToS3Queue.waiting', data: { jobId: jobId }})
})

UploadToS3Queue.on('stalled', (jobId) => {
    logger.info({ src: 'workers/image_services/app.js', event: 'UploadToS3Queue.stalled', data: { jobId: jobId }})
})

UploadToS3Queue.on('progress', (job, progress) => {
    logger.debug({ src: 'workers/image_services/app.js', event: 'UploadToS3Queue.progress', data: { job: job, progress: progress }})
})

DailyTriggerUploadToS3Queue.on('waiting', (jobId) => {
    logger.debug({ src: 'workers/image_services/app.js', event: 'DailyTriggerUploadToS3Queue.waiting', data: { jobId: jobId }})
})

DailyTriggerUploadToS3Queue.on('stalled', (jobId) => {
    logger.info({ src: 'workers/image_services/app.js', event: 'DailyTriggerUploadToS3Queue.stalled', data: { jobId: jobId }})
})

DailyTriggerUploadToS3Queue.on('progress', (job, progress) => {
    logger.debug({ src: 'workers/image_services/app.js', event: 'DailyTriggerUploadToS3Queue.progress', data: { job: job, progress: progress }})
})

DailyTriggerUploadToS3Queue.process('daily_trigger_upload_to_s3_queue', 1, DailyTriggerUploadToS3QueueWorker);
DailyTriggerUploadToS3Queue.add('daily_trigger_upload_to_s3_queue', { timestamp: new Date() }, {
    repeat: {
        every: 86400000        
    }
})

