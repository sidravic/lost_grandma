const he = require('he');
const sanitizeString = (word) => {
    return he.decode(word)
}
const sanitizedProductName = (word) => {
    return sanitizeString(word).toLowerCase().split(' ').join('-')
}

const getImageUrls = (product) => {
    let imageUrls = product.Images.map((image) => { return image.image_url })
    return imageUrls;
}

class DownloadableProductImages {
    constructor(productObject) {
        Object.assign(this, productObject)
    }

    static fromProduct(product) {
        let imageUrls = getImageUrls(product)
        let brandName = sanitizeString(product.Brand.name)

        const productObject = {
            productId: product.id,
            productName: product.name,
            brandId: product.cosmetics_brand_id,
            brandName: brandName,
            imageUrls: imageUrls,
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
            categories: this.categories
        }
    }
}

module.exports = DownloadableProductImages