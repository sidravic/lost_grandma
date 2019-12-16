const logger = require('./../../config/logger.js');
const {TrainingAPIClient} = require("@azure/cognitiveservices-customvision-training");
const trainingKey = process.env.AZURE_CUSTOM_VISION_CLASSIFIER_KEY;
const trainingEndpoint = process.env.AZURE_CUSTOM_VISION_CLASSIFIER_ENDPOINT;
const {ClassificationProject, dbConn} = require('./../../models')
const {sleep} = require('./../utils');


const getIterationName = () => {
    return `${process.env.NODE_ENV}-iteration-${new Date().getTime()}`;
}

const getProjectName = () => {
    return `${process.env.NODE_ENV}-classifier-${new Date().getTime()}`
}

const trainer = new TrainingAPIClient(trainingKey, trainingEndpoint);

const createTrainingProject = async () => {

    logger.info({
        src: 'azure_classifier_training',
        event: 'createTrainingProject',
        data: {status: 'started'},
        error: {}
    });
    const projectName = getProjectName();
    const projectOptions = {
        classificationType: 'Multiclass'
    }
    const project = await trainer.createProject(projectName, projectOptions);
    return project;
};

const batchUploadImages = async (project, batch) => {
    const onUploadProgress = (event) => {
        logger.debug({src: 'azure_classifier_training', event: 'onUploadProgress', data: {progress: event}});
    }

    const onDownloadProgress = (event) => {
        logger.debug({src: 'azure_classifier_training', event: 'onDownloadProgress', data: {progress: event}});
    }

    const options = {
        onUploadProgress: onUploadProgress,
        onDownloadProgress: onDownloadProgress
    }


    return (await trainer.createImagesFromUrls(project.project_id, batch, options));
}

const deleteTag = async (project, tagId) => {
    return await trainer.deleteTag(project.project_id, tagId)
}

const deleteImages = async (project, imageIds) => {
    return await trainer.deleteImages(project.project_id, imageIds);
}

const createTag = async (project, name) => {
    return await trainer.createTag(project.project_id, name)
}

const createProject = async () => {
    const project = await createTrainingProject()
    const classificationProject = await ClassificationProject.create({
        name: project.name,
        project_id: project.id
    })

    return classificationProject;
}

const findLastClassified = async () => {
    const classificationProject = await ClassificationProject.findOne({
        where: {
            status: ClassificationProject.defaultStates.UPLOADING,
            is_active: false
        }
    })

    return classificationProject;
}

const trainProjectAndPublish = async (project) => {
    const response = {trainingIteration: null, publishedIteration: null};
    const predictionResourceId = process.env.AZURE_CUSTOM_VISION_PREDICTION_RESOURCE_ID
    let trainingIteration = await trainer.trainProject(project.project_id)
    const publishIterationName = getIterationName();
    logger.info({src: 'classification_service/azure_classifier_training', event: 'trainAndPublish'})

    await ClassificationProject.update({
        iteration_name: publishIterationName,
        status: ClassificationProject.defaultStates.TRAINING
    }, {where: {project_id: project.project_id}});

    while (trainingIteration.status == "Training") {
        console.log("Training status: " + trainingIteration.status);
        await sleep(2);
        trainingIteration = await trainer.getIteration(project.project_id, trainingIteration.id)
        console.log(trainingIteration);
        response.trainingIteration = trainingIteration;
    }

    const publishedIteration = await trainer.publishIteration(project.project_id, trainingIteration.id,
        publishIterationName, predictionResourceId)

    await ClassificationProject.update({
        status: ClassificationProject.defaultStates.PUBLISHED,
        is_active: true
    }, {where: {iteration_name: publishIterationName, project_id: project.project_id}})
    response.publishedIteration = publishedIteration;
    return response;
}


module.exports.createTrainingProject = createTrainingProject;
module.exports.batchUploadImages = batchUploadImages;
module.exports.createTag = createTag;
module.exports.deleteTag = deleteTag;
module.exports.deleteImages = deleteImages;
module.exports.createProject = createProject;
module.exports.findLastClassified = findLastClassified;
module.exports.trainProjectAndPublish = trainProjectAndPublish;
//https://www.customvision.ai/projects
