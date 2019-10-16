'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {

    const createCosmeticsSources = async() => {
      return queryInterface.createTable('cosmetics_sources', {
        id: {
          allowNull: false,
          primaryKey: true,
          type: Sequelize.UUID,
          defaultValue: Sequelize.literal('gen_random_uuid()')
        },
        source_url: {
          type: Sequelize.STRING
        },
        sourceable_type: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        sourceable_id: {
          type: Sequelize.UUID,
          allowNull: false
        },
        source_name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE
        }
      });
    }

    const createIndexOnSourceableTypeAndSourceableId = async () => {
      return queryInterface.addIndex('cosmetics_sources', ['sourceable_type', 'sourceable_id'], { indexName: 'idx_csources_stype_sid'})
    }

    const createIndexOnSourceName = async() => {
      return queryInterface.addIndex('cosmetics_sources', ['source_name'], {indexName: 'idx_csources_name'})
    }

    await createCosmeticsSources();
    await createIndexOnSourceableTypeAndSourceableId();
    await createIndexOnSourceName();

  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('cosmetics_sources');
  }
};