const logger = require('./../config/logger');
const {Brand, Product, Source, Image, Review, ReviewComment, dbConn} = require('./../models');
const {syncError, any, isEmpty} = require('./utils');
const {BaseService, BaseServiceResponse} = require('./base_service')

const fetchBrandDetails = (payload) => {
    let brandDetails = {}
    brandDetails['name'] = payload['brand'];
    brandDetails['productUrl'] = payload['productUrl'];
    brandDetails['brand_name_slug'] = brandDetails.name.toLowerCase().split(' ').join('-')
    return brandDetails;
}

const getUPC = (eans, upcs) => {
    let upc = (eans.length > 0) ? eans[0] : null;
    if (!upc) {
        upc = (upcs.length > 0) ? upcs[0] : null;
    }

    return upc;
}

const getSizeAndPrice = (sizes) => {
    const primarySize = sizes[0];
    if (!primarySize) {
        return [null, null];
    }

    let {size, price} = {...primarySize};
    return [size, price]
}

const getCategories = (classificationHierarchy) => {
    const categories = [...classificationHierarchy];
    return {classification: categories, ordered: true};
}

const fetchProductSourceDetails = (productPayload, product) => {
    let productSourceDetails = {};
    productSourceDetails['source_url'] = productPayload.productUrl;
    productSourceDetails['sourceable_type'] = 'Product';
    productSourceDetails['sourceable_id'] = product.id;
    productSourceDetails['source_name'] = Source.Sephora;
    return productSourceDetails;
}

const fetchProductDetails = (payload, brand) => {
    let productDetails = {};
    productDetails['name'] = payload.name;
    productDetails['cosmetics_brand_id'] = brand.id;
    productDetails['item_id'] = payload.sephoraProductId || null;
    productDetails['usage'] = payload.productDetails.usage;
    productDetails['ingredients'] = payload.productDetails.ingredients;
    productDetails['upc'] = getUPC(payload.reviews.EANS, payload.reviews.UPCs)
    let [size, price] = getSizeAndPrice(payload.productDetails.sizes);
    productDetails['size'] = size;
    productDetails['price'] = price;
    productDetails['categories'] = getCategories(payload.classificationHierarchy)
    productDetails['description'] = payload.productDetails.details;
    productDetails['raw_dump'] = payload;
    return productDetails;
}

const fetchImageDetails = (payload, brand, product) => {
    let imageDetails = null;
    imageDetails = payload.images.map((imageUrl) => {
        return {
            image_url: imageUrl,
            cosmetics_product_id: product.id,
            cosmetics_brand_id: brand.id
        }
    })

    return imageDetails;
}

const sanitizeProductReviewComments = (reviewComments) => {
    let comments = reviewComments.map((reviewComment) => {
        reviewComment.ReviewText = reviewComment.ReviewText.replace(/(\r\n|\n|\r)/gm, "");
        return reviewComment
    })

    return comments;
}

const fetchReviewDetails = (payload, brand, product) => {
    let review = {}
    let productReview = payload.reviews;
    productReview.reviewComments = sanitizeProductReviewComments(productReview.reviewComments)

    if (!isEmpty(productReview)) {
        review.cosmetics_product_id = product.id;
        review.cosmetics_brand_id = brand.id;
        review.sephora_product_id = productReview.id;
        review.sephora_brand_id = productReview.brandId;
        review.review_product_description = productReview.description;
        review.image_url = productReview.imageUrl;
        review.total_results = productReview.totalResults;
        review.first_review_date = productReview.reviewStatistics.FirstSubmissionTime
        review.last_review_date = productReview.reviewStatistics.LastSubmissionTime;
        review.raw_data = productReview;
    }

    return review;
}

const fetchReviewComments = (payload, review) => {
    let reviewComments = payload.reviews.reviewComments;
    let reviewCommentDetails;


    reviewCommentDetails = reviewComments.map((reviewComment) => {
        return {
            cosmetics_review_id: review.id,
            user_nickname: reviewComment.UserNickname,
            rating: reviewComment.Rating,
            review_text: reviewComment.ReviewText,
            review_title: reviewComment.Title,
            avataar_url: null,
            submitted_date: reviewComment.SubmissionTime,
            modified_date: reviewComment.LastModificationTime,
            other_data: {
                context_data_values: reviewComment.ContextDataValues,
                ratings_range: reviewComment.RatingRange,
                comment_feedback: {
                    negative: reviewComment.TotalNegativeFeedbackCount,
                    positive: reviewComment.TotalPositiveFeedbackCount,
                    user_location: null,
                    content_locale: reviewComment.ContentLocale
                }
            }
        }
    })

    return reviewCommentDetails;
}

class ProductPersistService extends BaseService {
    constructor(productPayload) {
        super();
        this.productPayload = productPayload;
        this.brand = null;
        this.product = null;
        this.source = null;
        this.images = null;
        this.review = null;
        this.reviewComments = null;
    }

    async invoke() {
        await this.createBrand();
        await this.createProduct();
        await this.createProductSource();
        await this.createImages();
        await this.createReview();
        await this.createReviewComments();

        return (new Promise((resolve, reject) => {
            let response = new ProductPersistServiceResponse(this.errors, this.errorCode, this.brand, this.product,
                                                             this.source, this.images, this.review, this.reviewComments)
            resolve(response);
        }))
    }

