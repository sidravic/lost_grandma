const logger = require('./../../../config/logger.js');
const {asyncSet, asyncSAdd, asyncIncr, asyncGet, asyncSmembers} = require('./../../../config/redis_client')
const {Brand, Product, Source, Image, ImageLabel, Review, ReviewComment, dbConn} = require('./../../../models')
const Sequelize = require('sequelize');
const {findInBatches} = require('./../../db_operations/find_in_batches');
const {createModel, addTags, trainModel} = require('./trainer.js')
const {predict} = require('./predicter');
const {ClarifaiUploaderQueue, ClarifaiUploaderQueueWorker} = require('./../../../workers/clarifai_services/clarifai_uploader_queue')


const findProductsForClassification = async (uploadKey) => {

    const productIds = await getApplicableIds();
    const op = Sequelize.Op;
    const options = {
        ignoreBatchSizeChecks: true,
        attributes: ['id', 'name', 'cosmetics_brand_id', 'categories'],
        includedModels: [{
            model: Brand,
            required: true,
            attributes: ['name', 'id']
        }, {
            model: Image,
            required: true,
            attributes: ['id', 'image_url', 's3_image_url', 'cosmetics_product_id'],
            include: {
                required: false,
                model: ImageLabel,
                attributes: ['id', 'label']
            }
        }],
        whereClause: {id: {[op.in]: productIds}},
    }


    const onEachBatchCb = onEachBatch(uploadKey);
    await findInBatches(Product, 1000, onEachBatchCb, options)
    return
}

const onEachBatch = (uploadKey) => {

    return (async function (products) {

        const promise = Promise.all(products.map(async (product) => {
            try {


                const retryOptions = {removeOnComplete: true, removeOnFail: true, attempts: 0}
                const job = await ClarifaiUploaderQueue.add('clarifai-uploader-queue',
                    JSON.stringify({
                        product: product.toJSON(),
                        uploadKey: uploadKey
                    }), retryOptions)

                logger.info({
                    src: 'clarifai_classification_services/task',
                    event: 'onEachBatch',
                    data: {message: 'Job enqueued', jobId: job.id, status: 'success'}
                })
            } catch (e) {
                logger.error({
                    src: 'clarifai_classification_services/task',
                    event: 'onEachBatch',
                    data: {},
                    error: {message: e.message, code: e.stack}
                })
            }
        }));

        await promise;
        return;
    })
}

const getUploadKey = async () => {
    const uploadVersion = await asyncGet('clarifai-upload')
    const uploadKey = `clarifai:${uploadVersion}`
    return uploadKey;
}

const incrementUploadVersion = async () => {
    return (await asyncIncr('clarifai-upload'));
}

const main = async () => {
    await incrementUploadVersion();
    const uploadKey = await getUploadKey();
    await findProductsForClassification(uploadKey);

    logger.info({
        src: 'task.js',
        event: 'findProductsForClassification',
        data: {status: 'completed'},
        error: {}
    })

    return;

}

const getApplicableIds = async () => {

    const validProductIdsQuery = "" +
        "SELECT DISTINCT(Product.Id) from cosmetics_products as Product " +
        "       INNER JOIN cosmetics_brands Brand on Product.cosmetics_brand_id = Brand.id " +
        "       INNER JOIN cosmetics_images Image ON Image.cosmetics_product_id = Product.id " +
        "       LEFT OUTER JOIN image_labels ImageLabel ON Image.id = ImageLabel.cosmetics_image_id " +
        "WHERE Image.s3_image_url IS NOT NULL " +
        "AND Product.Id in (SELECT product_id as id from ( " +
        "                                 SELECT cp.id as product_id, COUNT(ci.id) as image_count " +
        "                                 from cosmetics_products cp " +
        "                                          INNER JOIN cosmetics_images ci ON cp.id = ci.cosmetics_product_id " +
        "                                 GROUP BY cp.id " +
        "                                 HAVING COUNT(ci.id) > 3 " +
        "                             ) more_than_5_images)";


    const [productIdsArray, result] = await dbConn.query(validProductIdsQuery)
    const productIds = productIdsArray.map((productIds) => {
        return productIds.id
    })
    return productIds;
}

const persistModel = async (modelParams) => {
    const persistStatus = await asyncSet('clarifai:active_model', JSON.stringify(modelParams))
    return persistStatus;
}

const buildModel = async () => {

    const createModelResponse = (await createModel([]));
    await persistModel(createModelResponse);
    return createModelResponse;
}

const addTagsToModel = async () => {
    const uploadKey = await getUploadKey();
    const tags = await asyncSmembers(uploadKey)
    const getActiveModel = await asyncGet('clarifai:active_model');
    const modelJSON = JSON.parse(getActiveModel);
    const modelId = modelJSON.id;
    const modelVersionId = modelJSON.modelVersion.id;

    const trainStatus = await addTags(modelId, modelVersionId, tags)
    return trainStatus;
}

const trainModelVersion = async () => {
    const uploadKey = await getUploadKey();
    const tags = await asyncSmembers(uploadKey)
    const getActiveModel = await asyncGet('clarifai:active_model');
    const modelJSON = JSON.parse(getActiveModel);
    const modelId = modelJSON.id;
    const modelVersionId = modelJSON.modelVersion.id;
    const trainingResponse = await trainModel(modelId);
    await persistModel(trainingResponse)
    return trainingResponse;
}

const predictImage = async (imageUrl) => {
    const getActiveModel = await asyncGet('clarifai:active_model');
    const modelJSON = JSON.parse(getActiveModel);
    const modelId = modelJSON.id;
    const modelVersionId = modelJSON.modelVersion.id;
    const predictionResponse = await predict(modelId, modelVersionId, imageUrl);
    return predictionResponse;
}


module.exports.upload = main;
module.exports.addTagsToModel = addTagsToModel;
module.exports.buildModel = buildModel;
module.exports.getUploadKey = getUploadKey;
module.exports.incrementUploadVersion = incrementUploadVersion;
module.exports.trainModelVersion = trainModelVersion;
module.exports.predictImage = predictImage;