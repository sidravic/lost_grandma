const logger = require('./../../config/logger.js');
const {TrainingAPIClient} = require("@azure/cognitiveservices-customvision-training");
const trainingKey = process.env.AZURE_CUSTOM_VISION_CLASSIFIER_KEY;
const trainingEndpoint = process.env.AZURE_CUSTOM_VISION_CLASSIFIER_ENDPOINT;


const getIterationName = () => {
    return `${process.env.NODE_ENV}-classifier-1`;
}

const getProjectName = () => {
    return `${process.env.NODE_ENV}-classifier`
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
        logger.debug({src: 'azure_classifier_training', event: 'onUploadProgress', data: { progress: event }});
    }

    const onDownloadProgress = (event) => {
        logger.debug({src: 'azure_classifier_training', event: 'onDownloadProgress', data: { progress: event }});
    }

    const options = {
        onUploadProgress: onUploadProgress,
        onDownloadProgress: onDownloadProgress
    }


    return (await trainer.createImagesFromUrls(project.id, batch, options));
}

const createTag = async(project, name) => {
     return await trainer.createTag(project.id, name)
}


module.exports.createTrainingProject = createTrainingProject;
module.exports.batchUploadImages = batchUploadImages;
module.exports.createTag = createTag;
//https://www.customvision.ai/projects
