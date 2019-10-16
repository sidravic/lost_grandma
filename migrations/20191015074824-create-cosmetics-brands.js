'use strict';
module.exports = {
  /*
   Ensure the database already has this enabled

   enable_extension 'pgcrypto'
  * */
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('cosmetics_brands', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      brand_name_slug: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING
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
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('cosmetics_brands');
  }
};