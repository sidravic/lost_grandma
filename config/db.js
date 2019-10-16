const Sequelize = require('sequelize');
const sequelize = new Sequelize(process.env.DB_URL, {
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
})

const verifyConnection = async () => {
    await sequelize.authenticate()
}

verifyConnection();

module.exports = sequelize