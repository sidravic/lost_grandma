const Axios = require('axios')
const fs = require('fs')
const logger = require('./../../config/logger');
const { SocksAgent } = require('./../proxy')

const { BaseService, BaseServiceResponse } = require('./../base_service');

const download = async (imageUrl, destinationPath) => {    
    const response = await Axios({
        method: 'GET',
        url: imageUrl,
        responseType: 'stream',
        httpAgent: SocksAgent,
        httpsAgent: SocksAgent
    })
    const fileWriteStream = fs.createWriteStream(destinationPath)    
    const imageReadStream = response.data
    imageReadStream.pipe(fileWriteStream)

    return (new Promise ((resolve, reject) => {
        imageReadStream.on('error', (error) => {
            logger.error({
                src: 'DownloadImageService',
                event: 'download-image-file-readstream-error',
                error: error.message
            })
            reject([error, null]);
        });

        fileWriteStream.on('finish', () => {
            resolve([null, destinationPath]);
        })
    
        fileWriteStream.on('error', (error) => {
            logger.error({
                src: 'DownloadImageService',
                event: 'download-image-file-writetream-error',
                error: error.message
            })
            reject([error, null]);
        });
    
        fileWriteStream.on('close', () => {
            logger.info({ src: 'DownloadImageService', event: 'download-image-write-filestream-closed', message: 'success' })
            resolve([null, destinationPath]);
        })    
    }))
    
}

class DownloadImageService extends BaseService {
    constructor(imageUrl, destinationPath) {
        super();
        this.destinationPath = destinationPath
        this.imageUrl = imageUrl;
        this.downloadedImagePath = null;
    }

    async invoke() {
        await this.triggerDownload();

        return (new Promise((resolve, reject) => {
            resolve(new DownloadImageServiceResponse(this.errors, this.errorCode, this.imageUrl, this.dowloadedFilePath))
        }))
    }

    async triggerDownload() {
        let err = null;
        [err, this.downloadedImagePath] = await download(this.imageUrl, this.destinationPath);

        if (err) {
            this.addErrors(err.message);
            this.errorCode = 'error-downloading-image'
            return
        }

    }
}

class DownloadImageServiceResponse extends BaseServiceResponse {
    constructor(errors, errorCode, imageUrl, dowloadedFilePath) {
        super(errors, errorCode);
        this.imageUrl = imageUrl;
        this.dowloadedFilePath = dowloadedFilePath
    }
}

module.exports = DownloadImageService;
