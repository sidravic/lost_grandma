const fs = require('fs');
const util = require('util');
const { any } = require('./../utils')
const Sequelize = require('sequelize');
const logger = require('./../../config/logger');
const { Brand, Product, Source, Image, Review, ReviewComment, dbConn } = require('./../../models')
const { findInBatches } = require('../db_operations/find_in_batches');
const { BaseService, BaseServiceResponse } = require('./../base_service');
const DownloadableProductImages = require('./downloadable_product_images');
const { s3StoreObjectFromImageUrl, s3UploadFromInputStream } = require('./s3_operations')


const onEachBatch = (products) => {

    const UploadToS3Queue = require('./../../workers/image_services/upload_to_s3_queue').UploadToS3Queue;
    let downloadableProductImages = products.map(product => {
        return (
            DownloadableProductImages.
                fromProduct(product).
                asJSON())
    })
    downloadableProductImages.map(async (dpi, index) => {
        const retryOptions = { removeOnComplete: true, attempts: 50 }        
        const job = await UploadToS3Queue.add('upload_to_s3_queue', JSON.stringify(dpi), retryOptions);
        logger.info({ src: 'Coordinator', event: 'ImageAddedToDownloadQueue', data: { downloadImagePayload: dpi } });
    });
}

const uploadImagesToS3AndPersist = async (downloadableImagePayload, service) => {
    const imageUrls = downloadableImagePayload.imageUrls;
    const folderName = downloadableImagePayload.folderName;
    const imageUrlToId = downloadableImagePayload.imageUrlToId;    
    const bucketName = process.env.S3_IMAGES_BUCKET_NAME;    

    return Promise.all(imageUrls.map(async (imageUrl, _index) => {
       
        let fileName = imageUrl.split('/').slice(-1).pop();
        let s3ObjectPath = `${bucketName}/${folderName}/${fileName}`
       
        try {
            let uploadStatus = await s3StoreObjectFromImageUrl(s3ObjectPath, imageUrl)
            logger.info({ event: 'downloadImages', src: 'Coordinator', data: { folderName: folderName, status: 'complete' } })
            const persistStatus = await persistS3Url(uploadStatus, imageUrl, imageUrlToId, service);
            uploadStatus.persisStatus = persistStatus;
            service.uploadStatus = uploadStatus;
            return uploadStatus;
        } catch (e) {
            service.addErrors([e.message])
            service.errorCode = 'error_uploading_images_to_s3';
            logger.error({ event: 'downloadImages', src: 'Coordinator', data: { imageUrl: imageUrl, status: 'error' }, error: { message: e.message, stack: e.stack } })
            
        }        
    }))
}

const persistS3Url = async(uploadStatus, imageUrl, imageUrlToId, service) => {
   
    const imageId = imageUrlToId[imageUrl];
    try {                
        const persistStatus = await Image.update({s3_image_url: uploadStatus.Location.toString()}, {where: {id: imageId}})        
        logger.info({ event: 'persistS3Url', src: 'Coordinator', data: { imageUrl: imageUrl, status: 'completed' }})
        return persistStatus;
    } catch(e){
        logger.error({ event: 'persistS3Url', src: 'Coordinator', data: { imageUrl: imageUrl, status: 'error' }, error: {message: e.message, stack: e.stack }})
        service.addErrors([e.message]);
        service.errorCode('error_persist_s3_url');
    }
}

const createMetadataFile = async (downloadableImagePayload,  service) => {

    const bucketName = process.env.S3_IMAGES_BUCKET_NAME;
    const folderName = downloadableImagePayload.folderName;
    const s3ObjectPath = `${bucketName}/${folderName}/metadata.json`
    
    try {
        const metadataUploadStatus = await s3UploadFromInputStream(JSON.stringify(downloadableImagePayload), s3ObjectPath);
        logger.info({ src: 'Coordinator', event: 'createMetaDataFile', data: { status: 'success', path: s3ObjectPath } })
        this.metadataUploadStatus = metadataUploadStatus;
        return metadataUploadStatus;
    } catch(e) {
        logger.info({ src: 'Coordinator', event: 'createMetaDataFile', data: { status: 'success', path: s3ObjectPath } })
        service.addErrors([e.message]);
        service.errorCode('error_uploading_metadata.json');
    }    
}

class CoordinatorService extends BaseService {
    constructor() {
        super();

        this.uploadStatus = null;
        this.metadataUploadStatus = null;
        this.downloadableImagePayload = null;        
    }

    async invoke() {        
        await this.fetchProductsInBatches();
    }

    async fetchProductsInBatches() {
        const op = Sequelize.Op;        
        const options = {
            includedModels: [
                {
                    model: Image,
                    required: true,
                    where: { s3_image_url: { [op.is]: null } }
                },
                {
                    model: Brand,
                    required: true
                }
            ]
        }
        findInBatches(Product, 1000, onEachBatch, options)
    }

    async saveToS3(downloadableImagePayload) {
        try {    
            this.downloadableImagePayload = downloadableImagePayload;

            await uploadImagesToS3AndPersist(downloadableImagePayload, this)            
            await createMetadataFile(downloadableImagePayload, this);
            
            const coordinatorResponse = new CoordinatorServiceResponse(this.errors, this.errorCode, 
                this.downloadableImagePayload, this.uploadStatus, this.metadataUploadStatus)
            return (new Promise((resolve, reject) => { resolve(coordinatorResponse) }));
        } catch (e) {
            logger.error({
                event: 'downloadImage', src: 'Coordinator',
                data: { folderName: downloadableImagePayload },
                error: { message: e.message, stack: e.stack }
            })
            
            let coordinatorResponse = new CoordinatorServiceResponse([e.message], 'exception_coordinator_image_download', downloadableImagePayload, null, null);
            return (new Promise((resolve, reject) => { reject(e); }));
        }

    }
}

class CoordinatorServiceResponse extends BaseServiceResponse {
    constructor(errors, errorCode, downloadableImagePayload, uploadStatus, metadataUploadStatus) {
        super(errors, errorCode);
        this.uploadStatus = uploadStatus;
        this.metadataUploadStatus = metadataUploadStatus;
        this.downloadableImagePayload = downloadableImagePayload
    }
}


module.exports = CoordinatorService;

//new CoordinatorService().invoke();