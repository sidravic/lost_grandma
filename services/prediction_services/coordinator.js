const logger = require('./../../config/logger.js');
const {BaseService, BaseServiceResponse} = require('./../base_service');
const {predictUrl} = require('./azure_classifier_prediction')
const {Brand, Product, Source, Image, Review, ReviewComment, dbConn} = require('./../../models')

const predict = async (service) => {
    const projectId = process.env.PUBLISHED_PROJECT;
    const predictionResponse = await predictUrl(projectId, service.urlForPrediction);
    service.predictionResponse = predictionResponse;

    const topPrediction = predictionResponse.predictions[0];

    if (!topPrediction){
        service.addErrors(['Top prediction not found'])
        service.errorCode = 'error_top_predicition_not_found';
        return service.predictionResponse;
    }

    service.topPredictionTag = topPrediction.tagName;
    service.predictionConfidence = topPrediction.probability;

    if(topPrediction.probability < 0.80){
        service.addErrors(['Error low confidence'])
        service.errorCode = 'error_low_prediction_confidence';
        return service.predictionResponse;
    }

    return service.predictionResponse;

}

const fetchPredictedProduct = async (service) => {

    const product = await Product.findByPk(service.topPredictionTag.toString(), {
        include: [{
            model: Brand, required: true
        }, {
            model: Image, required: true
        }]
    })

    service.product = product;
    return product;
}


class Coordinator extends BaseService {
    constructor() {
        super();
        this.urlForPrediction = null;
        this.predictionResponse = {};
        this.predictionConfidence = 0
        this.topPredictionTag = null;
        this.product = null;

    }

    async invoke(imageUrl) {
        this.urlForPrediction = imageUrl;
        await predict(this);
        await fetchPredictedProduct(this);

        return (new CoordinatorResponse(this.errors, this.errorCode, this.urlForPrediction,
            this.predictionResponse, this.topPredictionTag, this.predictionConfidence, this.product))

    }
}

class CoordinatorResponse extends BaseServiceResponse{
    constructor(errors, errorCode, urlForPrediction, predictionResponse, topPredictionTag, predictionConfidence, product){
        super(errors, errorCode);
        this.urlForPrediction = urlForPrediction;
        this.predictionResponse = predictionResponse;
        this.topPredictionTag = topPredictionTag;
        this.predictionConfidence = predictionConfidence;
        this.product = product;
    }
}

module.exports = Coordinator;