const parseSephoraReview = (apiResponse) => {
    const reviewComments = getReviewComments(apiResponse);
    const totalResults = getTotalResults(apiResponse);
    const metaData = getReviewMetaData(apiResponse);

    return [metaData.Id,
        metaData.name,
        metaData.brand,
        metaData.brandId,
        metaData.description,
        metaData.UPCs,
        metaData.EANs,
        metaData.ImageUrl,
        metaData.productPageUrl,
        metaData.reviewStatistics,
        reviewComments,
        totalResults,
        metaData.rawData
    ]
}

const getReviewComments = (apiResponse) => {
    let reviewComments = [];
    reviewComments = apiResponse.data.Results;
    return reviewComments;
}

const getTotalResults = (apiResponse) => {
    let totalResults = 0;
    totalResults = apiResponse.data.TotalResults;
    return totalResults;
}

const getReviewMetaData = (apiResponse) => {
    const products = apiResponse.data.Includes.Products || {};
    const productsOrder = apiResponse.data.Includes.ProductsOrder || [];
    let newProduct = {};


    for (let [k, v] of Object.entries(products)) {
        newProduct.name = v.Name
        newProduct.brand = v.Brand.Name;
        newProduct.brandId = v.Brand.Id;
        newProduct.description = v.Description;
        newProduct.categoryId = v.CategoryId;
        newProduct.EANs = v.EANs || [];
        newProduct.UPCs = v.UPCs || [];
        newProduct.Attributes = v.Attributes;
        newProduct.ImageUrl = v.ImageUrl;
        newProduct.BrandExternalId = v.BrandExternalId;
        newProduct.reviewStatistics = v.ReviewStatistics;
        newProduct.Id = v.Id;
        newProduct.rawData = v;
        newProduct.productPageUrl = v.productPageUrl;
    }

    return newProduct;
}

class ProductReview {
    constructor(id=null, name=null, brand=null, brandId=null, description=null, EANs=[], UPCs=[], imageUrl=null,
                productPageUrl=null, reviewStatistics={}, reviewComments=[], totalResults=0, rawData={}) {
        this.id = id
        this.name = name;
        this.brand = brand;
        this.brandId = brandId;
        this.description = description;
        this.EANs = EANs || [];
        this.UPCs = UPCs || [];
        this.imageUrl = imageUrl;
        this.productPageUrl = productPageUrl;
        this.reviewComments = reviewComments;
        this.reviewStatistics = reviewStatistics;
        this.totalResults = totalResults;
        this.rawData = rawData;
    }

    static fromReview(apiResponse) {
        const [Id, name, brand, brandId, description, UPCs, EANs, imageUrl, productPageUrl, reviewStatistics, reviewComments, totalResults, rawData] = parseSephoraReview(apiResponse);
        const productReview = new ProductReview(Id, name, brand, brandId, description,EANs, UPCs, imageUrl, productPageUrl, reviewStatistics, reviewComments, totalResults, rawData);
        return productReview.asJSON();
    }

    asJSON(){
        return {
            id: this.id,
            name: this.name,
            brand: this.brand,
            brandId: this.brandId,
            description: this.description,
            EANS: this.EANs,
            UPCs: this.UPCs,
            imageUrl: this.imageUrl,
            productPageUrl: this.productPageUrl,
            reviewComments: this.reviewComments,
            reviewStatistics: this.reviewStatistics,
            totalResults: this.totalResults,
            rawData: this.rawData

        }
    }
}

module.exports = ProductReview;