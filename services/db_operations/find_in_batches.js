const logger = require('../../config/logger')
const { Brand, Product, Source, Image, Review, ReviewComment, dbConn } = require('../../models/index')
const { Sequelize } = require('./../../config/db')
const { any, isEmpty } = require('./../utils');

const findInBatches = async (modelName, batchSize, onBatch, options) => {
    const noop = () => { }
    const callback = onBatch || noop;

    if (!options) options = {};

    const includedModels = options.includedModels || [];
    let includeOptions = includedModels || [];
    let whereClause = options.whereClause || {};
    let attributesClause = options.attributes || [];

    let offset = 0;
    let maxCount = options.limit;
    let totalCount = 0;

    try {
        if (maxCount) {
            totalCount = maxCount;
        } else {
            totalCount = await modelName.count({ col: 'id' });
        }

        logger.debug(`number of records: ${totalCount}`);

        let findAllOptions = {
            limit: batchSize,
            offset: offset,
            where: whereClause                                   
        }

        if (any(attributesClause)) {
            findAllOptions = Object.assign(findAllOptions, {attributes: attributesClause})
        }        

        if (any(includeOptions)) {
            findAllOptions = Object.assign(findAllOptions, {include: includeOptions});
        }
        
        while (offset < totalCount) {
            let products = await modelName.findAll(findAllOptions)
            logger.info({ msg: `Fetching from ${offset} to ${(offset + products.length)}`, src: 'findInBatches', event: 'findInBatches' })
            callback(products);
            offset = offset + products.length;
            
            if (products.length == 0) {
                return (new Promise((resolve, reject) => { resolve() }))        
            };

            if (products.length < batchSize){
                return (new Promise((resolve, reject) => { resolve()}))
            }
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
