const {BaseService, BaseServiceResponse} = require('./../base_service');

class RetryableUpload extends BaseService {
    constructor(imageUrl, originalError, productId, brandId, imageId) {
        super();
        this.imageUrl = imageUrl;
        this.originalError = originalError;
        this.productId = productId;
        this.brandId = brandId;
        this.imageId = imageId;
        this.uploadStatus = null;
        this.persistStatus = null;
    }
}

module.exports = RetryableUpload