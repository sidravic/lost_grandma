const logger = require('./../../../config/logger');
const {BaseService, BaseServiceResponse} = require('./../../base_service');
const {predictImage} = require('./predict');
const {Product, Brand, Image} = require('./../../../models');
const Sequelize = require('sequelize');

const getPrediction = async (service) => {
    if (service.anyErrors()) {
        return;
    }

    try {
        const predictionResponse = await predictImage(service.imageUrl);
        service.predictionResponse = predictionResponse;
        return predictionResponse;
    } catch (e) {
        logger.error({
            src: 'service/prediction_services/fastai/coordinator',
            event: 'getPredictions',
            data: {imageUrl: service.imageUrl}, error: {message: e.message, stack: e.stack}
        })
        service.addErrors(e.message);
        service.errorCode = 'error_predicting_image';
        return
    }
}

// Not optimal but good enough for tiny arrays.
const sortProductsInOrder = async (predictionProductIds, products) => {
    const sortedProducts= [];

    predictionProductIds.forEach((productId) => {
        products.forEach((product) => {
            if (product.id == productId) {
                sortedProducts.push(product);
            }
        })
    })

    return sortedProducts;
}

const getProductAndImages = async (service) => {
    if (service.anyErrors()) {
        return;
    }

    const predictionScores = service.predictionResponse.data.prediction_scores;
    const predictionProductIds = predictionScores.map((productScore) => { return productScore[0]});
    const op = Sequelize.Op;
    const products = await Product.findAll({
        where: {
            id: {[op.in]: predictionProductIds }
        },
        limit: 20,
        include: [{
            model: Image,
            required: true,
            attributes: ['id', 's3_image_url', 'image_url']
        }, {
            model: Brand,
            required: true,
            attributes: ['id', 'name']
        }],
        attributes: ['id', 'name', 'cosmetics_brand_id', 'usage', 'ingredients', 'description', 'price', 'size']
    }, {raw: true})


    const sortedProducts = await sortProductsInOrder(predictionProductIds, products);
    service.products = sortedProducts.slice(0, 5);
    return products;

}

class FastAIPredictionService extends BaseService {
    constructor() {
        super();
        this.imageUrl = null;
    }

    async invoke(imageUrl) {
        this.imageUrl = imageUrl;

        if (!imageUrl) {
            this.addErrors(['Image cannot be blank']);
            this.errorCode = 'error_image_url_cannot_be_empty';
        }

        await getPrediction(this);
        await getProductAndImages(this);

        return (new Promise((resolve, reject) => {
            const predictionResponse = new FastAIPredictionServiceResponse(this.errors,
                this.errorCode,
                this.imageUrl,
                this.predictionResponse,
                this.products);

            if (this.anyErrors()) {
                reject(predictionResponse);
            } else {
                resolve(predictionResponse);
            }
        }))
    }
}

class FastAIPredictionServiceResponse extends BaseServiceResponse {
    constructor(errors, errorCode, imageUrl, predictionResponse, products) {
        super(errors, errorCode);
        this.imageUrl = imageUrl;
        this.predictionResponse = predictionResponse;
        this.products = products;
    }
}

module.exports.FastAIPredictionService = FastAIPredictionService;
module.exports.FastAIPredictionServiceResponse = FastAIPredictionServiceResponse;