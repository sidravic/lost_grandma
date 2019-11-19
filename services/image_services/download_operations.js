const Axios = require('axios')
const fs = require('fs')
const logger = require('../../config/logger');
const { SocksAgent } = require('../proxy')
const { BaseService, BaseServiceResponse } = require('../base_service');

const getDownloadReadStream = async (imageUrl) => {
    
    const response = await Axios({
        method: 'GET',
        url: imageUrl,
        responseType: 'stream',
        httpAgent: SocksAgent,
        httpsAgent: SocksAgent,
        validateStatus: (status) => { return status >= 200 && status < 300 },
    })

    let readStream = response.data;
    return readStream;
}

module.exports.getDownloadReadStream = getDownloadReadStream;
