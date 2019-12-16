const logger = require('./../../config/logger')
const {ClassifiedProduct} = require('./../../models');
const {redisClient, asyncSAdd} = require('./../../config/redis_client')
const util = require('util');

const addProductToProject = async (projectId, productId) => {
    if ((!projectId) || (!productId)) {
        throw new Error('projectId and productId cannot be null');
    }

    try {
        const classifiedProduct = await ClassifiedProduct.create({
            classification_project_id: projectId,
            cosmetics_product_id: productId
        })
        return classifiedProduct;
    } catch (e) {
        logger.error({
            src: 'classification_services/classified_products_for_project',
            event: 'addProductToProject',
            data: {},
            error: {message: e.message, stack: e.stack[0]}
        })
        return null;
    }
}

const addImageForClassifiedProject = async (projectId, productId, imageUrl) => {
    if ((!projectId) || (!productId)) {
        throw new Error('projectId and productId cannot be null');
    }

    const key = `classificationImages:set:${projectId}:${productId}`;
    const addStatus = await (asyncSAdd(key, imageUrl))
    return addStatus;
}

const addUploadStatuses = async (project, productId, uploadStatuses) => {
    const projectId = project.id;
    const images = uploadStatuses.images;

    await addProductToProject(projectId, productId);
    const promise = Promise.all(images.map(async (image, index) => {
        if (image.status == 'OK') {
            await addImageForClassifiedProject(projectId, productId, image.sourceUrl)
        }
    }))

    return await promise;
}


module.exports.addProductToProject = addProductToProject;
module.exports.addImageForClassifiedProject = addImageForClassifiedProject;
module.exports.addUploadStatuses = addUploadStatuses


