const Bull = require('bull');
const logger = require('./../config/logger');
const redisUrl = process.env.REDIS_URL
const PersistQueue = new Bull('persist_queue', redisUrl);
const fs = require('fs')
const util = require('util')
//const writeFile = util.promisify(fs.writeFile)
const ProductPersistService = require('./../services/product_persist_service');

const PersistQueueWorker = async(job, done) => {
    const data = job.data;
    logger.info({worker: 'PersistQueueProcessor', data: job.id, status: 'started'});


    const productPayload = JSON.parse(data);
    const service =  new ProductPersistService(productPayload);
    debugger;
    let serviceResponse = await service.invoke();
    debugger;

    setTimeout(() => {
        done();
    }, 5000)
}

module.exports.PersistQueue = PersistQueue;
module.exports.PersistQueueWorker = PersistQueueWorker;

