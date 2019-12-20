const clarifaiApp = require('./../../../config/clarifai');

const predict = async (modelId, modelVersionId, imageUrl) => {
    const predictionResponse = clarifaiApp.models.predict({
        id: modelId,
        version: modelVersionId
    }, imageUrl)

    return predictionResponse;
}




module.exports.predict = predict;


