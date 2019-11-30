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
    logger.info({src: 'persist_queue', event: 'PersistQueueWorker', data: {jobId: job.id, status: 'started'}});


    const productPayload = JSON.parse(data);
    const service =  new ProductPersistService(productPayload);

    let serviceResponse = await service.invoke();
    let source = serviceResponse.source;
    let sourceUrl = null;
    if(source){
        sourceUrl = source.source_url
    }
    logger.info({src: 'persist_queue', event: 'PersistQueueWorker', data: {jobId: job.id, status: 'completed', url: sourceUrl}})
    done();


}

module.exports.PersistQueue = PersistQueue;
module.exports.PersistQueueWorker = PersistQueueWorker;

