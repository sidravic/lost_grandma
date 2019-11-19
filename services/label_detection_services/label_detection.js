const logger = require('../../config/logger');
const rekognition = require('../../config/aws_rekognition_client');

const getImagePathFromS3Url = (s3Url) => {
    return s3Url.split('/').splice(3).join('/')
}

const parseLabelDetectionResponse = (labelDetectionResponse) => {
    const parsedResponse = labelDetectionResponse.Labels.map((label) => { return { label: label.Name, confidence: label.Confidence }})
    return parsedResponse;
}

const detectLabels = async (s3Url, bucketName = process.env.S3_IMAGES_BUCKET_NAME) => {

    if (!s3Url) {
        return (new Promise((resolve, reject) => {

            const error = new Error('imagePath cannot be empty');
            reject(error);
        }))
    }

    const imagePath = getImagePathFromS3Url(s3Url);

    const detectionParams = {
        Image: {
            S3Object: {
                Bucket: bucketName,
                Name: imagePath
            },
        },
        MaxLabels: 7
    }

    const labelDetectionResponse = await rekognition.detectLabels(detectionParams).promise();
    return parseLabelDetectionResponse(labelDetectionResponse);
}

module.exports.detectLabels = detectLabels;
