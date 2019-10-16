'use strict';

const Sequelize = require('sequelize');
const dbConn = require('./../config/db');

class Source extends Sequelize.Model{
  static init(sequelize, Sequelize) {
    return super.init({
        sourceUrl: { type: Sequelize.STRING, allowNull: false },
        sourceableType: { type: Sequelize.STRING, allowNull: false },
        sourceableId: { type: Sequelize.UUID, allowNull: false },
        sourceName: { type: Sequelize.STRING, allowNull: false, validate: {isIn: [Source.Sephora] } }
    }, {
      modelName: 'Source',
      tableName: 'cosmetics_sources',
      sequelize: sequelize
    })
  }

  static Sephora = 'sephora';
}

Source.init(dbConn, Sequelize);

module.exports = Source;