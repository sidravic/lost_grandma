const logger = require('../../config/logger.js');
const {ClassificationProject} = require('./../../models');
const {PredictionAPIClient} = require("@azure/cognitiveservices-customvision-prediction");
const urlPredictionEndpoint = process.env.AZURE_CUSTOM_VISION_CLASSIFIER_PREDICTION_ENDPOINT;
const predictionKey = process.env.AZURE_CUSTOM_VISION_CLASSIFIER_PREDICTION_KEY;

const getPublishedModel = async () => {
    const classificationProject = await ClassificationProject.findOne({
        where: {
            status: ClassificationProject.defaultStates.PUBLISHED,
            is_active: true
        }
    }, {
        order: [
            ['updatedAt', 'desc'],
            ['createdAt', 'desc']
        ]
    })

    return classificationProject;
}

const predictUrl = async (imageUrl, endpoint = urlPredictionEndpoint) => {
    const classificationProject = {project_id: 'd1b72a4d-a142-41c4-8e59-fa80ae3e7a17', iteration_name: 'development-classifier-interation-$1579413357'}
    const projectId = classificationProject.project_id;
    const publishedModelName = classificationProject.iteration_name;
    const predictor = new PredictionAPIClient(predictionKey, endpoint);
    const predictionResponse = await predictor.classifyImageUrl(projectId, publishedModelName, {url: imageUrl});
    logger.info({
        src: 'azure_classifier_prediction',
        event: 'predictUrl',
        data: {predictionResponse: predictionResponse}
    })
    return predictionResponse;
}

const azurePredict = {
    predictUrl: predictUrl
}


module.exports = azurePredict;