'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const dbConn = require('./../config/db')
const db = {};

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    debugger;
    // const model = sequelize['import'](path.join(__dirname, file));
    // db[model.name] = model;
    let modelPath = path.join(__dirname, file);
    let model = require(modelPath)
    db[model.name] = model.init(dbConn, Sequelize);
  });


Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});
console.log(db);
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
