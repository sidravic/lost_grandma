const logger = require('./logger');
const util = require('util')
const redis = require('redis');
const redisClient = redis.createClient({url: process.env.REDIS_URL})
const asyncPing = util.promisify(redisClient.ping).bind(redisClient);
const asyncSet = util.promisify(redisClient.set).bind(redisClient);
const asyncDel = util.promisify(redisClient.del).bind(redisClient);
const asyncSAdd = util.promisify(redisClient.sadd).bind(redisClient)

const checkConnection = async () => {
    let pong = await asyncPing();
    logger.info(`ping: ${pong}`);
    logger.info(`redis connection established on ${redisClient.address}`);
}

checkConnection();

const buildKey = (key) => {
    return `lock:${key}`;
}

const acquireLock = async(key) => {
    const lockKey = buildKey(key)
    const lockStatus =  await asyncSet(lockKey, 1, 'NX');
    return lockStatus;
}

const releaseLock = async(key) => {
    const lockKey = buildKey(key)
    const delStatus = await asyncDel(lockKey);
    return delStatus;
}

const Lock = {
    acquireLock: acquireLock,
    releaseLock: releaseLock
}

module.exports.redisClient = redisClient;
module.exports.Lock = Lock;
module.exports.asyncSAdd = asyncSAdd;




