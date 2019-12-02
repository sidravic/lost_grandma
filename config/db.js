const Sequelize = require('sequelize');
const  pg = require('pg');
delete pg.native;

const sequelize = new Sequelize(process.env.DB_URL, {
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
    }
})

const verifyConnection = async () => {
    await sequelize.authenticate();
}

verifyConnection();

module.exports = sequelize