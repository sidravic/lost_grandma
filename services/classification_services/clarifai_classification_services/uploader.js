const logger = require('./../../../config/logger.js');
const ClarifaiApp = require('./../../../config/clarifai');
const {getSignedGETUrlFromS3Url} = require('./../../image_services/s3_operations');
const {any} = require('./../../utils');


const uploadImagesWithTag = async (product = null) => {
    const images = product.Images;

    if (!any(images)) {
        throw new Error('Images cannot be empty');
    }

    const validImages = images.filter((image) => {
        return ((image.s3_image_url) ? true : false);
    })

    const formattedPayloadPromise = Promise.all(validImages.map(async (image) => {
        return {
            id: image.id,
            url: (await getSignedGETUrlFromS3Url(image.s3_image_url)),
            allowDuplicateUrl: true,
            concepts: [{
                id: product.id,
                value: true
            }]
        }
    }))

    const formattedPayload = await formattedPayloadPromise;

    try {
        const uploadResponse = await ClarifaiApp.inputs.create(formattedPayload)
        return uploadResponse;
    } catch (e) {
        return new Promise((resolve, reject) =>  reject(e) )
    }
}


module.exports.uploadImagesWithTag = uploadImagesWithTag;


