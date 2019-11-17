const fs = require('fs')
const util = require('util')
const Bull = require('bull');
const logger = require('./../../config/logger');
const redisUrl = process.env.REDIS_URL
const ImageDownloadQueue = new Bull('image_download_queue', redisUrl, { limiter: { max: 1, duration: 10000 }});

const ImageDownloadCoordinatorService = require('./../../services/image_services/coordinator');

const ImageDownloadQueueWorker = async (job, done) => {
    const data = job.data;
    logger.info({ src: 'ImageDownloadQueueWorker', data: job.id, status: 'started' });

    const downloadableImagePayload = JSON.parse(data);
    const service = new ImageDownloadCoordinatorService();
    try {
        const downloadStatus = await service.downloadImage(downloadableImagePayload)

        logger.info({
            src: 'ImageDownloadQueueWorker', event: 'completed',
            data: { job: job.id, status: downloadStatus }
        })
        done();
    } catch (e){
        logger.error({
            src: 'ImageDownloadQueueWorker', event: 'failed',
            data: { job: job.id, status: 'error' },
            error: { message: e.message, stack: e.stack}
        })
        done();
    }
}

module.exports.ImageDownloadQueue = ImageDownloadQueue;
module.exports.ImageDownloadQueueWorker = ImageDownloadQueueWorker;

