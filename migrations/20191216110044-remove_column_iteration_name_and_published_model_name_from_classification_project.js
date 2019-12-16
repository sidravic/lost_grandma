'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */

    const removeIterationFromClassificationProject = async() => {
       return queryInterface.removeColumn('classification_projects', 'iteration')
    }

    const removePublishedModelNameFromClassificationProject = async() => {
      return queryInterface.removeColumn('classification_projects', 'published_model_name')
    }

    await removeIterationFromClassificationProject();
    await removePublishedModelNameFromClassificationProject();
  },

  down: async (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
    const addterationToClassificationProject = async() => {
      return queryInterface.addColumn('classification_projects', 'iteration', {type: Sequelize.INTEGER, defaultValue: 0})
    }

    const addPublishedModelNameToClassificationProject = async() => {
      return queryInterface.addColumn('classification_projects', 'published_model_name', {type: Sequelize.STRING})
    }

    await addterationToClassificationProject();
    await addPublishedModelNameToClassificationProject();
  }
};
