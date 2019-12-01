const redisClient = require('./../../config/redis_client');
const logger = require('./../../config/logger');
logger.defaultMeta.service = 'classification-worker'

const {ClassificationQueue, ClassificationQueueWorker} = require('./classification_queue');

ClassificationQueue.process('classification_queue', 1, ClassificationQueueWorker)

ClassificationQueue.on('waiting', (jobId) => {
    logger.debug({
        src: 'workers/classification_services/app.js',
        event: 'ClassificationQueue.waiting', data: {jobId: jobId}
    })
})

ClassificationQueue.on('stalled', (jobId) => {
    logger.info({
        src: 'workers/classification_services/app.js',
        event: 'ClassificationQueue.stalled', data: {jobId: jobId}
    })
})

ClassificationQueue.on('progress', (job, progress) => {
    logger.info({
        src: 'workers/classification_services/app.js',
        event: 'ClassificationQueue.progress',
        data: {job: job, progress: progress}
    })
})
