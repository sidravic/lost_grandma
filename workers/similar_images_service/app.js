const redisClient = require('./../../config/redis_client');
const logger = require('./../../config/logger');
logger.defaultMeta.service = 'similiar_images-queue-worker'

const { SimilarImagesQueue, SimilarImagesQueueWorker } = require('./similar_images_queue');


SimilarImagesQueue.process('similar_images_queue', 5, SimilarImagesQueueWorker)


