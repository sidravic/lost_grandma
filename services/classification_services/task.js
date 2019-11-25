const logger = require('./../../config/logger.js');
const createTrainingProject = require('./azure_classifier_training').createTrainingProject;
const {Brand, Product, Source, Image, ImageLabel, Review, ReviewComment, dbConn} = require('./../../models')
const Sequelize = require('sequelize');

const {findInBatches} = require('./../db_operations/find_in_batches')
const ClassificationQueue = require('./../../workers/classification_services/classification_queue').ClassificationQueue;
const findProductsForClassification = async (project) => {

    const op = Sequelize.Op;
    const options = {
        includedModels: [{
            model: Brand,
            required: true
        }, {
            model: Image,
            required: true,
            where: {s3_image_url: {[op.not]: null}},
            include: {
                required: false,
                model: ImageLabel,
                attributes: ['label']
            }
        }],
        limit: 200,
        attributes: ['id', 'name', 'cosmetics_brand_id', 'categories']
    }

    const onEachBatchCb = onEachBatch(project);
    await findInBatches(Product, 100, onEachBatchCb, options)
    return
}

const onEachBatch = (project) => {

    return (function (products) {
        Promise.all(products.map(async (product) => {
            let jobPayload = {product: product.toJSON(), project: project}
            const retryOptions = { removeOnComplete: true, removeOnFail: true };
            await ClassificationQueue.add('classification_queue', JSON.stringify(jobPayload), retryOptions);
        }))
    })
}

const main = () => {
    createTrainingProject().then((project) => {

        findProductsForClassification(project).then(() => {
            logger.info({
                src: 'task.js',
                event: 'findProductsForClassification',
                data: {status: 'completed'},
                error: {}
            })
        }).catch((e) => {
            logger.error({
                src: 'task.js',
                event: 'findProductsForClassification',
                data: {status: 'error'},
                error: {message: e.message, stack: e.stack}
            })
        })
    }).catch((e) => {
        logger.error({
            src: 'task.js',
            event: 'createTraingingProject',
            data: {},
            error: {message: e.message, stack: e.stack}
        });
    })
}

console.log(createTrainingProject)
main();
