'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const createCosmeticsReview = () => {
      return queryInterface.createTable('cosmetics_review_comments', {
        id: {
          allowNull: false,

          primaryKey: true,
          type: Sequelize.UUID,
          defaultValue: Sequelize.literal('gen_random_uuid()')
        },
        cosmetics_review_id: {
          type: Sequelize.UUID,
          allowNull: false
        },
        user_nickname: {
          type: Sequelize.STRING
        },
        rating: {
          type: Sequelize.STRING
        },
        review_text: {
          type: Sequelize.TEXT
        },
        review_title: {
          type: Sequelize.STRING
        },
        avataar_url: {
          type: Sequelize.STRING
        },
        other_data: {
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

  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('cosmetics_review_comments');
  }
};