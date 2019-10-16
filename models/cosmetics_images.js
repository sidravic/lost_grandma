'use strict';

const Sequelize = require('sequelize');
const dbConn = require('./../config/db');

class Image extends Sequelize.Model {
  static init(sequelize, Sequelize) {
    return super.init({
      image_url: { type: Sequelize.STRING, allowNull: false  },
      cosmetics_product_id: { type: Sequelize.UUID, allowNull: false},
      cosmetics_brand_id: {type: Sequelize.UUID, allowNull: false},
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE
    }, {
      modelName: 'Image',
      tableName: 'cosmetics_images',
      sequelize: sequelize
    })
  }
}

Image.init(dbConn, Sequelize);
module.exports = Image;