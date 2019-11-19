module.exports = {
    development:{
      url: process.env.DB_URL,
      database: process.env.DB_NAME,    
      dialect: "postgres",
      operatorAliases: true
    },
    staging:{
      url: process.env.DB_URL,
      database: process.env.DB_NAME,    
      dialect: "postgres",
      operatorAliases: true
    }
}
