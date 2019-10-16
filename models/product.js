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
        metaData.rawData.productPageUrl,
        metaData.reviewStatistics,
        reviewComments,
        totalResults,
        metaData.rawData
    ]
}

const getReviewComments = (apiResponse) => {
    return apiResponse.data.Results;
}

const getTotalResults = (apiResponse) => {
    return apiResponse.data.TotalResults;
}

const getReviewMetaData = (apiResponse) => {
    const products = apiResponse.data.Includes.Products;
    const productsOrder = apiResponse.data.Includes.ProductsOrder;
    let newProduct = {};

    for (let [k, v] of Object.entries(products)) {
        newProduct.name = v['Name']
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
    }

    return newProduct;
}

class ProductReview {
    constructor(id, name, brand, brandId, description, EANs, UPCs, imageUrl, productPageUrl, reviewStatistics, reviewComments, totalResults, rawData) {
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