    async createBrand() {
        if (this.anyErrors()) return;

        const brandDetails = fetchBrandDetails(this.productPayload);
        const [[brand, _created], errors] = await syncError(Brand.findOrCreate({
            where: {
                brand_name_slug: brandDetails.brand_name_slug,
                name: brandDetails.name
            }
        }))

        if (any(errors)) {
            this.errorCode = 'brand_creation_error'
            this.addErrors(errors)

        } else {
            this.brand = brand;
        }
    }

    async checkProductExists() {
        if (this.anyErrors()) return;

        const productDetails = fetchProductDetails(this.productPayload, this.brand);
        const [product, errors] = await syncError(Product.findOne({
            where: {
                name: productDetails.name,
                item_id: productDetails.item_id,
                upc: productDetails.upc
            }
        }))

        let productStatus = (product) ? true : false;

        if (any(errors)) {
            this.errorCode = 'error_product_exists_check_failure';
            this.addErrors(errors);
        }

        return [productStatus, product]
    }

    async createProduct() {
        if (this.anyErrors()) return;
        let productExists, product, errors;

        [productExists, product] = await this.checkProductExists();
        if (productExists) {
            this.product = product;
            return;
        }

        const productDetails = fetchProductDetails(this.productPayload, this.brand);
        [product, errors] = await syncError(Product.create({...productDetails}));

        if (any(errors)) {
            this.errorCode = 'product_creation_error';
            this.addErrors(errors);
        } else {
            this.product = product;
        }
    }

    async createProductSource() {

        if (this.anyErrors()) return;

        const productSourceDetails = fetchProductSourceDetails(this.productPayload, this.product);
        const [[productSource, _created], errors] = await syncError(Source.findOrCreate({where: {...productSourceDetails}}))

        if (any(errors)) {
            this.errorCode = 'product_source_creation_error';
            this.addErrors(errors);
        } else {
            this.source = productSource;
        }
    }

    async findExistingImages(brand, product) {
        const [images, errors] = await syncError(Image.findAll({
            where: {
                cosmetics_brand_id: brand.id,
                cosmetics_product_id: product.id
            }
        }))

        if (any(errors)) {
            logger.error({src: 'product_persist_service', event: 'findExistingImages', errors: errors})
        } else {
            this.images = images;
        }
        return [images, errors];
    }

    async createImages() {
        if (this.anyErrors()) return;
        let images, errors;

        const imageDetails = fetchImageDetails(this.productPayload, this.brand, this.product)
        if (!any(imageDetails)) return;

        [images, errors] = await syncError(Image.bulkCreate(imageDetails));

        if (any(errors)) {
            await this.findExistingImages(this.brand, this.product);
            return;
        }

        this.images = images;
    }

    async createReview() {
        if (this.anyErrors()) return;

        const reviewDetails = fetchReviewDetails(this.productPayload, this.brand, this.product)
        if (isEmpty(reviewDetails)) return;

        const [review, errors] = await syncError(Review.create({...reviewDetails}));

        if (any(errors)) {
            logger.error({src: 'product_persist_service', event: 'createReview', errors: errors})
            await this.findReview(this.brand, this.product);
            return;
        } else {
            this.review = review;
        }
    }

    async findReview(brand, product) {
        debugger;
        const [review, errors] = await syncError(Review.findOne({where: {cosmetics_brand_id: brand.id, cosmetics_product_id: product.id}}))

        debugger;
        if(any(errors)){
            logger.error({src: 'product_persist_service', event: 'findReview', errors: errors})
        } else {
            this.review = review;
        }
    }

    async findReviewComments(review) {
        const [reviewComments, errors] = await syncError(ReviewComment.findAll({where: {cosmetics_review_id: review.id}}))

        debugger;
        if(any(errors)) {
            logger.error({src: 'product_persist_service', event: 'findReviewComments', errors: errors})
        } else {
            this.reviewComments = reviewComments;
        }

        return [reviewComments, errors];

    }

    async createReviewComments(){
        if (this.anyErrors()) return;

        const reviewComments = fetchReviewComments(this.productPayload, this.review)
        if(!any(reviewComments)) return;

        const [comments, errors] = await syncError(ReviewComment.bulkCreate(reviewComments));

        if (any(errors)){
            logger.error({src: 'product_persist_service', event: 'createReviewComments', errors: errors})
            return (await this.findReviewComments(this.review));
        } else {
            this.reviewComments = comments;
        }
    }
}

class ProductPersistServiceResponse extends BaseServiceResponse {
    constructor(errors, errorCode, brand, product, source, images, review, reviewComments){
        super(errors, errorCode);
        this.brand = brand;
        this.product = product;
        this.source = source;
        this.images = images;
        this.review = review;
        this.reviewComments = reviewComments;
    }
}

