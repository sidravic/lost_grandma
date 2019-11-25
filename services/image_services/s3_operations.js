const stream = require('stream')
const logger = require('./../../config/logger');
const s3 = require('./../../config/aws_s3_client');
const {getDownloadReadStream} = require('./download_operations')

const s3StoreObjectFromImageUrl = async (s3ObjectPath, imageUrl) => {

    let imageReadStream = await getDownloadReadStream(imageUrl);
    let promise = s3UploadFromInputStream(imageReadStream, s3ObjectPath);
    return promise;
}

const s3UploadFromInputStream = async (inputStream, s3ObjectPath) => {

    const uploadOptions = {
        Bucket: process.env.S3_IMAGES_BUCKET_NAME,
        Key: s3ObjectPath,
        Body: inputStream
    }
    const uploadManager = s3.upload(uploadOptions)
    uploadManager.on('httpUploadProgress', (progress) => {

        logger.info({src: 's3_operations', event: 'uploadFromInputStream', data: {progress: progress}});
    })
    return uploadManager.promise();
}

const getSignedGETUrlFromS3Url = async (s3Url, bucketName = process.env.S3_IMAGES_BUCKET_NAME, options = {}) => {
    const key = s3Url.split('/').slice(3).join('/')
    const url = await getSignedGETUrl(key, bucketName);
    return url;
}

const getSignedGETUrl = async (key, bucketName = process.env.S3_IMAGES_BUCKET_NAME, options={}) => {
    const expiryInSeconds = options.expiry || 86400;
    const response = await s3.getSignedUrlPromise('getObject', {Bucket: bucketName, Key: key, Expires: expiryInSeconds})
    return response;
}

module.exports.s3StoreObjectFromImageUrl = s3StoreObjectFromImageUrl;
module.exports.s3UploadFromInputStream = s3UploadFromInputStream;
module.exports.getSignedGETUrl = getSignedGETUrl;
module.exports.getSignedGETUrlFromS3Url =  getSignedGETUrlFromS3Url;