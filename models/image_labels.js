'use strict';

const Sequelize = require('sequelize');
const dbConn = require('./../config/db');

class ImageLabel extends Sequelize.Model {
  static init(sequelize, Sequelize) {
    return super.init({
      cosmetics_image_id: { type: Sequelize.UUID, allowNull: false },
      label: { type: Sequelize.STRING, allowNull: false},
      confidence: { type: Sequelize.DOUBLE, allowNull: false},
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE
    }, {
      modelName: 'ImageLabel',
      tableName: 'image_labels',
      sequelize: sequelize
    })
  }

  static associateTo(models){
    this.belongsTo(models.Image, {foreignKey: 'cosmetics_label_id', targetKey: 'id', sourceKey: 'cosmetics_image_id'})
  }
};

ImageLabel.init(dbConn, Sequelize);
module.exports = ImageLabel;
