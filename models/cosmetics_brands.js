'use strict';

const Sequelize = require('sequelize');
const dbConn = require('./../config/db');

class Brand extends Sequelize.Model {
  static init(sequelize, Sequelize) {
    return super.init({
      name: { type: Sequelize.STRING, allowNull: false  },
      brand_name_slug: { type: Sequelize.STRING, allowNull: false, unique: { message: 'brand_name_slug must be unique', fields: 'brand_name_slug'}},
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE
    }, {
      modelName: 'Brand',
      tableName: 'cosmetics_brands',
      sequelize: sequelize
    })
  }
}


Brand.init(dbConn, Sequelize);

module.exports = Brand;