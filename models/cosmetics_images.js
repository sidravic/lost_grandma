'use strict';

const Sequelize = require('sequelize');
const dbConn = require('./../config/db');

class Image extends Sequelize.Model {
  static init(sequelize, Sequelize) {
    return super.init({
      image_url: { type: Sequelize.STRING, allowNull: false, unique: true  },
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

  static associate(models){
    this.belongsTo(models.Product, {foreignKey: 'cosmetics_product_id', targetKey: 'id'})
    this.belongsTo(models.Brand, {foreignKey: 'cosmetics_brand_id', targetKey: 'id'})
  }
}

Image.init(dbConn, Sequelize);
module.exports = Image;