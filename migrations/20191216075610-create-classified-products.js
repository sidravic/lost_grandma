'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        const createClassifiedProduct = async () => {
            return queryInterface.createTable('classified_products', {
                id: {
                    allowNull: false,
                    primaryKey: true,
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.literal('gen_random_uuid()')
                },
                classification_project_id: {
                    type: Sequelize.UUID,
                    allowNull: false
                },
                cosmetics_product_id: {
                    type: Sequelize.UUID,
                    allowNull: false
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

        const createIndexOnProjectId = async () => {
            return queryInterface.addIndex('classified_products', ['classification_project_id'])
        }

        const createUniqueIndexOnProductId = async () => {
            return queryInterface.addIndex('classified_products', ['classification_project_id', 'cosmetics_product_id'], {unique: true, indexName: 'idx_project_product'})
        }

        await createClassifiedProduct();
        await createIndexOnProjectId();
        await createUniqueIndexOnProductId();

    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('classified_products');
    }
};