'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {

    const createCosmeticsImages  = async () => {
      return queryInterface.createTable('cosmetics_images', {
        id: {
          allowNull: false,
          primaryKey: true,
          type: Sequelize.UUID,
          defaultValue: Sequelize.literal('gen_random_uuid()')
        },
        image_url: {
          allowNull: false,
          type: Sequelize.STRING
        },
        cosmetics_product_id: {
          allowNull: false,
          type: Sequelize.UUID
        },
        cosmetics_brand_id: {
          allowNull: false,
          type: Sequelize.UUID
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

    const addIndexOnCosmeticsProductId = async() => {
      return queryInterface.addIndex('cosmetics_images', ['cosmetics_product_id'], {indexName: 'idx_cimages_cp_id'});
    }

    const addIndexOnCosmeticsBrandId = async() => {
      return queryInterface.addIndex('cosmetics_images', ['cosmetics_brand_id'], {indexName: 'idx_cimages_cb_id'});
    }

    const addUniqueIndexProductIdBrandIdUrl = async() => {
      return queryInterface.addIndex('cosmetics_images', ['cosmetics_brand_id', 'cosmetics_product_id', 'image_url'], {indexName: 'idx_cbrandproductimage', unique: true});
    }

    await createCosmeticsImages();
    await addIndexOnCosmeticsProductId();
    await addIndexOnCosmeticsBrandId();
    await addUniqueIndexProductIdBrandIdUrl();
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('cosmetics_images');
  }
};