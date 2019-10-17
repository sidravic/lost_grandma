'use strict';
'use strict';

const Sequelize = require('sequelize');
const dbConn = require('./../config/db');

class ReviewComment extends Sequelize.Model {
    static init(sequelize, Sequelize) {
        return super.init({
            cosmetics_review_id: {type: Sequelize.UUID, allowNull: false},
            user_nickname: {type: Sequelize.STRING},
            rating: {type: Sequelize.STRING},
            review_text: {type: Sequelize.TEXT},
            review_title: {type: Sequelize.STRING},
            avataar_url: {type: Sequelize.STRING},
            submitted_date: {type: Sequelize.DATE},
            modified_date: {type: Sequelize.DATE},
            other_data: {type: Sequelize.JSON},
            createdAt: Sequelize.DATE,
            updatedAt: Sequelize.DATE
        }, {
            modelName: 'ReviewComment',
            tableName: 'cosmetics_review_comments',
            sequelize: sequelize
        })
    }

    static associate(models) {
        this.belongsTo(models.Review, { foreignKey: 'cosmetics_review_id', targetKey: 'id', sourceKey: 'cosmetics_review_id'})
    }
}

ReviewComment.init(dbConn, Sequelize);

module.exports = ReviewComment;