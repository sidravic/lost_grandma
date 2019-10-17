'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        const createCosmeticsReview = async () => {
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
                submitted_date: {
                    type: Sequelize.DATE,
                },
                modified_date: {
                    type: Sequelize.DATE,
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

        const createIndexOnReviewId = async () => {
            return queryInterface.addIndex('cosmetics_review_comments', ['cosmetics_review_id'])
        }

        await createCosmeticsReview();
        await createIndexOnReviewId();
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('cosmetics_review_comments');
    }
};