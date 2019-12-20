const Joi = require('@hapi/joi')
const {any} = require('./../../../services/utils');
const { successResponse, failureResponse, badRequest, unauthorized, notFound} = require('./base_controller')
const { PredictionService } = require('./../../../services/prediction_services/clarifai/coordinator');



module.exports.Get = async (req, res, next) => {
    const requestBody = req.body;
    const errors = await requestValidators.validateGet(requestBody);

    if (any(errors)){
        const response = await badRequest(errors)
        return res.status(400).json(response);
    }


    const service = new PredictionService();
    try {
        const predictionResponse = await service.invoke(requestBody.image_url)

        const responsePayload = {
            image_url: requestBody.image_url,
            products: predictionResponse.products
        }

        const response = successResponse(responsePayload);
        return res.status(200).json(response);
    }catch(errorResponse) {
        const response = failureResponse(errorResponse.products)
        return res.status(200).json(response);
    }





}

const urlRegexPattern = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/
const imageUrlRegex = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+(?:png|jpg|jpeg|gif|svg)+$/

const requestValidators = {

    validateGet: async (requestBody) => {
        let errors = [];

        const schema = Joi.object({
            image_url: Joi.string().pattern(imageUrlRegex).required().messages({'string.pattern.base': 'must be a valid image url (jpg,png)'})
        });

        const validationResponse = schema.validate(requestBody)

        if (validationResponse.error) {
            errors = validationResponse.error.details.map((error) => {
                return {[error.context.key]: error.message}
            })
        }

        return errors;
    }
}