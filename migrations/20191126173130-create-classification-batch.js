'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('classification_batches', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            active: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            image_service_invoked: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            image_service: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            similar_image_service_invoked: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            similar_image_service: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            label_detection_service_invoked: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            label_detection_service: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            classification_service_invoked: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            classification_service: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            completed: {
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
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('classification_batches');
    }
};