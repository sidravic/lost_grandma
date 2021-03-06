const aws = require('aws-sdk');
const fs =  require('fs');
const path = require('path');
const logger = require('./logger');
const config = new aws.Config()

config.update({
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey:process.env.S3_SECRET_ACCESS_KEY,
    region: process.env.S3_REGION
})

const s3 = new aws.S3(config);

module.exports = s3;
