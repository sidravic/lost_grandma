'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {

        const createClassificationProject = async () => {
            return queryInterface.createTable('classification_projects', {
                id: {
                    allowNull: false,
                    primaryKey: true,
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.literal('gen_random_uuid()')
                },
                project_id: {
                    type: Sequelize.UUID,
                    allowNull: false
                },
                name: {
                  type: Sequelize.STRING,
                  allowNull: false
                },
                iteration: {
                  type: Sequelize.INTEGER,
                  defaultValue: 0
                },
                status: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    defaultValue: 'uploading',
                },
                prediction_url: {
                    type: Sequelize.STRING(512),
                    allowNull: true,
                },
                published_model_name: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                is_active: {
                    type: Sequelize.BOOLEAN,
                    defaultValue: false
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

        const createUniqueIndexOnProjectId = async() => {
          return queryInterface.addIndex('classification_projects', ['project_id'], {unique: true})
        }

        await createClassificationProject();
        await createUniqueIndexOnProjectId();
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('classification_projects');
    }
};