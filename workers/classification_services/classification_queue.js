const fs = require('fs')
const util = require('util')
const Bull = require('bull');
const logger = require('../../config/logger');
const redisUrl = process.env.REDIS_URL
const ClassificationQueue = new Bull('classification_queue', redisUrl, {
    defaultJobOptions: {removeOnComplete: true},
    limiter: {max: 1, duration: 3000},
});

const CoordinatorService = require('./../../services/classification_services/coordinator');

const ClassificationQueueWorker = async (job, done) => {
    const data = JSON.parse(job.data);

    const product = data.product;
    const project = data.project;
    const service = new CoordinatorService();
    try {
        const response = await service.invoke(product, project)
        logger.info({
            src: 'workers/classification_services/classification_queue.js',
            event: 'processor',
            data: {success: true, productId: product.id, projectId: project.id, response: response}
        });
        done();
    } catch (e) {
        const error = e.message || e.errors;
        const stack = e.stack || e.errorCode;
        logger.error({
            src: 'workers/classification_services/classification_queue.js',
            event: 'processor',
            data: {success: false, productId: product.id, projectId: project.id},
            error: { message: error, stack: stack}
        });
        done();
    }
}

module.exports.ClassificationQueue = ClassificationQueue;
module.exports.ClassificationQueueWorker = ClassificationQueueWorker;