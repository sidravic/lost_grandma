'use strict';

const Sequelize = require('sequelizee');
const dbConn = require('./../config/db');

class Product extends Sequelize.Model {
  static init(sequelize, Sequelize) {
    return super.init({
      name: { type: Sequelize.STRING, allowNull: false },
      cosmeticsBrandId: {type: Sequelize.UUID, allowNull: false},
      itemId: {type: Sequelize.STRING},
      usage: {type: Sequelize.JSON},
      ingredients: {type: Sequelize.TEXT},
      description: {type: Sequelize.TEXT},
      upc: {type: Sequelize.STRING},
      size: {type: Sequelize.STRING},
      price: {type: Sequelize.STRING},
      rawDump: {type: Sequelize.JSON},
      categories: {type: Sequelize.JSON},
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    }, {
      modelName: 'Product',
      tableName: 'cosmetics_products',
      sequelize: sequelize
    });
  }
}

Product.init(dbConn, Sequelize);

module.exports = Product;