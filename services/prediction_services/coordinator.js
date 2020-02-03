const logger = require('../../config/logger.js');
const {BaseService, BaseServiceResponse} = require('../base_service');
const azurePredict = require('./azure_classifier_prediction')
const {Brand, Product, Source, Image, Review, ReviewComment, dbConn} = require('../../models')
const Sequelize = require('sequelize')

const predict = async (service) => {
    const predictionResponse = await azurePredict.predictUrl(service.urlForPrediction);
    service.predictionResponse = predictionResponse;
    const topPrediction = predictionResponse.predictions[0];
    const top5Predictions = predictionResponse.predictions.splice(0, 5)
    if (!topPrediction) {
        service.addErrors(['Top prediction not found'])
        service.errorCode = 'error_top_predicition_not_found';
        return service.predictionResponse;
    }

    service.topPredictionTag = topPrediction.tagName;
    service.predictionConfidence = topPrediction.probability;
    service.top5Predictions = top5Predictions;

    if (topPrediction.probability < 0.40) {
        service.addErrors(['Error low confidence'])
        service.errorCode = 'error_low_prediction_confidence';
        return service.predictionResponse;
    }

    return service.predictionResponse;

}

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

const fetchPredictedProduct = async (service) => {
    if (service.anyErrors()) {
        return;
    }

    const predictionProductIds = service.top5Predictions.map((prediction) => {
        return prediction.tagName;
    })

    const op = Sequelize.Op;
    const products = await Product.findAll( {
        where: {
          id: {[op.in]: predictionProductIds }
        },
        include: [{
            model: Brand, required: true,
            required: true,
            attributes: ['id', 'name']
        }, {
            model: Image,
            required: true,
            attributes: ['id', 's3_image_url', 'image_url']
        }],
        attributes: ['id', 'name', 'cosmetics_brand_id', 'usage', 'ingredients', 'description', 'price', 'size']
    })

    if (!products){
        service.addErrors(['product not found']);
        service.errorCode = 'error_product_not_found';
    }

    const sortedProducts = await sortProductsInOrder(predictionProductIds, products)
    service.products = sortedProducts;
    return sortedProducts;
}

class Coordinator extends BaseService {
    constructor() {
        super();
        this.urlForPrediction = null;
        this.predictionResponse = {};
        this.predictionConfidence = 0
        this.topPredictionTag = null;
        this.products = null;

    }

    async invoke(imageUrl) {
        this.urlForPrediction = imageUrl;
        await predict(this);
        await fetchPredictedProduct(this);

        return (new Promise((resolve, reject) => {
            const response = new CoordinatorResponse(this.errors, this.errorCode, this.urlForPrediction,
                this.predictionResponse, this.topPredictionTag, this.predictionConfidence, this.products)
            if (this.anyErrors()) {
                reject(response);
            } else {
                resolve(response);
            }
        }))
    }
}

class CoordinatorResponse extends BaseServiceResponse {
    constructor(errors, errorCode, imageUrl, predictionResponse, topPredictionTag, predictionConfidence, products) {
        super(errors, errorCode);

        this.imageUrl = imageUrl;
        this.predictionResponse = predictionResponse;
        this.topPredictionTag = topPredictionTag;
        this.predictionConfidence = predictionConfidence;
        this.products = products;
    }
}

module.exports = Coordinator;
