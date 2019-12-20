const uuid = require('uuid')
const ClarifaiApp = require('./../../../config/clarifai');



const createModel = async(tags) => {

    const modelName = `${process.env.NODE_ENV}-classifier`;
    const options = {
        conceptsMutuallyExclusive: true
    }
    const modelCreateResponse = await ClarifaiApp.models.create(modelName, [], options)
    return modelCreateResponse;
}

const addTags = async(modelId, modelVersion, tags) => {
    const model = await ClarifaiApp.models.initModel(modelId)
    const tagsAsObjects = tags.map((tag) => { return {id: tag } });
    const mergeConceptsStatus = await model.mergeConcepts(tagsAsObjects)
    return mergeConceptsStatus;
}

const trainModel = async(modelId) => {
    console.log(`training model ${modelId}`);
    const trainingResponse =  await ClarifaiApp.models.train(modelId)
    console.log(trainingResponse);
    return trainingResponse
}

module.exports.createModel = createModel;
module.exports.addTags = addTags;
module.exports.trainModel = trainModel;

