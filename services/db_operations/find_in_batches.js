const logger = require('../../config/logger')
const { Brand, Product, Source, Image, Review, ReviewComment, dbConn } = require('../../models/index')
const { Sequelize } = require('./../../config/db')

const findInBatches = async (modelName, batchSize, onBatch, options) => {
    const noop = () => { }
    const callback = onBatch || noop;

    if (!options) options = {};

    const includedModels = options.includedModels || []
    let includeOptions = includedModels || [];
    let whereClause = options.whereClause || {};

    let offset = 0;

    try {
        const totalCount = await modelName.count({ col: 'id' });
        logger.debug(`number of records: ${totalCount}`);

        while (offset < totalCount) {
            let products = await modelName.findAll({
                limit: batchSize,
                offset: offset,
                include: includeOptions,

            })
            logger.info({ msg: `Fetching from ${offset} to ${(offset + products.length)}`, src: 'findInBatches', event: 'findInBatches' })
            callback(products);
            offset = offset + products.length;
            
            if (products.length == 0) {
                return (new Promise((resolve, reject) => { resolve() }))        
            };
        }
        return (new Promise((resolve, reject) => { resolve() }))
    } catch (e) {
        console.log(e.message)
        console.log(e.stack)
        return (new Promise((resolve, reject) => { reject() }))
    }
}

const dbOps = { findInBatches }
module.exports = dbOps;

