const logger = require('../../config/logger.js');
const { PredictionAPIClient } = require("@azure/cognitiveservices-customvision-prediction");
const urlPredictionEndpoint = process.env.AZURE_CUSTOM_VISION_CLASSIFIER_PREDICITION_ENDPOINT;
const predictionKey = process.env.AZURE_CUSTOM_VISION_CLASSIFIER_PREDICTION_KEY;

const predictUrl = async(projectId, imageUrl, endpoint=urlPredictionEndpoint) => {
    const publishedModelName = process.env.PUBLISHED_MODEL_NAME;
    const predictor = new PredictionAPIClient(predictionKey, endpoint);
    const predictionResponse = await predictor.classifyImageUrl(projectId, publishedModelName, {url: imageUrl});
    logger.info({src: 'azure_classifier_prediction', event: 'predictUrl', data: {predictionResponse: predictionResponse}})
    return predictionResponse;
}

const azurePredict = {
    predictUrl: predictUrl
}



module.exports = azurePredict;

