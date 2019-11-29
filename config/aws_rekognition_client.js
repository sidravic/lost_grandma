const aws = require('aws-sdk');
const fs =  require('fs');
const path = require('path');
const logger = require('./logger');
const config = new aws.Config()

config.update({
    accessKeyId: process.env.REKOGNITION_ACCESS_KEY_ID,
    secretAccessKey: process.env.REKOGNITION_SECRET_ACCESS_KEY,
    region: process.env.S3_REGION
})

const rekognition = new aws.Rekognition(config);



module.exports = rekognition;
