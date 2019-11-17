const redisClient = require('./../../config/redis_client');
const logger = require('./../../config/logger');
logger.defaultMeta.service = 'sephora-worker'
const {ImageDownloadQueue, ImageDownloadQueueWorker} = require('./image_download_queue');
ImageDownloadQueue.process('image_download_queue', 1, ImageDownloadQueueWorker)
