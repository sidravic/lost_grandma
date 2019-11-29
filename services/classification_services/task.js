const logger = require('./../../config/logger.js');
const createTrainingProject = require('./azure_classifier_training').createTrainingProject;
const {Brand, Product, Source, Image, ImageLabel, Review, ReviewComment, dbConn} = require('./../../models')
const Sequelize = require('sequelize');

const {findInBatches} = require('./../db_operations/find_in_batches')
const ClassificationQueue = require('./../../workers/classification_services/classification_queue').ClassificationQueue;
const findProductsForClassification = async (project) => {

    const productIds = await getApplicableIds();

    const op = Sequelize.Op;
    const options = {
        attributes: [ 'id', 'name', 'cosmetics_brand_id', 'categories'],
        includedModels: [{
            model: Brand,
            required: true,
            attributes: ['name', 'id']
        }, {
            model: Image,
            required: true,
            attributes: ['id', 'image_url', 's3_image_url'],
            include: {
                required: false,
                model: ImageLabel,
                attributes: ['id','label']
            }
        }],
        whereClause: { id: { [op.in]: productIds }}
    }


    const onEachBatchCb = onEachBatch(project);
    await findInBatches(Product, 1000, onEachBatchCb, options)
    return
}

const onEachBatch = (project) => {

    return (async function (products) {

        const promise = Promise.all(products.map(async (product) => {
            let jobPayload = {product: product.toJSON(), project: project}
            const retryOptions = {removeOnComplete: true, removeOnFail: true};
            await ClassificationQueue.add('classification_queue', JSON.stringify(jobPayload), retryOptions);
        }))

        await promise;
        return;
    })
}



const main = async () => {

    const project = await createTrainingProject();
    await findProductsForClassification(project);
    logger.info({
        src: 'task.js',
        event: 'findProductsForClassification',
        data: {status: 'completed'},
        error: {}
    })
    return;

}

const getApplicableIds = async() => {

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
        "                                 HAVING COUNT(ci.id) > 5 " +
        "                             ) more_than_5_images)";


    const [productIdsArray, result] = await dbConn.query(validProductIdsQuery)
    const productIds = productIdsArray.map((productIds) => { return productIds.id })
    return productIds;
}


module.exports = main;


