'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const createImageLabels = async () => {
      return queryInterface.createTable('image_labels', {
        id: {
          allowNull: false,
          primaryKey: true,
          type: Sequelize.UUID,
          defaultValue: Sequelize.literal('gen_random_uuid()')
        },
        cosmetics_image_id: {
          type: Sequelize.UUID,
          allowNull: false
        },
        label: {
          type: Sequelize.STRING,
          allowNull: false
        },
        confidence: {
          type: Sequelize.DOUBLE,
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

    const createIndexOnCosmeticsImageId = async () => {
      return queryInterface.addIndex('image_labels', ['cosmetics_image_id'])
    }

    const createIndexOnLabel = async () => {
      return queryInterface.addIndex('image_labels', ['label'])
    }

    const createUniqueIndexOnLabelAndCosmeticsImageId =  async() => {
      return queryInterface.addIndex('image_labels', ['label', 'cosmetics_image_id'],  {indexName: 'idx_label_image_id', unique: true })
    }

    await createImageLabels();
    await createIndexOnCosmeticsImageId();
    await createIndexOnLabel();
    await createUniqueIndexOnLabelAndCosmeticsImageId();

  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('image_labels');
  }
};