const axios =  require('axios');
const Product = require('./../models/product');

const getAxiosConfig = (productId, passKey) => {
    return {
        baseURL: 'https://api.bazaarvoice.com/data/reviews.json',
        params: {
            'Filter': 'contentlocale:en*',
            'Filter': `ProductId:${productId}`,
            'Sort': 'TotalPositiveFeedbackCount:desc',
            'Limit': 50,
            'Offset': 0,
            'Include': 'Products,Comments',
            'Stats': 'Reviews',
            'passkey': passKey,
            'apiversion': '5.4',
            'Locale': 'en_US'
        },
        validateStatus: (status) => { return status >= 200 && status < 300 },
        // proxy: {
        //     host: '127.0.0.1',
        //     port: 9000,
        //     auth: {
        //         username: 'mikeymike',
        //         password: 'rapunz3l'
        //     }
        // },
        maxRedirects: 2
    }
}

class ProductFeedbackFetcher {
    constructor(productId){
        this.productId = productId
        this.passKey = process.env.BAZAAR_VOICE_PASSKEY || 'rwbw526r2e7spptqd2qzbkp7'
        this.requestUrl = null;
        this.response = null;
        this.reviews = {};
    }

    async invoke(){
        await this.makeRequest();
        let parsedFeedback = this.parseResponse();
        return parsedFeedback;
    }

    async makeRequest() {
        const axiosConfig = getAxiosConfig(this.productId, this.passKey);
        let response = await axios.request(axiosConfig);
        this.response = response;
    }

    parseResponse(){
       return Product.fromReview(this.response);
    }

}


module.exports = ProductFeedbackFetcher