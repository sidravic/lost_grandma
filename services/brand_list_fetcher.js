require('./proxy/proxy.js');
const logger = require('../config/logger');
const Crawler = require('simplecrawler');
const ProductParserService = require('./product_parser_service');
const {generateRandomTill, sleep} = require('./utils')
const path = require('path');
const {SocksAgent, checkNewCircuitIp, recreateCircuit} = require('./proxy');

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

const getUserAgentString = () => {
    const userAgents = ['Mozilla/5.0 (Linux; Android 8.0.0; SM-G960F Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.84 Mobile Safari/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/13.2b11866 Mobile/16A366 Safari/605.1.15',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.34 (KHTML, like Gecko) Version/11.0 Mobile/15A5341f Safari/604.1',
        'Mozilla/5.0 (Linux; Android 4.4.3; KFTHWI Build/KTU84M) AppleWebKit/537.36 (KHTML, like Gecko) Silk/47.1.79 like Chrome/47.0.2526.80 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) AppleWebKit/601.3.9 (KHTML, like Gecko) Version/9.0.2 Safari/601.3.9',
        'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.111 Safari/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Mobile/15E148 Safari/604.1'
    ]

    let index = generateRandomTill(userAgents.length)
    return userAgents[index];
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
        this.crawler.interval = 10000;
        this.crawler.maxConcurrency = 2;
        this.crawler.maxDepth = 0;
        this.crawler.respectRobotsTxt = false;
        this.crawler.crawlerUserAgent = getUserAgentString();
    }

    setFetchConditions() {
        let isBrandOrProductPageCallback = isBrandPageOrAllProductsPage(this)
        this.crawler.addFetchCondition(isBrandOrProductPageCallback);
        this.crawler.on('fetchcomplete', onFetchComplete)
        this.crawler.on('discoverycomplete', onDiscoveryComplete)
        this.crawler.on('fetchdisallowed', (queueItem) => {
            logger.error({src: 'BrandListFetcher', event: 'fetchDisallowed', queueItem: queueItem})
        });

        this.crawler.on('fetchclienterror', (queueItem, error) => {
            logger.error({src: 'BrandListFetcher', event: 'fetchclienterror', queueItem: queueItem, error: error});
        })

        this.crawler.on('fetcherror', async (queueItem, error) => {

            logger.error({
                src: 'BrandListFetcher',
                event: 'fetcherror',
                queueUrl: queueItem.url,
                statusCode: error.statusCode,
                error: error
            });
            if ((error.statusCode == 403) || (error.statusCode == 429)) {
                let continueCrawl = this.crawler.wait();
                let sleepDelay = 10
                await recreateCircuit();
                await checkNewCircuitIp();
                logger.info({event: `sleeping for ${sleepDelay} seconds`})
                await sleep(sleepDelay);
                await this.addToCrawlerQueue(queueItem.url, true);
                continueCrawl();
            }
        })

        this.crawler.on('complete', () => {
            logger.info({src: 'BrandListFetcher', event: 'complete'})
        })

        this.crawler.on('fetchtimeout', (queueItem, timeout) => {
            logger.error({event: 'fetchtimeout', queueUrl: queueItem.url, timeout: timeout})
        })

        this.crawler.on('fetchstart', (q, e) => {
        })

        this.crawler.on('fetchclienterror', (queueItem, error) => {
            logger.error({event: 'fetchclienterror', queueUrl: queueItem.url, error: error})
        })

        this.crawler.on('queueerror', (queueItem, error) => {
            logger.error({event: 'queueerror', queueUrl: queueItem.url})
        })

        this.crawler.on('downloadconditionerror', (queueItem, error) => {
            logger.error({event: 'downloadconditionerror', queueUrl: queueItem.url})
        })

        this.crawler.on('fetchdisallowed', (queueItem, error) => {
            logger.error({event: 'fetchdisallowed', queueUrl: queueItem.url})
        })

        this.crawler.on('fetchheaders', (q, response) => {
        })

        this.crawler.on('queueadd', (queueItem, referrer) => {
            logger.debug({event: 'queueItemAdded', queueUrl: queueItem.url, referrer: referrer});
        })

        this.crawler.on('queueduplicate', (queueItem) => {
            logger.error({event: 'queueduplicate', queueUrl: queueItem.url});
        })

        this.crawler.on('queueerror', (error, queueItem) => {
            logger.error({event: 'queueerror', queueUrl: queueItem.url, error: error});
        })

        this.crawler.on('fetchredirect', (queueItem, redirectedQueueItem, response) => {
            logger.error({event: 'fetchredirect', queueUrl: queueItem.url, redirectedUrl: redirectedQueueItem.url});
        })

        this.crawler.on('fetch404', (queueItem, r) => {
            logger.error({event: 'fetch404', queueUrl: queueItem.url});
        })

        this.crawler.on('fetchprevented', (queueItem, error) => {
            logger.debug({event: 'fetchPrevented', queueItem: queueItem.url})
        })
    }

    async enableQueueFromLastFetch() {
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

    addToCrawlerQueue(url, force = false) {

        let queuedStatus = this.crawler.queueURL(url, url, force)
        if (queuedStatus) {
            logger.info({event: 'addToCrawlerQueue', path: url.toString()});
        } else {
            throw new Error(`Could not add to queue URL ${url.path}`);
        }

        return;
    }

    async freezeQueue() {
        console.log('freezeQueue called');

        this.crawler.queue.freeze(this.queueFilePath, (error) => {
            console.log('error status', error);

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
// const fetcher = new BrandListFetcher('https://www.sephora.com/brand/acqua-di-parma/all');
// console.log('Starting fetcher');
// fetcher.invoke();

module.exports = BrandListFetcher;
