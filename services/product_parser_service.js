const logger = require('./../config/logger');
const cheerio = require('cheerio');
const url = require('url')

const ProductFeedbackFetcherService = require('./product_feedback_fetcher');
const PersistQueue = require('./../workers/persist_queue').PersistQueue;

const { isEmpty }  = require('./utils');

const productInfoTemplate = () => {
    return {
        productUrl: null,
        name: null,
        brand: null,
        sephoraProductId: null,
        price: null,
        images: [],
        productDetails: {
            sizes: [],
            details: null,
            usage: null,
            brandDetails: null
        },
        reviews: {
            averageRating: null,
            ratingScale: null,
            userReviews: []
        },
        classificationHierarchy: []
    }
}

const parseUsageHTML = (usageHTML) => {
    let usage = {}
    let originalHTML = usageHTML;

    if (!originalHTML) {
        return usage;
    }

    let newHTML = originalHTML.replace(/<br>/gi, '');
    let $ = cheerio.load(newHTML)

    $('b').map((index, element) => {
        let key = $(element).text().trim();
        let firstElement = $(element).siblings()[0];

        if(firstElement){
            let nextElement = firstElement.next;
            usage[key] = nextElement.data.trim();
        }

        return usage;
    })

    if(isEmpty(usage)) {
        usage['default'] = newHTML;
    }

    return usage;
}

class ProductParserService {
    constructor(productHTML, queueItem) {
        this.productHTML = productHTML;
        this.queueItem = queueItem;
        this.productInfo = productInfoTemplate();
        this.productId = null;
        this.$ = null;
    }

    async invoke() {
        this.loadData();
        this.findProductId();
        this.findProductName();
        this.findProductBrand();
        this.findSephoraProductUrl();
        this.findSephoraProductId();
        this.findPriceAndSize();
        this.findImages();
        this.findProductDetails();
        this.findClassificationHierarchy();
        await this.findReviews();
        await this.addToPersistQueue()
    }

    loadData() {
        this.$ = cheerio.load(this.productHTML);
    }

    findProductId() {
        let pathUrl = this.queueItem.uriPath;
        let productSlug = pathUrl.split('/').pop();
        let productId = productSlug.split('-').pop();
        this.productId = productId;
    }

    findProductBrand() {
        let brand = this.$('h1 a span').html().trim();
        this.productInfo.brand = brand;
    }

    findProductName() {
        let name = this.$('h1 span.css-0').html().trim();
        this.productInfo.name = name;
    }

    findSephoraProductUrl() {
        let productUrl = this.queueItem.url;

        if(productUrl) {
            let parsedUrl = url.parse(productUrl)
            let sourceUrl = parsedUrl.protocol + '//' + parsedUrl.host + parsedUrl.pathname
            productUrl = sourceUrl;
        }
        this.productInfo.productUrl = productUrl;
    }

    findSephoraProductId() {
        let sizeAndSephoraItemId = this.$('div.css-1qf1va5').text();
        let [size, itemId] = sizeAndSephoraItemId.split('•');
        this.productInfo.sephoraProductId = itemId;
    }

    findPriceAndSize() {
        let price = this.$('.css-14hdny6 ').text();
        let size = null;
        let sizeAndSephoraItemId = this.$('.css-1qf1va5 ').text();
        if (sizeAndSephoraItemId.trim() != "") {
            size = sizeAndSephoraItemId.split('•')[0];
        }

        this.productInfo.productDetails.sizes.push({size: size, price: price})
    }

    findImages() {
        let images = this.$('svg image');
        let relevantImages = Object.keys(images).map((key) => {
            if (!isNaN(parseInt(key))) return images[key].attribs.href
        }).filter((elem) => {
            return elem !== undefined
        })
        this.productInfo.images = relevantImages;
    }

    findProductDetails() {
        this.findDetails();
        this.findUsage();
        this.findIngredients();
    }

    findDetails() {
        let detailsElement = this.$('.css-pz80c5')[0];
        let details = this.$(detailsElement).text();
        this.productInfo.productDetails.details = details;
    }

    findIngredients() {
        let ingredientsElement = this.$('.css-pz80c5')[2];
        let ingredients = this.$(ingredientsElement).text();
        this.productInfo.productDetails.ingredients = ingredients;
    }

    findUsage() {
        let usageElement = this.$('.css-pz80c5')[1];
        let usageHTML = this.$(usageElement).html();
        let usage = parseUsageHTML(usageHTML)
        this.productInfo.productDetails.usage = usage;
    }

    findClassificationHierarchy() {
        let categories = this.$('.css-1ylrown');

        let classificationHierarchy = Object.keys(categories).map((key) => {
            if (!isNaN(parseInt(key))) return categories[key].children[0].data
        }).filter((elem) => {
            return elem !== undefined
        })

        this.productInfo.classificationHierarchy = classificationHierarchy;
    }

    async findReviews() {
        let productReviewService = new ProductFeedbackFetcherService(this.productId)
        let productReviews = await productReviewService.invoke();
        this.productInfo.reviews = productReviews;
    }

    async addToPersistQueue(){
        const retryOptions = { removeOnComplete: true, attempts: 50}
        const job = await PersistQueue.add('persist_queue', JSON.stringify(this.productInfo), retryOptions);
        logger.info({ src: 'ProductParserService', event: 'JobAddedToPersistQueue', data: {productId: this.productId, url: this.queueItem.url }});
    }
}

module.exports = ProductParserService;