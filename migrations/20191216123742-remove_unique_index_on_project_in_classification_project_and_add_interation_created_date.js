'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        /*
          Add altering commands here.
          Return a promise to correctly handle asynchronicity.

          Example:
          return queryInterface.createTable('users', { id: Sequelize.INTEGER });
        */

        const removeUniqueIndexConstrainOnProjectId = async () => {
            return queryInterface.removeIndex('classification_projects', 'classification_projects_project_id');
        }

        const addColumnIterationCreatedAt = async () => {
            return queryInterface.addColumn('classification_projects', 'iteration_created_at', {type: Sequelize.DATE})
        }

        const adduniqueIndexOnProjectIdAndIterationName = async () => {
            return queryInterface.addIndex('classification_projects', ['project_id', 'iteration_name'], {unique: true})
        }

        await removeUniqueIndexConstrainOnProjectId()
        await addColumnIterationCreatedAt();
        await adduniqueIndexOnProjectIdAndIterationName();

    },

    down: async (queryInterface, Sequelize) => {
        /*
          Add reverting commands here.
          Return a promise to correctly handle asynchronicity.

          Example:
          return queryInterface.dropTable('users');
        */

        const addConstraintUniqueIndexOnProjectId = async () => {
            return queryInterface.addIndex('classification_projects', ['project_id'], {unique: true})
        }

        const removeColumnIterationCreatedAt = async () => {
            return queryInterface.removeColumn('classification_projects', 'iteration_created_at')
        }

        const removeIndexOnProjectIdAndIterationName = async () => {
            return queryInterface.removeIndex('classification_projects', ['project_id', 'iteration_name'])
        }


        await addConstraintUniqueIndexOnProjectId();
        await removeColumnIterationCreatedAt();
        await removeIndexOnProjectIdAndIterationName();

    }
};
