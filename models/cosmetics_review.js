'use strict';

const Sequelize = require('sequelize');
const dbConn = require('./../config/db');

class Review extends Sequelize.Model {
  static init(sequelize, Sequelize) {
    return super.init({
      cosmetics_product_id: {type: Sequelize.UUID, allowNull: false},
      cosmetics_brand_id: {type: Sequelize.UUID, allowNull: false},
      sephora_product_id: {type: Sequelize.STRING},
      sephora_brand_id: {type: Sequelize.STRING},
      review_product_description: {type: Sequelize.TEXT},
      image_url: {type: Sequelize.STRING},
      total_results: {type: Sequelize.BIGINT, defaultValue: 0},
      first_review_date: {type: Sequelize.DATE},
      last_review_date: {type: Sequelize.DATE},
      raw_data: {type: Sequelize.JSON},
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE
    }, {
      modelName: 'Review',
      tableName: 'cosmetics_reviews',
      sequelize: sequelize
    })
  }

  static associate(models) {
    this.belongsTo(models.Product, { foreignKey: 'cosmetics_product_id', targetKey: 'id', sourceKey: 'cosmetics_brand_id'})
    this.belongsTo(models.Brand, {foreignKey: 'cosmetics_brand_id', targetKey: 'id', sourceKey: 'cosmetics_brand_id'})
    this.hasMany(models.ReviewComment, {sourceKey: 'id', targetKey: 'cosmetics_review_id'})
  }
}

Review.init(dbConn, Sequelize);

module.exports = Review;