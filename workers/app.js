const log = require('./../config/logger');
const redisClient = require('./../config/redis_client');
const {PersistQueue, PersistQueueWorker} = require('./persist_queue');

// const {DistanceCalculatorQueue, DistanceProcessor} = require('./distance_calculator_queue');
// const {ConsolidatorQueue, ConsolidationProcessor} = require('./consolidation_queue');

// Queue.process('request_acceptor', 10, Processor);
PersistQueue.process('persist_queue', 10, PersistQueueWorker)
// DistanceCalculatorQueue.process('distance_calculator', 10, DistanceProcessor);
// ConsolidatorQueue.process('consolidator', 10, ConsolidationProcessor);
