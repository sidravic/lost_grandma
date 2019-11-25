'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */

    const changeCosmeticImagesImageUrlColumnLength = async () => {
      queryInterface.changeColumn('cosmetics_images', 'image_url', {
        type: Sequelize.STRING(1275),
        allowNull: false
      })
    }

    await changeCosmeticImagesImageUrlColumnLength();
  },

  down: async (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */

    const changeCosmeticImagesImageUrlColumnLength = async () => {
      queryInterface.changeColumn('cosmetics_images', 'image_url', {
        type: Sequelize.STRING(255),
        allowNull: false
      })
    }

    await changeCosmeticImagesImageUrlColumnLength();

  }
};
