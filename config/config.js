module.exports = {
    development: {
        url: process.env.DB_URL,
        database: process.env.DB_NAME,
        dialect: "postgres",
        operatorAliases: true
    },
    staging: {
        url: process.env.DB_URL,
        database: process.env.DB_NAME,
        dialect: "postgres",
        operatorAliases: true
    },
    test: {
        url: process.env.TEST_DB_URL,
        database: "lost_grandma_test",
        dialect: "postgres",
        operatorAliases: true
    }
}
