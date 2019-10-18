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
    logger.info({src: 'PersistQueueProcessor', data: job.id, status: 'started'});


    const productPayload = JSON.parse(data);
    const service =  new ProductPersistService(productPayload);

    let serviceResponse = await service.invoke();
    logger.info({src: 'PersistQueueProcessor', data: job.id, status: 'completed', response: serviceResponse})
    done();


}

module.exports.PersistQueue = PersistQueue;
module.exports.PersistQueueWorker = PersistQueueWorker;

