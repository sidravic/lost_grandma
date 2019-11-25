'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        /*
          Add altering commands here.
          Return a promise to correctly handle asynchronicity.

          Example:
          return queryInterface.createTable('users', { id: Sequelize.INTEGER });
        */
        const addColumnImageSource = async () => {
            return queryInterface.addColumn('cosmetics_images', 'source', {
                type: Sequelize.STRING(),
                defaultValue: "sephora"
            })
        }

        const indexColumnImageSource = async () => {
            return queryInterface.addIndex('cosmetics_images', ['source']);
        }

        await addColumnImageSource();
        await indexColumnImageSource();
    },

    down: async (queryInterface, Sequelize) => {
        /*
          Add reverting commands here.
          Return a promise to correctly handle asynchronicity.

          Example:
          return queryInterface.dropTable('users');
        */

        const deleteIndexImageSource = async () => {
            return queryInterface.removeIndex('cosmetics_images', 'source');
        }

        const removeColumnImageSource = async () => {
            return queryInterface.removeColumn('cosmetics_images', 'source')
        }

        await deleteIndexImageSource();
        await removeColumnImageSource();
    }
};
