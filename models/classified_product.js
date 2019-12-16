'use strict';
const Sequelize = require('sequelize');
const dbConn = require('./../config/db');

class ClassifiedProduct extends Sequelize.Model {
    static init(sequelize, Sequelize) {
        return super.init({
            classification_project_id: {type: Sequelize.UUID, allowNull: false},
            cosmetics_product_id: {type: Sequelize.UUID, allowNull: false},
            createdAt: Sequelize.DATE,
            updatedAt: Sequelize.DATE
        }, {
            modelName: 'ClassifiedProduct',
            tableName: 'classified_products',
            sequelize: sequelize
        })
    }

    static associate(models) {
        this.belongsTo(models.ClassificationProject, {foreignKey: 'classification_project_id'})
        this.belongsTo(models.Product, {foreignKey: 'cosmetics_product_id'})
    }
}

ClassifiedProduct.init(dbConn, Sequelize);
module.exports = ClassifiedProduct;