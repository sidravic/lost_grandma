'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */

    const addIterationNameToClassificationProject = async () => {
      return queryInterface.addColumn('classification_projects', 'iteration_name', {type: Sequelize.STRING})
    }

    await addIterationNameToClassificationProject();
  },

  down: async (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
    const removeIterationNameFromClassificationProject = async () => {
      return queryInterface.removeColumn('classification_projects', 'iteration_name')
    }

    await removeIterationNameFromClassificationProject();
  }
};