// let payload = {
//     "productUrl": "https://www.sephora.com/product/blu-mediterraneo-minature-set-P443401?icid2=products+grid%3Ap443401",
//     "name": "Blu Mediterraneo MINIATURE Set",
//     "brand": "Acqua Di Parma",
//     "sephoraProductId": "ITEM 2218774",
//     "price": null,
//     "images": [
//         "https://www.sephora.com/productimages/sku/s2218774-main-Lhero.jpg",
//         "https://www.sephora.com/productimages/product/p443401-av-01-Lhero.jpg",
//         "https://www.sephora.com/productimages/product/p443401-av-02-Lhero.jpg"
//     ],
//     "productDetails": {
//         "sizes": [
//             {
//                 "size": "SIZE 5 x 0.16oz/5mL",
//                 "price": "$63.00($75.00 value)"
//             }
//         ],
//         "details": "This enchanting set comes in a specially handcrafted blue box, and includes a selection of fragrances from the Blu Mediterraneo collection. A symbol of the Italian Mediterranean and the island of Capri, Arancia di Capri is sunny, relaxing, and carefree. In the air, hints of Italian citrus and the warm aroma of caramel blend together to create a pure moment of bliss, just like being on vacation.Soarkling, authentic bergamot shines at the onset of Bergamotto di Calabria. It is enhanced by the freshness of citron, red ginger, and cedarwood. At the base, an unprecedented combination of vetiver, benzoin, and musk emerges. The Amalfi Coast: it’s one of the most breathtaking places on Earth. Fico di Amalfi is a floral, woody, and citrusy fragrance that calls to mind this breathtaking stretch of Mediterranean coastline with a strong, energizing effect. Mirto di Panarea is characterized by the aromatic notes of myrtle and basil, it opens with lemon and bergamot. At the heart, a sea breeze accord melts with jasmine and rose. Its intense base includes lentisc and juniper with cedarwood and amber. Chinotto, the rarest and most precious citrus fruit, is a bittersweet treasure of Italy. This refreshing and lively scent is inspired by a unique land of contrasts. Like a perfect memory of a sunny morning walk overlooking the sea alongside chinotto and mandarin trees, Chinotto di Liguria evokes the delightful embrace of sand and sea.This set contains:- 0.16 oz/ 5 mL Eau de Toilette dabbers in Arancia di Capri, Bergamotto di Calabria, Fico di Amalfi, Mirto di Panarea, Chinotto di Liguria",
//         "usage": {
//             "Suggested Usage:": "The difference lies in the volume of perfume oil. While EDT contains five to nine percent, EDP contains more, usually eight to 14 percent. EDPs, therefore, last longer and smell more intense.",
//             "Eau de Toilette or Eau de Parfum?:": "-Fragrance is intensified by the warmth of your own body. Apply in the creases of your knees and elbows for a longer-lasting, stronger scent. -After applying, avoid rubbing or dabbing skin. This breaks down the fragrance, causing it to wear off more quickly. -If you prefer placing fragrance on your wrists, be sure to reapply after frequent hand-washing, as this tends to rinse off the scent. -Replace fragrance after 12 months. Expired perfumes more than a year old lose the integrity of the original scent."
//         },
//         "brandDetails": null,
//         "ingredients": "Arancia di Capri Eau de Toilette: Alcohol Denat., Water, Fragrance, Limonene, Linalool, Ethylhexyl Methoxycinnamate, Citral, Butyl Methoxydibenzoylmethane, Ethylhexyl Salicylate, BHT, Geraniol, Benzyl Alcohol, Citronellol, Tocopherol.Bergamotto di Calabria Eau de Toilette:Alcohol Denat., Fragrance, Water, Limonene, Ethylhexyl Methoxycinnamate, Linalool, Citral, Butyl Methoxydibenzoylmethane, Ethylhexyl Salicylate, Alpha-Isomethyl Ionone, Bht, Citronellol, Geraniol. Fico di Amalfi Eau de Toilette: Alcohol Denat., Fragrance, Water, Limonene, Ethylhexyl Methoxycinnamate, Linalool, Alpha-Isomethyl Ionone, Hexyl Cinnamal, Butyl Methoxydibenzoylmethane, Ethylhexylsalicylate, Bht, Citronellol, Hydroxycitronellal, Coumarin, Citral, Geraniol, Amyl Cinnamal, Benzyl Salicylate, Butylphenyl Methylpropional, Benzyl Alcohol, Eugenol, Benzyl Benzoate, Disodium EDTA.Mirto di Panarea Eau de Toilette:Alcohol Denat., Fragrance, Water, Limonene, Linalool, Butylphenyl Methylpropional, Hexyl Cinnamal, Citronellol, Ethylhexyl Methoxycinnamate, Citral, Butyl Methoxydibenzoylmethane, Ethylhexyl Salicylate, Bht, Coumarin, Geraniol, Eugenol, Amyl Cinnamal. Chinotto di Liguria Eau de Toilette: Alcohol Denat., Water, Fragrance, Limonene, Linalool, Hexyl Cinnamal, Alpha-Isomethyl Ionone, Coumarin, Citral, Eugenol, Geraniol, Bht, Hydroxycitronellal, Citronellol, Benzyl Alcohol, Tocopherol.Acqua di Parma product ingredient listings are updated periodically. Before using an Acqua di Parma product, please read the ingredient list on the packaging of your product to be sure that the ingredients are appropriate for your personal use."
//     },
//     "reviews": {
//         "id": "P443401",
//         "name": "Blu Mediterraneo MINIATURE Set",
//         "brand": "Acqua Di Parma",
//         "brandId": "5847",
//         "description": "This enchanting set comes in a specially handcrafted blue box, and includes a selection of fragrances from the Blu Mediterraneo collection. A symbol of the Italian Mediterranean and the island of Capri, Arancia di Capri is sunny, relaxing, and carefree. In the air, hints of Italian citrus and the warm aroma of caramel blend together to create a pure moment of bliss, just like being on vacation.Soarkling, authentic bergamot shines at the onset of Bergamotto di Calabria. It is enhanced by the freshness of citron, red ginger, and cedarwood. At the base, an unprecedented combination of vetiver, benzoin, and musk emerges. The Amalfi Coast: it’s one of the most breathtaking places on Earth. Fico di Amalfi is a floral, woody, and citrusy fragrance that calls to mind this breathtaking stretch of Mediterranean coastline with a strong, energizing effect. Mirto di Panarea is characterized by the aromatic notes of myrtle and basil, it opens with lemon and bergamot. At the heart, a sea breeze accord melts with jasmine and rose. Its intense base includes lentisc and juniper with cedarwood and amber. Chinotto, the rarest and most precious citrus fruit, is a bittersweet treasure of Italy. This refreshing and lively scent is inspired by a unique land of contrasts. Like a perfect memory of a sunny morning walk overlooking the sea alongside chinotto and mandarin trees, Chinotto di Liguria evokes the delightful embrace of sand and sea.This set contains:- 0.16 oz/ 5 mL Eau de Toilette dabbers in Arancia di Capri, Bergamotto di Calabria, Fico di Amalfi, Mirto di Panarea, Chinotto di Liguria",
//         "EANS": [
//             "8028713571589"
//         ],
//         "UPCs": [],
//         "imageUrl": "https://www.sephora.com/productimages/sku/s2218774-main-grid.jpg",
//         "reviewComments": [
//             {
//                 "UserNickname": "AboutFace77",
//                 "Rating": 5,
//                 "ReviewText": "I have been waiting a while to see something like this from Acqua Di Parma.\nJust like the original, they all have that ever so  slight hint of a soapy base (that I usually dont like).....BUT, it's always light and clean, and subtle. I have enjoyed each one of these in this set. They work great alone or layered. The staying power is longer for some more than others.\nI recommend these for the Spring/Summer time. The box and mini bottles, look beautiful, and I'd consider this as a great gift for someone.",
//                 "ContextDataValues": {
//                     "skinType": {
//                         "Value": "combination",
//                         "Id": "skinType",
//                         "ValueLabel": "Combination",
//                         "DimensionLabel": "Skin Type"
//                     },
//                     "eyeColor": {
//                         "Value": "brown",
//                         "Id": "eyeColor",
//                         "ValueLabel": "Brown",
//                         "DimensionLabel": "Eye Color"
//                     },
//                     "StaffContext": {
//                         "Value": "false",
//                         "Id": "StaffContext",
//                         "ValueLabel": "No",
//                         "DimensionLabel": "I am a Sephora employee"
//                     },
//                     "hairColor": {
//                         "Value": "brunette",
//                         "Id": "hairColor",
//                         "ValueLabel": "Brunette",
//                         "DimensionLabel": "Hair color"
//                     },
//                     "skinTone": {
//                         "Value": "light",
//                         "Id": "skinTone",
//                         "ValueLabel": "Light",
//                         "DimensionLabel": "Skin Tone"
//                     },
//                     "IncentivizedReview": {
//                         "Value": "false",
//                         "Id": "IncentivizedReview",
//                         "ValueLabel": "False",
//                         "DimensionLabel": "I received this product as a free sample"
//                     },
//                     "age": {
//                         "Value": "35to44",
//                         "Id": "age",
//                         "ValueLabel": "35-44",
//                         "DimensionLabel": "Age"
//                     }
//                 },
//                 "ProductId": "P443401",
//                 "Videos": [],
//                 "CommentIds": [],
//                 "Photos": [],
//                 "TotalNegativeFeedbackCount": 6,
//                 "RatingRange": 5,
//                 "CampaignId": null,
//                 "UserLocation": null,
//                 "SecondaryRatingsOrder": [],
//                 "TotalCommentCount": 0,
//                 "ContextDataValuesOrder": [
//                     "eyeColor",
//                     "hairColor",
//                     "skinTone",
//                     "skinType",
//                     "age",
//                     "IncentivizedReview",
//                     "StaffContext"
//                 ],
//                 "ClientResponses": [],
//                 "TagDimensionsOrder": [],
//                 "TotalPositiveFeedbackCount": 22,
//                 "IsRatingsOnly": false,
//                 "LastModificationTime": "2019-07-27T09:21:03.000+00:00",
//                 "Pros": null,
//                 "ProductRecommendationIds": [],
//                 "BadgesOrder": [],
//                 "AuthorId": "8153275638",
//                 "Helpfulness": 0.785714,
//                 "SubmissionTime": "2019-05-08T02:22:00.000+00:00",
//                 "AdditionalFields": {
//                     "sociallockup": {
//                         "Label": "sociallockup",
//                         "Value": "avatar=https://sephora.i.lithium.com/t5/image/serverpage/avatar-name/default-avatar/avatar-theme/sephora/avatar-collection/sephora/avatar-display-size/profile/version/2?xdesc=1.0|biBadgeUrl=/html/rank_icons/birole_vib.png|engagementBadgeUrl=/html/rank_icons/rank_rookie-01.png|biTier=vib",
//                         "Id": "sociallockup"
//                     }
//                 },
//                 "Title": "Yes!",
//                 "AdditionalFieldsOrder": [
//                     "sociallockup"
//                 ],
//                 "TotalFeedbackCount": 28,
//                 "ModerationStatus": "APPROVED",
//                 "IsFeatured": false,
//                 "Cons": null,
//                 "TagDimensions": {},
//                 "SecondaryRatings": {},
//                 "Badges": {},
//                 "SubmissionId": "m1d7zu9kdxf17ob83o3l2aoaj",
//                 "IsSyndicated": false,
//                 "IsRecommended": true,
//                 "LastModeratedTime": "2019-05-08T02:30:03.000+00:00",
//                 "Id": "127741594",
//                 "ContentLocale": "en_US"
//             },
//             {
//                 "UserNickname": "Vansfan0923",
//                 "Rating": 5,
//                 "ReviewText": "I've been trying to find ADP samples for years, so I'm thrilled that Sephora stocks this set. The scents are all really unique, but still refreshing. I'm pretty partial to the Arnica and Bergamotto scents.",
//                 "ContextDataValues": {
//                     "skinType": {
//                         "Value": "oily",
//                         "Id": "skinType",
//                         "ValueLabel": "Oily",
//                         "DimensionLabel": "Skin Type"
//                     },
//                     "eyeColor": {
//                         "Value": "blue",
//                         "Id": "eyeColor",
//                         "ValueLabel": "Blue",
//                         "DimensionLabel": "Eye Color"
//                     },
//                     "StaffContext": {
//                         "Value": "false",
//                         "Id": "StaffContext",
//                         "ValueLabel": "No",
//                         "DimensionLabel": "I am a Sephora employee"
//                     },
//                     "hairColor": {
//                         "Value": "blonde",
//                         "Id": "hairColor",
//                         "ValueLabel": "Blonde",
//                         "DimensionLabel": "Hair color"
//                     },
//                     "skinTone": {
//                         "Value": "light",
//                         "Id": "skinTone",
//                         "ValueLabel": "Light",
//                         "DimensionLabel": "Skin Tone"
//                     },
//                     "IncentivizedReview": {
//                         "Value": "false",
//                         "Id": "IncentivizedReview",
//                         "ValueLabel": "False",
//                         "DimensionLabel": "I received this product as a free sample"
//                     }
//                 },
//                 "ProductId": "P443401",
//                 "Videos": [],
//                 "CommentIds": [],
//                 "Photos": [],
//                 "TotalNegativeFeedbackCount": 4,
//                 "RatingRange": 5,
//                 "CampaignId": null,
//                 "UserLocation": null,
//                 "SecondaryRatingsOrder": [],
//                 "TotalCommentCount": 0,
//                 "ContextDataValuesOrder": [
//                     "eyeColor",
//                     "hairColor",
//                     "skinTone",
//                     "skinType",
//                     "IncentivizedReview",
//                     "StaffContext"
//                 ],
//                 "ClientResponses": [],
//                 "TagDimensionsOrder": [],
//                 "TotalPositiveFeedbackCount": 20,
//                 "IsRatingsOnly": false,
//                 "LastModificationTime": "2019-08-19T19:16:07.000+00:00",
//                 "Pros": null,
//                 "ProductRecommendationIds": [],
//                 "BadgesOrder": [],
//                 "AuthorId": "8449561965",
//                 "Helpfulness": 0.833333,
//                 "SubmissionTime": "2019-05-02T19:13:03.000+00:00",
//                 "AdditionalFields": {
//                     "sociallockup": {
//                         "Label": "sociallockup",
//                         "Value": "avatar=https://sephora.i.lithium.com/t5/image/serverpage/avatar-name/default-avatar/avatar-theme/sephora/avatar-collection/sephora/avatar-display-size/profile/version/2?xdesc=1.0|biBadgeUrl=/html/rank_icons/birole_rouge.svg|engagementBadgeUrl=/html/rank_icons/rank_rookie-01.svg|biTier=ROUGE",
//                         "Id": "sociallockup"
//                     }
//                 },
//                 "Title": "FINALLY!",
//                 "AdditionalFieldsOrder": [
//                     "sociallockup"
//                 ],
//                 "TotalFeedbackCount": 24,
//                 "ModerationStatus": "APPROVED",
//                 "IsFeatured": false,
//                 "Cons": null,
//                 "TagDimensions": {},
//                 "SecondaryRatings": {},
//                 "Badges": {},
//                 "SubmissionId": "ma2umeexq9re0siyg5m8v37jw",
//                 "IsSyndicated": false,
//                 "IsRecommended": true,
//                 "LastModeratedTime": "2019-05-02T19:15:05.000+00:00",
//                 "Id": "127570748",
//                 "ContentLocale": "en_US"
//             },
//             {
//                 "UserNickname": "gn505",
//                 "Rating": 1,
//                 "ReviewText": "Love every scent in this set. My old time favorite is Fico BUT when I opened the box which was sealed that one bottle was half empty and nothing was spilled inside of the box...The rest of the bottles were full.",
//                 "ContextDataValues": {
//                     "StaffContext": {
//                         "Value": "false",
//                         "Id": "StaffContext",
//                         "ValueLabel": "No",
//                         "DimensionLabel": "I am a Sephora employee"
//                     },
//                     "IncentivizedReview": {
//                         "Value": "false",
//                         "Id": "IncentivizedReview",
//                         "ValueLabel": "False",
//                         "DimensionLabel": "I received this product as a free sample"
//                     }
//                 },
//                 "ProductId": "P443401",
//                 "Videos": [],
//                 "CommentIds": [],
//                 "Photos": [],
//                 "TotalNegativeFeedbackCount": 6,
//                 "RatingRange": 5,
//                 "CampaignId": null,
//                 "UserLocation": null,
//                 "SecondaryRatingsOrder": [],
//                 "TotalCommentCount": 0,
//                 "ContextDataValuesOrder": [
//                     "IncentivizedReview",
//                     "StaffContext"
//                 ],
//                 "ClientResponses": [],
//                 "TagDimensionsOrder": [],
//                 "TotalPositiveFeedbackCount": 1,
//                 "IsRatingsOnly": false,
//                 "LastModificationTime": "2019-08-24T04:04:07.000+00:00",
//                 "Pros": null,
//                 "ProductRecommendationIds": [],
//                 "BadgesOrder": [],
//                 "AuthorId": "1322199000",
//                 "Helpfulness": 0.142857,
//                 "SubmissionTime": "2019-08-11T19:49:39.000+00:00",
//                 "AdditionalFields": {
//                     "sociallockup": {
//                         "Label": "sociallockup",
//                         "Value": "avatar=https://sephora.i.lithium.com/t5/image/serverpage/avatar-name/default-avatar/avatar-theme/sephora/avatar-collection/sephora/avatar-display-size/profile/version/2?xdesc=1.0|biBadgeUrl=/html/rank_icons/birole_rouge.svg|engagementBadgeUrl=/html/rank_icons/rank_rookie-01.svg|biTier=ROUGE",
//                         "Id": "sociallockup"
//                     }
//                 },
//                 "AdditionalFieldsOrder": [
//                     "sociallockup"
//                 ],
//                 "TotalFeedbackCount": 7,
//                 "Title": null,
//                 "ModerationStatus": "APPROVED",
//                 "IsFeatured": false,
//                 "Cons": null,
//                 "TagDimensions": {},
//                 "SecondaryRatings": {},
//                 "Badges": {},
//                 "SubmissionId": "swt2xcxx9c6tupr1kne8wjr9q",
//                 "IsSyndicated": false,
//                 "IsRecommended": false,
//                 "LastModeratedTime": "2019-08-11T20:15:05.000+00:00",
//                 "Id": "131354293",
//                 "ContentLocale": "en_US"
//             },
//             {
//                 "UserNickname": "CielW",
//                 "Rating": 5,
//                 "ReviewText": "I really love this set, I can have 5 different scents. Mirto Di Panarea is my favorite.",
//                 "ContextDataValues": {
//                     "skinType": {
//                         "Value": "combination",
//                         "Id": "skinType",
//                         "ValueLabel": "Combination",
//                         "DimensionLabel": "Skin Type"
//                     },
//                     "eyeColor": {
//                         "Value": "brown",
//                         "Id": "eyeColor",
//                         "ValueLabel": "Brown",
//                         "DimensionLabel": "Eye Color"
//                     },
//                     "StaffContext": {
//                         "Value": "false",
//                         "Id": "StaffContext",
//                         "ValueLabel": "No",
//                         "DimensionLabel": "I am a Sephora employee"
//                     },
//                     "hairColor": {
//                         "Value": "black",
//                         "Id": "hairColor",
//                         "ValueLabel": "Black",
//                         "DimensionLabel": "Hair color"
//                     },
//                     "skinTone": {
//                         "Value": "light",
//                         "Id": "skinTone",
//                         "ValueLabel": "Light",
//                         "DimensionLabel": "Skin Tone"
//                     },
//                     "IncentivizedReview": {
//                         "Value": "false",
//                         "Id": "IncentivizedReview",
//                         "ValueLabel": "False",
//                         "DimensionLabel": "I received this product as a free sample"
//                     }
//                 },
//                 "ProductId": "P443401",
//                 "Videos": [],
//                 "CommentIds": [],
//                 "Photos": [],
//                 "TotalNegativeFeedbackCount": 0,
//                 "RatingRange": 5,
//                 "CampaignId": null,
//                 "UserLocation": null,
//                 "SecondaryRatingsOrder": [],
//                 "TotalCommentCount": 0,
//                 "ContextDataValuesOrder": [
//                     "eyeColor",
//                     "hairColor",
//                     "skinTone",
//                     "skinType",
//                     "IncentivizedReview",
//                     "StaffContext"
//                 ],
//                 "ClientResponses": [],
//                 "TagDimensionsOrder": [],
//                 "TotalPositiveFeedbackCount": 0,
//                 "IsRatingsOnly": false,
//                 "LastModificationTime": "2019-09-04T21:30:05.000+00:00",
//                 "Pros": null,
//                 "ProductRecommendationIds": [],
//                 "BadgesOrder": [],
//                 "AuthorId": "9083057347",
//                 "Helpfulness": null,
//                 "SubmissionTime": "2019-09-04T21:00:50.000+00:00",
//                 "AdditionalFields": {
//                     "sociallockup": {
//                         "Label": "sociallockup",
//                         "Value": "avatar=https://sephora.i.lithium.com/t5/image/serverpage/avatar-name/default-avatar/avatar-theme/sephora/avatar-collection/sephora/avatar-display-size/profile/version/2?xdesc=1.0|biBadgeUrl=/html/rank_icons/birole_vib.png|engagementBadgeUrl=/html/rank_icons/rank_rookie-01.png|biTier=vib",
//                         "Id": "sociallockup"
//                     }
//                 },
//                 "AdditionalFieldsOrder": [
//                     "sociallockup"
//                 ],
//                 "TotalFeedbackCount": 0,
//                 "Title": null,
//                 "ModerationStatus": "APPROVED",
//                 "IsFeatured": false,
//                 "Cons": null,
//                 "TagDimensions": {},
//                 "SecondaryRatings": {},
//                 "Badges": {},
//                 "SubmissionId": "mo5eg659vmfxdq3xopplvqfnk",
//                 "IsSyndicated": false,
//                 "IsRecommended": true,
//                 "LastModeratedTime": "2019-09-04T21:30:05.000+00:00",
//                 "Id": "132084231",
//                 "ContentLocale": "en_US"
//             }
//         ],
//         "reviewStatistics": {
//             "FeaturedReviewCount": 0,
//             "RecommendedCount": 3,
//             "SecondaryRatingsAveragesOrder": [],
//             "AverageOverallRating": 4,
//             "NotHelpfulVoteCount": 16,
//             "RatingDistribution": [
//                 {
//                     "RatingValue": 1,
//                     "Count": 1
//                 },
//                 {
//                     "RatingValue": 5,
//                     "Count": 3
//                 }
//             ],
//             "RatingsOnlyReviewCount": 0,
//             "FirstSubmissionTime": "2019-05-02T19:13:03.000+00:00",
//             "TagDistribution": {},
//             "ContextDataDistribution": {
//                 "skinType": {
//                     "Label": "Skin Type",
//                     "Values": [
//                         {
//                             "Value": "combination",
//                             "Count": 2
//                         },
//                         {
//                             "Value": "oily",
//                             "Count": 1
//                         }
//                     ],
//                     "Id": "skinType"
//                 },
//                 "eyeColor": {
//                     "Label": "Eye Color",
//                     "Values": [
//                         {
//                             "Value": "blue",
//                             "Count": 1
//                         },
//                         {
//                             "Value": "brown",
//                             "Count": 2
//                         }
//                     ],
//                     "Id": "eyeColor"
//                 },
//                 "StaffContext": {
//                     "Label": "I am a Sephora employee",
//                     "Values": [
//                         {
//                             "Value": "false",
//                             "Count": 4
//                         }
//                     ],
//                     "Id": "StaffContext"
//                 },
//                 "hairColor": {
//                     "Label": "Hair color",
//                     "Values": [
//                         {
//                             "Value": "blonde",
//                             "Count": 1
//                         },
//                         {
//                             "Value": "brunette",
//                             "Count": 1
//                         },
//                         {
//                             "Value": "black",
//                             "Count": 1
//                         }
//                     ],
//                     "Id": "hairColor"
//                 },
//                 "skinTone": {
//                     "Label": "Skin Tone",
//                     "Values": [
//                         {
//                             "Value": "light",
//                             "Count": 3
//                         }
//                     ],
//                     "Id": "skinTone"
//                 },
//                 "IncentivizedReview": {
//                     "Label": "I received this product as a free sample",
//                     "Values": [
//                         {
//                             "Value": "false",
//                             "Count": 4
//                         }
//                     ],
//                     "Id": "IncentivizedReview"
//                 },
//                 "age": {
//                     "Label": "Age",
//                     "Values": [
//                         {
//                             "Value": "35to44",
//                             "Count": 1
//                         }
//                     ],
//                     "Id": "age"
//                 }
//             },
//             "TotalReviewCount": 4,
//             "LastSubmissionTime": "2019-09-04T21:00:50.000+00:00",
//             "TagDistributionOrder": [],
//             "OverallRatingRange": 5,
//             "NotRecommendedCount": 1,
//             "HelpfulVoteCount": 43,
//             "SecondaryRatingsAverages": {},
//             "ContextDataDistributionOrder": [
//                 "eyeColor",
//                 "hairColor",
//                 "skinTone",
//                 "skinType",
//                 "age",
//                 "IncentivizedReview",
//                 "StaffContext"
//             ]
//         },
//         "totalResults": 4,
//         "rawData": {
//             "CategoryId": "cat60146",
//             "EANs": [
//                 "8028713571589"
//             ],
//             "Description": "This enchanting set comes in a specially handcrafted blue box, and includes a selection of fragrances from the Blu Mediterraneo collection. A symbol of the Italian Mediterranean and the island of Capri, Arancia di Capri is sunny, relaxing, and carefree. In the air, hints of Italian citrus and the warm aroma of caramel blend together to create a pure moment of bliss, just like being on vacation.Soarkling, authentic bergamot shines at the onset of Bergamotto di Calabria. It is enhanced by the freshness of citron, red ginger, and cedarwood. At the base, an unprecedented combination of vetiver, benzoin, and musk emerges. The Amalfi Coast: it’s one of the most breathtaking places on Earth. Fico di Amalfi is a floral, woody, and citrusy fragrance that calls to mind this breathtaking stretch of Mediterranean coastline with a strong, energizing effect. Mirto di Panarea is characterized by the aromatic notes of myrtle and basil, it opens with lemon and bergamot. At the heart, a sea breeze accord melts with jasmine and rose. Its intense base includes lentisc and juniper with cedarwood and amber. Chinotto, the rarest and most precious citrus fruit, is a bittersweet treasure of Italy. This refreshing and lively scent is inspired by a unique land of contrasts. Like a perfect memory of a sunny morning walk overlooking the sea alongside chinotto and mandarin trees, Chinotto di Liguria evokes the delightful embrace of sand and sea.This set contains:- 0.16 oz/ 5 mL Eau de Toilette dabbers in Arancia di Capri, Bergamotto di Calabria, Fico di Amalfi, Mirto di Panarea, Chinotto di Liguria",
//             "ModelNumbers": [],
//             "Attributes": {
//                 "BV_FE_EXPAND": {
//                     "Values": [
//                         {
//                             "Locale": null,
//                             "Value": "BV_FE_FAMILY:P443401"
//                         }
//                     ],
//                     "Id": "BV_FE_EXPAND"
//                 },
//                 "BV_FE_FAMILY": {
//                     "Values": [
//                         {
//                             "Locale": null,
//                             "Value": "P443401"
//                         }
//                     ],
//                     "Id": "BV_FE_FAMILY"
//                 }
//             },
//             "ImageUrl": "https://www.sephora.com/productimages/sku/s2218774-main-grid.jpg",
//             "BrandExternalId": "5847",
//             "UPCs": [],
//             "ReviewStatistics": {
//                 "FeaturedReviewCount": 0,
//                 "RecommendedCount": 3,
//                 "SecondaryRatingsAveragesOrder": [],
//                 "AverageOverallRating": 4,
//                 "NotHelpfulVoteCount": 16,
//                 "RatingDistribution": [
//                     {
//                         "RatingValue": 1,
//                         "Count": 1
//                     },
//                     {
//                         "RatingValue": 5,
//                         "Count": 3
//                     }
//                 ],
//                 "RatingsOnlyReviewCount": 0,
//                 "FirstSubmissionTime": "2019-05-02T19:13:03.000+00:00",
//                 "TagDistribution": {},
//                 "ContextDataDistribution": {
//                     "skinType": {
//                         "Label": "Skin Type",
//                         "Values": [
//                             {
//                                 "Value": "combination",
//                                 "Count": 2
//                             },
//                             {
//                                 "Value": "oily",
//                                 "Count": 1
//                             }
//                         ],
//                         "Id": "skinType"
//                     },
//                     "eyeColor": {
//                         "Label": "Eye Color",
//                         "Values": [
//                             {
//                                 "Value": "blue",
//                                 "Count": 1
//                             },
//                             {
//                                 "Value": "brown",
//                                 "Count": 2
//                             }
//                         ],
//                         "Id": "eyeColor"
//                     },
//                     "StaffContext": {
//                         "Label": "I am a Sephora employee",
//                         "Values": [
//                             {
//                                 "Value": "false",
//                                 "Count": 4
//                             }
//                         ],
//                         "Id": "StaffContext"
//                     },
//                     "hairColor": {
//                         "Label": "Hair color",
//                         "Values": [
//                             {
//                                 "Value": "blonde",
//                                 "Count": 1
//                             },
//                             {
//                                 "Value": "brunette",
//                                 "Count": 1
//                             },
//                             {
//                                 "Value": "black",
//                                 "Count": 1
//                             }
//                         ],
//                         "Id": "hairColor"
//                     },
//                     "skinTone": {
//                         "Label": "Skin Tone",
//                         "Values": [
//                             {
//                                 "Value": "light",
//                                 "Count": 3
//                             }
//                         ],
//                         "Id": "skinTone"
//                     },
//                     "IncentivizedReview": {
//                         "Label": "I received this product as a free sample",
//                         "Values": [
//                             {
//                                 "Value": "false",
//                                 "Count": 4
//                             }
//                         ],
//                         "Id": "IncentivizedReview"
//                     },
//                     "age": {
//                         "Label": "Age",
//                         "Values": [
//                             {
//                                 "Value": "35to44",
//                                 "Count": 1
//                             }
//                         ],
//                         "Id": "age"
//                     }
//                 },
//                 "TotalReviewCount": 4,
//                 "LastSubmissionTime": "2019-09-04T21:00:50.000+00:00",
//                 "TagDistributionOrder": [],
//                 "OverallRatingRange": 5,
//                 "NotRecommendedCount": 1,
//                 "HelpfulVoteCount": 43,
//                 "SecondaryRatingsAverages": {},
//                 "ContextDataDistributionOrder": [
//                     "eyeColor",
//                     "hairColor",
//                     "skinTone",
//                     "skinType",
//                     "age",
//                     "IncentivizedReview",
//                     "StaffContext"
//                 ]
//             },
//             "Name": "Blu Mediterraneo MINIATURE Set",
//             "Brand": {
//                 "Id": "5847",
//                 "Name": "Acqua Di Parma"
//             },
//             "TotalReviewCount": 4,
//             "QuestionIds": [],
//             "FamilyIds": [
//                 "P443401"
//             ],
//             "ReviewIds": [],
//             "ProductPageUrl": "https://www.sephora.com/product/blu-mediterraneo-minature-set-P443401",
//             "ISBNs": [],
//             "Id": "P443401",
//             "AttributesOrder": [
//                 "BV_FE_EXPAND",
//                 "BV_FE_FAMILY"
//             ],
//             "ManufacturerPartNumbers": [],
//             "StoryIds": []
//         }
//     },
//     "classificationHierarchy": [
//         "Fragrance",
//         "Value & Gift Sets"
//     ]
// }
//
// let s = new ProductPersistService(payload);
// s.invoke().then((r) => {
//     console.log('-----------------------------')
//     console.log(r);
//     console.log('-----------------------------')
// });
//


module.exports = ProductPersistService;


