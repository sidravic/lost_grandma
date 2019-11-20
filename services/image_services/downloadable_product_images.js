const he = require('he');
const sanitizeString = (word) => {
    return he.decode(word).normalize('NFD').replace(/[\u0300-\u036f]/g, "")
}
const sanitizedProductName = (word) => {
    return sanitizeString(word).toLowerCase().split(' ').join('-')
}

const getImageUrls = (product) => {
    let imageUrls = product.Images.map((image) => { return image.image_url })
    return imageUrls;
}

const getImageUrlToId = (product) => {
    let imageUrlToId = {}
    product.Images.map((image) => {  imageUrlToId[image.image_url.toString()] = image.id; return; })    
    return imageUrlToId;
}

class DownloadableProductImages {
    constructor(productObject) {
        Object.assign(this, productObject)
    }

    static fromProduct(product) {
        let imageUrls = getImageUrls(product)
        let brandName = sanitizeString(product.Brand.name)
        let imageUrlToId = getImageUrlToId(product);

        const productObject = {
            productId: product.id,
            productName: product.name,
            brandId: product.cosmetics_brand_id,
            brandName: brandName,
            imageUrls: imageUrls,
            imageUrlToId: imageUrlToId,
            imageCount: imageUrls.length,
            folderName: `${product.id}_${sanitizedProductName(product.name)}_${sanitizedProductName(brandName)}`,
            categories: product.categories['classification']
        }

        return new DownloadableProductImages(productObject)
    }

    static fromProductObject(productObject) {
        return new DownloadableProductImages(productObject);
    }

    asJSON() {
        return {
            productId: this.productId,
            productName: this.productName,
            brandName: this.brandName,
            brandId: this.brandId,
            imageUrls: this.imageUrls,
            imageCount: this.imageCount,
            folderName: this.folderName,
            categories: this.categories,
            imageUrlToId: this.imageUrlToId
        }
    }
}

module.exports = DownloadableProductImages