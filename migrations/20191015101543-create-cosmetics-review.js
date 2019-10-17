'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const createCosmeticsReviews = async() => {
      return queryInterface.createTable('cosmetics_reviews', {
        id: {
          allowNull: false,
          primaryKey: true,
          type: Sequelize.UUID,
          defaultValue: Sequelize.literal('gen_random_uuid()')
        },
        cosmetics_product_id: {
          type: Sequelize.UUID,
          allowNull: false,
        },
        cosmetics_brand_id: {
          type: Sequelize.UUID,
          allowNull: false
        },
        sephora_product_id: {
          type: Sequelize.STRING
        },
        sephora_brand_id: {
          type: Sequelize.STRING
        },
        review_product_description: {
          type: Sequelize.TEXT
        },
        image_url: {
          type: Sequelize.STRING
        },
        total_results: {
          type: Sequelize.BIGINT
        },
        first_review_date: {
          type: Sequelize.DATE
        },
        last_review_date: {
          type: Sequelize.DATE
        },
        raw_data: {
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

    const addIndexOnCosmeticsProductId = async() => {
      return queryInterface.addIndex('cosmetics_reviews', ['cosmetics_product_id'], {indexName: 'idx_creviews_cp_id'});
    }

    const addIndexOnCosmeticsBrandId = async() => {
      return queryInterface.addIndex('cosmetics_reviews', ['cosmetics_brand_id'], {indexName: 'idx_creviews_cb_id'});
    }

    const addUniqueIndexOnBrandIdProductId = async() => {
      return queryInterface.addIndex('cosmetics_reviews', ['cosmetics_brand_id', 'cosmetics_product_id'], {indexName: 'idx_creviews_brand_product', unique: true});
    }

    await createCosmeticsReviews();
    await addIndexOnCosmeticsProductId();
    await addIndexOnCosmeticsBrandId();
    await addUniqueIndexOnBrandIdProductId();
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('cosmetics_reviews');
  }
};