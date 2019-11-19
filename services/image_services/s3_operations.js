const stream = require('stream')
const logger = require('./../../config/logger');
const s3 = require('./../../config/aws_s3_client');
const { getDownloadReadStream } = require('./download_operations')

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

        logger.info({ src: 's3_operations', event: 'uploadFromInputStream', data: { progress: progress } });
    })
    return uploadManager.promise();
}



 let bucketName = process.env.S3_IMAGES_BUCKET_NAME

 //  let objectPath = `${bucketName}/00a5de76-9dbf-4121-9b24-cb3c7ff883a7_long-wear-cream-shadow-stick_bobbi-brown/1.jpg`
// storeObjectFromImageUrl(objectPath, 'https://www.sephora.com/asd/sku/s2175016-main-Lhero.jpg').then((r) => {
//     debugger;
//     console.log(r);
// })

// let x = {
//     "productId": "00a5de76-9dbf-4121-9b24-cb3c7ff883a7",
//     "productName": "Long-Wear Cream Shadow Stick",
//     "brandName": "Bobbi Brown",
//     "brandId": "5490a77a-fff7-493b-9add-d6852cf0ef9d",
//     "imageUrls": ["https://www.sephora.com/productimages/sku/s1484989-main-Lhero.jpg"], "imageCount": 1, "folderName": "00a5de76-9dbf-4121-9b24-cb3c7ff883a7_long-wear-cream-shadow-stick_bobbi-brown",
//     "categories": ["Makeup", "Eye"]
// }

// let objectPath = `${bucketName}/00a5de76-9dbf-4121-9b24-cb3c7ff883a7_long-wear-cream-shadow-stick_bobbi-brown/metadata.json`
// uploadFromInputStream(JSON.stringify(x), objectPath).then((r) =>  console.log(r));

module.exports.s3StoreObjectFromImageUrl = s3StoreObjectFromImageUrl;
module.exports.s3UploadFromInputStream = s3UploadFromInputStream;