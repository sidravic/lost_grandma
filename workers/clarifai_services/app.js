const redisClient = require('./../../config/redis_client');
const logger = require('./../../config/logger');
logger.defaultMeta.service = 'clarifai-uploader-queue'

const { ClarifaiUploaderQueue, ClarifaiUploaderQueueWorker } = require('./clarifai_uploader_queue');

ClarifaiUploaderQueue.process('clarifai-uploader-queue', 1, ClarifaiUploaderQueueWorker)

ClarifaiUploaderQueue.on('waiting', (jobId) => {
    logger.info({ src: 'workers/clarifai_services/app.js', event: 'ClarifaiUploaderQueue.waiting', data: { jobId: jobId }})
})

ClarifaiUploaderQueue.on('stalled', (jobId) => {
    logger.info({ src: 'workers/clarifai_services/app.js', event: 'ClarifaiUploaderQueue.stalled', data: { jobId: jobId }})
})

ClarifaiUploaderQueue.on('progress', (job, progress) => {
    logger.info({ src: 'workers/clarifai_services/app.js', event: 'ClarifaiUploaderQueue.progress', data: { job: job, progress: progress }})
})

