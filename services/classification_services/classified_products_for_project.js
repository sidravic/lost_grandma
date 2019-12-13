const {redisClient, asyncSAdd} = require('./../../config/redis_client');
const util = require('util');

const addProductToProject =  async (projectId, productId) => {
    if ((!projectId) || (!productId)) {
        throw new Error('projectId and productId cannot be null');    }

    const key = `classification:set:${projectId}`;
    const addStatus = await(asyncSAdd(key, productId));

    return addStatus;
}

const addImageForClassifiedProject = async (projectId, productId, imageUrl) => {
    if ((!projectId) || (!productId)) {
        throw new Error('projectId and productId cannot be null');
    }

    const key = `classificationImages:set:${projectId}:${productId}`;
    const addStatus = await(asyncSAdd(key, imageUrl))
    return addStatus;
}

const addUploadStatusesToRedis = async(classifierProject, productId, uploadStatuses) => {
    const projectId = classifierProject.id;
    const images = uploadStatuses.images;
    const promise = Promise.all(images.map(async(image, index) => {

        if(image.status == 'OK') {
            await addProductToProject(projectId, productId);
            await addImageForClassifiedProject(projectId, productId, image.sourceUrl)
        }
    }))

    return await promise;
}



module.exports.addProductToProject = addProductToProject;
module.exports.addImageForClassifiedProject = addImageForClassifiedProject;
module.exports.addUploadStatusesToRedis =addUploadStatusesToRedis


