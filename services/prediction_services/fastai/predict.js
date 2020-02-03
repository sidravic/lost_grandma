const FASTAI_HOST = require('../../../config/fastai').FASTAI_HOST
const Axios = require('axios');
const PREDICT_PATH = `${FASTAI_HOST}/api/v1/predict`

const predictImage = async (imageUrl) => {

    let response;

    response = await Axios({
        method: 'POST',
        url: PREDICT_PATH,
        responseType: 'application/json',
        data: {image_url: imageUrl },
        timeout: 8000,
        validateStatus: (status) => {
            return status >= 200 && status < 305
        }
    })

    return response.data;
}

module.exports.predictImage = predictImage;