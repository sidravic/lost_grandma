const redisClient = require('./../../config/redis_client');
const logger = require('./../../config/logger');
logger.defaultMeta.service = 'label-detection-queue-worker'

const { LabelDetectionQueue, LabelDetectionQueueWorker } = require('./label_detection_queue');


LabelDetectionQueue.process('label_detection_queue', 1, LabelDetectionQueueWorker)


