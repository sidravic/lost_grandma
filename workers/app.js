const logger = require('./../config/logger');
logger.defaultMeta.service = 'sephora-worker'

const redisClient = require('./../config/redis_client');
const {PersistQueue, PersistQueueWorker} = require('./persist_queue');
PersistQueue.process('persist_queue', 10, PersistQueueWorker)
