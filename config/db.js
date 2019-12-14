const Sequelize = require('sequelize');
const  pg = require('pg');
delete pg.native;
const envConfig = require('./config')[process.env.NODE_ENV]
const dbUrl = envConfig.url;

const sequelize = new Sequelize(dbUrl, {
    dialectOptions: {
      options: {
          statement_timeout: 1000 * 60 * 3,
          idle_in_transaction_session_timeout: 1000 * 60 * 3
      }
    },
    benchmark: true,
    pool: {
        max: 30,
        min: 0,
        acquire: 10000,
        idle: 5000
    },
    logging: (process.env.NODE_ENV == 'development')
})


const verifyConnection = async () => {
    await sequelize.authenticate();
}

verifyConnection();



module.exports = sequelize;