'use strict';

const Sequelize = require('sequelize');
const dbConn = require('./../config/db');

class Source extends Sequelize.Model {
    static init(sequelize, Sequelize) {
        return super.init({
            source_url: {type: Sequelize.STRING, allowNull: false},
            sourceable_type: {type: Sequelize.STRING, allowNull: false},
            sourceable_id: {type: Sequelize.UUID, allowNull: false},
            source_name: {type: Sequelize.STRING, allowNull: false, validate: {isIn: [Source.Sephora]}}
        }, {
            modelName: 'Source',
            tableName: 'cosmetics_sources',
            sequelize: sequelize
        })
    }

    static Sephora = 'sephora';

    static associate(models) {
        this.belongsTo(models.Product, {foreignKey: 'sourceable_id', targetKey: 'id'})
    }
}

Source.init(dbConn, Sequelize);

module.exports = Source;