const logger = require('../config/logger');
const Crawler = require('simplecrawler');
const ProductParserService = require('./product_parser_service');

const isBrandPageOrAllProductsPage = (fetcherService) => {

    return (url) => {
        const isValid = (isBrandPage(url, fetcherService) || (isAllProductsPage(url) || (isProductPage(url))));
        if (isValid) { logger.debug({path: url.path, added: isValid}) };

        return isValid;
    }
}

const isBrandPage = (url, fetcherService) => {
    const regexp = /(^\/brand\/(\w|-)+$)/;
    const isValid = regexp.test(url.path.toString())
    if (isValid) { logger.debug({path: url.path, isBrandPage: isValid})  };

    return isValid;
}

const isAllProductsPage = (url) => {
    const regexp = /(^\/brand\/(\w|-)+(\/all)$)/;
    const isValid = regexp.test(url.path.toString())
    if (isValid) { logger.debug({path: url.path, isAllProductsPage: isValid}) }
    return isValid
}

const isProductPage = (url) => {
    const regexp = /^\/product\/(\w|-)+(\?.*)?/;

    const isValid = regexp.test(url.path.toString());
    if (isValid) { logger.debug({ path: url.path, isProductPage: isValid}) }
    return isValid;
}

const onFetchComplete = async (queueItem, responseBuffer, response) => {

    logger.info({ event: 'fetchComplete', path: queueItem.path});

    if (isProductPage(queueItem)) {
        let parserService = new ProductParserService(responseBuffer.toString(), queueItem);
        await parserService.invoke();
    }
}

const onDiscoveryComplete = (queueItem, resources) => {

    logger.debug({event: 'onDiscoveryComplete', queueItems: queueItem})
}


class BrandListFetcher {
    constructor(defaultStartUri) {
        this.defaultStartUri = defaultStartUri;
        this.crawler = Crawler(this.defaultStartUri);
    }

    invoke() {
        this.initializeCrawlerSettings();
        this.setFetchConditions();
        this.crawler.start();
    }

    initializeCrawlerSettings() {
        this.crawler.interval = 10000;
        this.crawler.maxConcurrency = 2;
        this.crawler.maxDepth = 0;
        this.crawler.respectRobotsTxt = false;
        this.crawler.crawlerUserAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.3';
    }

    setFetchConditions() {
        let isBrandOrProductPageCallback = isBrandPageOrAllProductsPage(this)

        this.crawler.addFetchCondition(isBrandOrProductPageCallback);
        this.crawler.on('fetchcomplete', onFetchComplete)
        this.crawler.on('discoverycomplete', onDiscoveryComplete)
    }

    addToCrawlerQueue(url){

        if(this.crawler.queueURL(url)) {
            logger.info({event: 'addToQueueUrl', path: url.path.toString()});
        } else {
            throw new Error(`Could not add to queue URL ${url.path}`);
        }
    }
}

//https://www.sephora.com/brands-list
//https://www.sephora.com/brand/acqua-di-parma/all

const fetcher = new BrandListFetcher('https://www.sephora.com/product/alyssa-edwards-eyeshadow-palette-P444956?icid2=anastasia_whatsnew_us_productcarousel_ufe:p444956:product');
console.log('Starting fetcher');
fetcher.invoke();

