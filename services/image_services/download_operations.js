const Axios = require('axios')
const {SocksAgent, SocksHttpAgent, recreateCircuit} = require('../proxy')
const {generateRandomTill} = require('./../utils')

const getUserAgentString = () => {
    const userAgents = ['Mozilla/5.0 (Linux; Android 8.0.0; SM-G960F Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.84 Mobile Safari/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/13.2b11866 Mobile/16A366 Safari/605.1.15',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.34 (KHTML, like Gecko) Version/11.0 Mobile/15A5341f Safari/604.1',
        'Mozilla/5.0 (Linux; Android 4.4.3; KFTHWI Build/KTU84M) AppleWebKit/537.36 (KHTML, like Gecko) Silk/47.1.79 like Chrome/47.0.2526.80 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) AppleWebKit/601.3.9 (KHTML, like Gecko) Version/9.0.2 Safari/601.3.9',
        'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.111 Safari/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Mobile/15E148 Safari/604.1'
    ]

    let index = generateRandomTill(userAgents.length)
    return userAgents[index];
}


const getDownloadReadStream = async (imageUrl) => {

    let response;

    response = await Axios({
        method: 'GET',
        url: imageUrl,
        responseType: 'stream',
        httpAgent: SocksHttpAgent,
        httpsAgent: SocksAgent,
        timeout: 5000,
        validateStatus: (status) => {
            return status >= 200 && status < 305
        },
        maxRedirects: 2
    })

    return response.data;
}

const getDownloadReadStreamWithoutProxy = async (imageUrl) => {

    let response;

    response = await Axios({
        method: 'GET',
        url: imageUrl,
        responseType: 'stream',
        validateStatus: (status) => {
            return status >= 200 && status < 305
        },
        maxRedirects: 5,
        timeout: 5000
    })

    return response.data;
}

module.exports.getDownloadReadStream = getDownloadReadStream;
module.exports.getDownloadReadStreamWithoutProxy = getDownloadReadStreamWithoutProxy;