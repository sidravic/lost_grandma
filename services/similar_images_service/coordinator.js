const logger = require('./../../config/logger');
const Sequelize = require('sequelize');
const {BaseService, BaseServiceResponse} = require('./../base_service')
const {Brand, Product, Source, Image, ImageLabel, Review, ReviewComment, dbConn} = require('./../../models')
const findSimilarImagesByFormat = require('./find_similar_images').findSimilarImagesByFormat;
const DownloadableProductImages = require('./../image_services/downloadable_product_images');
const ImageServiceCoordinator = require('./../image_services/coordinator');
const { any, syncError } = require('./../utils');

const findProduct = async (productId) => {
    const product = await Product.findByPk(productId.toString(), {
        include: [{
            model: Brand, required: true
        }, {
            model: Image, required: true
        }]
    })

    return product;
}
const fetchImagesFromBing = async (service) => {
    const searchTerm = `${service.product.name}, ${service.product.Brand.name}`;
    const similarImagesResponse = await findSimilarImagesByFormat(searchTerm);
    const similarImages = similarImagesResponse.map((similarImage) => {
        return similarImage.contentUrl;
    })
    service.similarImages = similarImages;
    return service.similarImages;
}

const persistSimilarImages = async (service) => {
    const product = service.product;
    const brand = service.product.Brand;
    const similarImages = service.similarImages.map((imageUrl) => {
        return {
            image_url: imageUrl,
            cosmetics_product_id: product.id,
            cosmetics_brand_id: brand.id,
            source: 'other'
        }
    })

    const imagePersistPromise = Promise.all(similarImages.map(async (similarImage) => {
        try {
            let image = await Image.create(similarImage)
            service.newImages.push(image);
            return;
        }catch(error){
            service.addErrors([error.message]);
            return;
        }
    }));

    await imagePersistPromise;
    return service.newImages;
}

const updateNewImagesCount = async (service) => {
    service.newImagesCount = service.newImages.length;
}

const uploadImagesToS3 = async (service) => {
    const op = Sequelize.Op;
    const product = await Product.findByPk(service.product.id, {
        include: [{
            required: true,
            model: Image,
            attributes: ['id', 'image_url', 's3_image_url', 'azure_image_url'],
            where: {s3_image_url: {[op.is]: null}}
        }, {
            model: Brand,
            required: true
        }]
    });

    const downloadableProductImage = DownloadableProductImages.fromProduct(product).asJSON();
    const imageServiceCoordinator = new ImageServiceCoordinator();
    try {
        const s3UploadResponse = await imageServiceCoordinator.invoke(downloadableProductImage)
        service.uploadedToS3Count = s3UploadResponse.uploadStatus.length;
        service.imageServiceCoordinatorResponse = s3UploadResponse;
        return service.imageServiceCoordinatorResponse
    }catch(e){
        service.uploadedToS3Count = e.uploadStatus.length;
        service.imageServiceCoordinatorResponse = e;
        logger.error({src: 'coordinator', event: 'uploadImagesToS3', error: { message: e.message, stack: e.stack, note: 'This is best effort. Not a deal breaker' }});
    }

    return product;
}

class Coordinator extends BaseService {
    constructor() {
        super();
        this.batchId = null;
        this.product = null;
        this.brand = null;
        this.newImages = []
        this.newImagesCount = 0;
        this.similarImages = null;
        this.imageServiceCoordinatorResponse = null;
        this.uploadedToS3Count = 0;
    }

    async invoke(productId, batchId) {
        this.batchId = batchId;
        this.product = await findProduct(productId);

        await fetchImagesFromBing(this);
        await persistSimilarImages(this);
        await updateNewImagesCount(this);
        await uploadImagesToS3(this);

        const coordinatorResponse = new CoordinatorResponse(this.errors,
            this.errorCode,
            this.batchId,
            this.product,
            this.newImages,
            this.newImagesCount,
            this.similarImages,
            this.imageServiceCoordinatorResponse,
            this.uploadedToS3Count
        )

        return (new Promise((resolve, _reject) => {
            resolve(coordinatorResponse);
        }))
    }
}

class CoordinatorResponse extends BaseServiceResponse{
    constructor(errors, errorCode, batchId, product, newImages, newImagesCount, similarImages, imageServiceCoordinatorResponse, uploadedToS3Count){
        super(errors, errorCode);

        this.batchId = batchId;
        this.product = product;
        this.newImages = newImages;
        this.newImagesCount = newImagesCount;
        this.similarImages = similarImages;
        this.imageServiceCoordinatorResponse = imageServiceCoordinatorResponse;
        this.uploadToS3Count = uploadedToS3Count;
    }

}

module.exports = Coordinator;
