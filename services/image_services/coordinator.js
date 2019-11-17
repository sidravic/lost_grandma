const fs = require('fs');
const util = require('util');
const { any } = require('./../utils')
const logger = require('./../../config/logger');

const asyncWriteFile = util.promisify(fs.writeFile);
const { Brand, Product, Source, Image, Review, ReviewComment, dbConn } = require('./../../models')
const { findInBatches } = require('../db_operations/find_in_batches');
const { BaseService, BaseServiceResponse } = require('./../base_service');

const DownloadableProductImages = require('./downloadable_product_images');
const DownloadImageService = require('./download_image_service');
const ImageDownloadQueue = require('./../../workers/image_services/image_download_queue').ImageDownloadQueue;

const onEachBatch = (products) => {
    let downloadableProductImages = products.map(product => {
        return (
            DownloadableProductImages.
                fromProduct(product).
                asJSON())
    })
    downloadableProductImages.map(async (dpi, index) => {
        const retryOptions = { removeOnComplete: true, attempts: 50 }
        const job = await ImageDownloadQueue.add('image_download_queue', JSON.stringify(dpi), retryOptions);
        logger.info({ src: 'Coordinator', event: 'ImageAddedToDownloadQueue', data: { downloadImagePayload: dpi } });
    });
}

const createFolder = (folderName) => {
    const path = `/home/sidravic/Dropbox/code/workspace/rails_apps/idylmynds/sephora_crawler/download_images/${folderName}`;
    if (fs.existsSync(path)) {
        logger.info({ src: 'Coordinator', event: 'createFolder', data: { status: 'folder already exists', path: path } })
        return path
    }

    fs.mkdirSync(path);
    logger.info({ src: 'Coordinator', event: 'createFolder', data: { status: 'success', path: path } })
    return path;
}

const downloadImage = async (imageUrls, path, folderName) => {
    return Promise.all(imageUrls.map(async (imageUrl, index) => {
        let fileName = (index + 1).toString()
        let fileDestinationPath = `${path}/${fileName}.jpg`
        let service = new DownloadImageService(imageUrl, fileDestinationPath)
        let downloadServiceResponse = await service.invoke();
        logger.info({ event: 'downloadImages', src: 'Coordinator', data: { folderName: folderName, status: 'complete' } })
        return downloadServiceResponse;
    }))
}

const createMetadataFile = async (downloadImagePayload, folderPath) => {
    const filePath = `${folderPath}/metadata.json`
    await asyncWriteFile(filePath, downloadImagePayload)
    logger.info({ src: 'Coordinator', event: 'createMetaDataFile', data: { status: 'success', path: filePath } })
}

class CoordinatorService extends BaseService {
    constructor() {
        super();
    }

    async invoke() {
        await this.fetchProductsInBatches();
    }

    async fetchProductsInBatches() {
        const options = { includedModels: [Image, Brand] }
        findInBatches(Product, 1, onEachBatch, options)
    }

    async downloadImage(downloadableImagePayload) {
        try {
            let folderPath = createFolder(downloadableImagePayload.folderName);
            debugger;
            let downloadStatuses = await downloadImage(downloadableImagePayload.imageUrls, folderPath, downloadableImagePayload.folderName)
            let downloadErrors = downloadStatuses.map((status) => { return status.errors })
            
            if (any(downloadErrors)) {
                this.errorCode = 'error_coordinator_image_download'
            }

            let coordinatorResponse = new CoordinatorServiceResponse(downloadErrors, this.errorCode, folderPath, downloadStatuses);
            await createMetadataFile(downloadableImagePayload, folderPath);
            return (new Promise((resolve, reject) => { resolve(folderPath, coordinatorResponse) }));
        } catch (e) {
            debugger;
            logger.error({
                event: 'downloadImage', src: 'Coordinator',
                data: { folderName: downloadableImagePayload.folderName },
                error: { message: e.message, stack: e.stack }
            })
            
            let coordinatorResponse = new CoordinatorServiceResponse([e.message], 'exception_coordinator_image_download', downloadableImagePayload.folderName, null);
            return (new Promise((resolve, reject) => { reject(e); }));
        }

    }
}

class CoordinatorServiceResponse extends BaseServiceResponse {
    constructor(errors, errorCode, folderName, downloadStatuses) {
        super(errors, errorCode);
        this.folderName = folderName;
        this.downloadStatuses = downloadStatuses;
    }
}


module.exports = CoordinatorService;
// new CoordinatorService().invoke();