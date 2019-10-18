const logger = require('../config/logger');
const Crawler = require('simplecrawler');
const ProductParserService = require('./product_parser_service');
const path = require('path');

const isBrandPageOrAllProductsPage = (fetcherService) => {

    return (url) => {
        const isValid = (isBrandPage(url, fetcherService) || (isAllProductsPage(url) || (isProductPage(url))));
        if (isValid) {
            logger.info({event: 'isBrandPageOrAllProductsPage', path: url.path, added: isValid})
        }
        return isValid;
    }
}

const isBrandPage = (url, fetcherService) => {
    const regexp = /(^\/brand\/(\w|-)+$)/;
    const isValid = regexp.test(url.path.toString())
    if (isValid) {
        let allProductsUrl = url.protocol + '://' + url.host + url.uriPath + '/all';
        fetcherService.addToCrawlerQueue(allProductsUrl)
        logger.debug({path: url.path, isBrandPage: isValid})
    }

    return isValid;
}

const isAllProductsPage = (url) => {
    const regexp = /(^\/brand\/(\w|-)+(\/all)$)/;
    const isValid = regexp.test(url.path.toString())
    if (isValid) {
        logger.debug({path: url.path, isAllProductsPage: isValid})
    }
    return isValid
}

const isProductPage = (url) => {
    const regexp = /^\/product\/(\w|-)+(\?.*)?/;

    const isValid = regexp.test(url.path.toString());
    if (isValid) {
        logger.debug({event: 'isProductPage', path: url.path, isProductPage: isValid})
    }
    return isValid;
}

const onFetchComplete = async (queueItem, responseBuffer, response) => {

    logger.info({event: 'fetchComplete', path: queueItem.path});

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
        this.queueFilePath = process.env.QUEUE_FILE_PATH
    }

    async invoke() {
        this.initializeCrawlerSettings();
        this.setFetchConditions();
        await this.enableQueueFromLastFetch();
        this.crawler.start();
    }

    initializeCrawlerSettings() {
        this.crawler.interval = 5000;
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

    async enableQueueFromLastFetch() {
        debugger;
        this.crawler.queue.defrost(this.queueFilePath, (error) => {

            if (error) {
                logger.error({
                    src: 'BrandListFetcher',
                    event: 'enableQueueFromLastFetch',
                    error: error,
                    message: 'Could not load queue from last fetch'
                })
            } else {
                logger.info({
                    src: 'BrandListFetcher',
                    event: 'enableQueueFromLastFetch',
                    message: 'Loaded queue from last fetch'
                })
            }

            setTimeout(() => {
                return error;
            }, 20000)

        })
    }

    addToCrawlerQueue(url) {

        let queuedStatus = this.crawler.queueURL(url)
        if (queuedStatus) {
            logger.info({event: 'addToCrawlerQueue', path: url.path.toString()});
        } else {
            throw new Error(`Could not add to queue URL ${url.path}`);
        }

        return;
    }

    async freezeQueue() {
        console.log('freezeQueue called');

        this.crawler.queue.freeze(this.queueFilePath, (error) => {
            console.log('error status', error);
            debugger;
            if (error) {
                logger.error({src: 'BrandListFetcher', event: 'freezeQueue', error: error})

            } else {
                logger.info({src: 'BrandListFetcher', event: 'freezeQueue', msg: 'Saved queue successfully.'})
            }


        })
    }
}

//
//https://www.sephora.com/brand/acqua-di-parma/all
//'https://www.sephora.com/product/blu-mediterraneo-cipresso-di-toscana-P447762?icid2=acquadiparma_bestsellers_us_productcarousel_ufe:p447762:product'
//https://www.sephora.com/product/blu-mediterraneo-cipresso-di-toscana-P447762?icid2=acquadiparma_bestsellers_us_productcarousel_ufe:p447762:product
// const fetcher = new BrandListFetcher('https://www.sephora.com/brands-list');
// console.log('Starting fetcher');
// fetcher.invoke();

module.exports = BrandListFetcher;
