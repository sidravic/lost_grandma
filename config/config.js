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
        url: "postgres://sidravic:sidravic@10.0.0.6:5432/lost_grandma_test",
        database: "lost_grandma_test",
        dialect: "postgres",
        operatorAliases: true
    }
}
