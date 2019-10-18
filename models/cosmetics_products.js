'use strict';

const Sequelize = require('sequelize');
const dbConn = require('./../config/db');

class Product extends Sequelize.Model {
    static init(sequelize, Sequelize) {
        return super.init({
            name: {type: Sequelize.STRING, allowNull: false},
            cosmetics_brand_id: {type: Sequelize.UUID, allowNull: false},
            item_id: {type: Sequelize.STRING},
            usage: {type: Sequelize.JSON},
            ingredients: {type: Sequelize.TEXT},
            description: {type: Sequelize.TEXT},
            upc: {type: Sequelize.STRING},
            size: {type: Sequelize.STRING},
            price: {type: Sequelize.STRING},
            raw_dump: {type: Sequelize.JSON},
            categories: {type: Sequelize.JSON},
            createdAt: {allowNull: false, type: Sequelize.DATE},
            updatedAt: {allowNull: false, type: Sequelize.DATE}
        }, {
            modelName: 'Product',
            tableName: 'cosmetics_products',
            sequelize: sequelize
        });
    }

    static associate(models) {
        this.belongsTo(models.Brand, {foreignKey: 'cosmetics_brand_id'})
        this.hasOne(models.Review, {targetKey: 'cosmetics_product_id', sourceKey: 'id', foreignKey: 'cosmetics_product_id'})
        this.hasMany(models.Source, { foreignKey: 'id', targetKey: 'sourceable_id'})
    }

    asJSON(){
      let attributes = {...this.dataValues}
    }
}

Product.init(dbConn, Sequelize);

module.exports = Product;