'use strict';

const Sequelize = require('sequelize');
const dbConn = require('./../config/db');

const defaultStates = {
    UPLOADING: 'uploading',
    TRAINING: 'training',
    PUBLISHED: 'published'
}

class ClassificationProject extends Sequelize.Model {

    static init(sequelize, Sequelize) {
        return super.init({
            name: {type: Sequelize.STRING, allowNull: false, unique: true},
            project_id: {type: Sequelize.UUID, allowNull: false, unique: true},
            status: {type: Sequelize.STRING, allowNull: false, defaultValue: defaultStates.UPLOADING},
            iteration_name: {type: Sequelize.STRING, allowNull: true},
            is_active: {type: Sequelize.BOOLEAN, defaultValue: false},
            createdAt: {allowNull: false, type: Sequelize.DATE},
            updatedAt: {allowNull: false, type: Sequelize.DATE}
        }, {
            modelName: 'ClassificationProject',
            tableName: 'classification_projects',
            sequelize: sequelize
        });
    }

    static associate(models) {
        this.hasMany(models.ClassifiedProduct, {foreignKey: 'classification_project_id'})
    }
}

ClassificationProject.defaultStates = defaultStates;
ClassificationProject.init(dbConn, Sequelize);

module.exports = ClassificationProject;