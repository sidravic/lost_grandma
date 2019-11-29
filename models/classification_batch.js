'use strict';

const Sequelize = require('sequelize');
const dbConn = require('./../config/db');

class ClassificationBatch extends Sequelize.Model {
    static init(sequelize, Sequelize) {
        return super.init({
            active: {type: Sequelize.BOOLEAN, defaultValue: false},
            image_service: {type: Sequelize.BOOLEAN, defaultValue: false},
            image_service_invoked: {type: Sequelize.BOOLEAN, defaultValue: false},
            similar_image_service: {type: Sequelize.BOOLEAN, defaultValue: false},
            similar_image_service_invoked: {type: Sequelize.BOOLEAN, defaultValue: false},
            label_detection_service: {type: Sequelize.BOOLEAN, defaultValue: false},
            label_detection_service_invoked: {type: Sequelize.BOOLEAN, defaultValue: false},
            classification_service: {type: Sequelize.BOOLEAN, defaultValue: false},
            classification_service_invoked: {type: Sequelize.BOOLEAN, defaultValue: false},
            completed: {type: Sequelize.BOOLEAN, defaultValue: false},
            createdAt: Sequelize.DATE,
            updatedAt: Sequelize.DATE
        }, {
            modelName: 'ClassificationBatch',
            tableName: 'classification_batches',
            sequelize: sequelize
        })
    }

    static associate(models) {

    }

    async activate() {
        return (await this.update({active: true}))
    }

    async markStepComplete(stepName){
        return (await this.update({ [stepName]: true}))
    }

    async complete() {
        return (await this.update({completed: true}))
    }

    static async findLatestActiveBatch() {
        return (await ClassificationBatch.findOne({
            where: {active: true},
            order: [
                ["createdAt", "DESC"]
            ]
        }))
    }
};

ClassificationBatch.init(dbConn, Sequelize);
module.exports = ClassificationBatch

