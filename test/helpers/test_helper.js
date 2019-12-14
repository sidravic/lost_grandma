process.env.NODE_ENV='test';

const logger = require('./../../config/logger');
const fs = require('fs')
const path = require('path')
const db = require('./../../models');
const _Sequelize = db.Sequelize;
const dbConn = db.dbConn;

logger.info({
    src: 'test/helpers/test_helper',
    event: 'setup',
    data: {database: `${dbConn.config.database}`, environment: process.env.NODE_ENV}
});

const models = Object.keys(db).filter((fileName) => {
    return (fileName !== 'index' &&
            fileName !== 'product' &&
            fileName !== 'dbConn' &&
            fileName !== 'ProductReview' &&
            fileName !== 'Sequelize')
})


const truncate = async () => {
    const truncatePromise = Promise.all(
        models.map(async (modelName) => {
            await db[modelName].destroy({where: {}, force: true})
        })
    )

    return (await truncatePromise);
}

const fixturesPath = () => {

}

module.exports.truncate = truncate;