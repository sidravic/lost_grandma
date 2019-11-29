'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const addS3ImageUrl = async () => {
      return queryInterface.addColumn('cosmetics_images', 's3_image_url', {
        type: Sequelize.STRING(510),
        allowNull: true        
      })
    }

    const addAzureBlobStoreUrl = async() => {
      return queryInterface.addColumn('cosmetics_images', 'azure_image_url', {
        type: Sequelize.STRING(510),
        allowNull: true        
      })
    }
    
    await addS3ImageUrl();
    await addAzureBlobStoreUrl();
  },

  down: async (queryInterface, Sequelize) => {    
    const removeS3ImageUrlColumn = async() => {
      return queryInterface.removeColumn('cosmetics_images', 's3_image_url');
    }

    const removeAzureImageUrlColumn = async() => {
      return queryInterface.removeColumn('cosmetics_images', 'azure_image_url');
    }

    await removeS3ImageUrlColumn();
    await removeAzureImageUrlColumn();
    
  }
};
