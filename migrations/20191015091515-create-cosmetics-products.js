'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {

    const createCosmeticProducts = async () => {
      return queryInterface.createTable('cosmetics_products', {
        id: {
          allowNull: false,
          primaryKey: true,
          type: Sequelize.UUID,
          defaultValue: Sequelize.literal('gen_random_uuid()')
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        cosmetics_brand_id: {
          type: Sequelize.UUID,
          allowNull: false,
        },
        item_id: {
          type: Sequelize.STRING
        },
        usage: {
          type: Sequelize.JSON
        },
        ingredients: {
          type: Sequelize.TEXT
        },
        description: {
          type: Sequelize.TEXT
        },
        upc: {
          type: Sequelize.STRING
        },
        size: {
          type: Sequelize.STRING
        },
        price: {
          type: Sequelize.STRING
        },
        categories: {
          type: Sequelize.JSON
        },
        raw_dump: {
          type: Sequelize.JSON
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

    const addIndexOnProductName = () => {
      queryInterface.addIndex('cosmetics_products', ['name'], {indexName: 'idx_cproducts_name'})
    }

    const addUniqueIndexOnBrandIdUPC = () => {
      queryInterface.addIndex('cosmetics_products', ['cosmetics_brand_id', 'upc'], {indexName: 'idx_brand_id_upc', unique: true})
    }

    await createCosmeticProducts();
    await addIndexOnProductName();
    await addUniqueIndexOnBrandIdUPC();

  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('cosmetics_products');
  }
};