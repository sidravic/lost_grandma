require('./proxy/proxy.js');
const fs = require('fs');
const path = require('path');
const s3 = require('./../config/aws_s3_client');
const logger = require('../config/logger');
const Crawler = require('simplecrawler');
const ProductParserService = require('./product_parser_service');
const { generateRandomTill, sleep } = require('./utils')
const { SocksAgent, checkNewCircuitIp, recreateCircuit } = require('./proxy');

const isBrandPageOrAllProductsPage = (fetcherService) => {

    return (url) => {
        const isValid = (isBrandPage(url, fetcherService) || (isAllProductsPage(url) || (isProductPage(url))));
        if (isValid) {
            logger.info({ event: 'isBrandPageOrAllProductsPage', path: url.path, added: isValid })
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
        logger.debug({ path: url.path, isBrandPage: isValid })
    }

    return isValid;
}

const isAllProductsPage = (url) => {
    const regexp = /(^\/brand\/(\w|-)+(\/all)$)/;
    const isValid = regexp.test(url.path.toString())
    if (isValid) {
        logger.debug({ path: url.path, isAllProductsPage: isValid })
    }
    return isValid
}

const isProductPage = (url) => {
    const regexp = /^\/product\/(\w|-)+(\?.*)?/;

    const isValid = regexp.test(url.path.toString());
    if (isValid) {
        logger.debug({ event: 'isProductPage', path: url.path, isProductPage: isValid })
    }
    return isValid;
}

const onFetchComplete = async (queueItem, responseBuffer, response) => {

    logger.info({ event: 'fetchComplete', path: queueItem.path });
    if (isProductPage(queueItem)) {
        let parserService = new ProductParserService(responseBuffer.toString(), queueItem);
        await parserService.invoke();
    }
}

const onDiscoveryComplete = (queueItem, resources) => {

    logger.debug({ event: 'onDiscoveryComplete', queueItems: queueItem })
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
        this.queueFilePath = path.join(__dirname, '..', 'sephora-fetch-queue')
    }

    async invoke() {
        this.initializeCrawlerSettings();
        this.setFetchConditions();
        await this.downloadFromS3();
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
            logger.error({ src: 'BrandListFetcher', event: 'fetchDisallowed', queueItem: queueItem })
        });

        this.crawler.on('fetchclienterror', (queueItem, error) => {
            logger.error({ src: 'BrandListFetcher', event: 'fetchclienterror', queueItem: queueItem, error: error });
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
                logger.info({ event: `sleeping for ${sleepDelay} seconds` })
                await sleep(sleepDelay);
                await this.addToCrawlerQueue(queueItem.url, true);
                continueCrawl();
            }
        })

        this.crawler.on('complete', () => {
            logger.info({ src: 'BrandListFetcher', event: 'complete' })
        })

        this.crawler.on('fetchtimeout', (queueItem, timeout) => {
            logger.error({ event: 'fetchtimeout', queueUrl: queueItem.url, timeout: timeout })
        })

        this.crawler.on('fetchstart', (q, e) => {
        })

        this.crawler.on('fetchclienterror', (queueItem, error) => {
            logger.error({ event: 'fetchclienterror', queueUrl: queueItem.url, error: error })
        })

        this.crawler.on('queueerror', (queueItem, error) => {
            logger.error({ event: 'queueerror', queueUrl: queueItem.url })
        })

        this.crawler.on('downloadconditionerror', (queueItem, error) => {
            logger.error({ event: 'downloadconditionerror', queueUrl: queueItem.url })
        })

        this.crawler.on('fetchdisallowed', (queueItem, error) => {
            logger.error({ event: 'fetchdisallowed', queueUrl: queueItem.url })
        })

        this.crawler.on('fetchheaders', (q, response) => {
        })

        this.crawler.on('queueadd', (queueItem, referrer) => {
            logger.debug({ event: 'queueItemAdded', queueUrl: queueItem.url, referrer: referrer });
        })

        this.crawler.on('queueduplicate', (queueItem) => {
            logger.error({ event: 'queueduplicate', queueUrl: queueItem.url });
        })

        this.crawler.on('queueerror', (error, queueItem) => {
            logger.error({ event: 'queueerror', queueUrl: queueItem.url, error: error });
        })

        this.crawler.on('fetchredirect', (queueItem, redirectedQueueItem, response) => {
            logger.error({ event: 'fetchredirect', queueUrl: queueItem.url, redirectedUrl: redirectedQueueItem.url });
        })

        this.crawler.on('fetch404', (queueItem, r) => {
            logger.error({ event: 'fetch404', queueUrl: queueItem.url });
        })

        this.crawler.on('fetchprevented', (queueItem, error) => {
            logger.debug({ event: 'fetchPrevented', queueItem: queueItem.url })
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
            logger.info({ event: 'addToCrawlerQueue', path: url.toString() });
        } else {
            throw new Error(`Could not add to queue URL ${url.path}`);
        }

        return;
    }

    async freezeQueue() {
        logger.info({ event: 'freezeQueue' });

        let continueCrawl = this.crawler.wait();

        // Re-queue in-progress items before freezing...
        this.crawler.queue.forEach(function (item) {
            if (item.fetched !== true) {
                item.status = "queued";
            }
        });

        fs.writeFileSync(this.queueFilePath, JSON.stringify(this.crawler.queue, null, 2));
    }

    async uploadToS3() {
        const filePath = this.queueFilePath;

        if (!fs.existsSync(filePath)) {
            logger.error({ src: 'BrandListFetcher', event: 'uploadToS3', message: 'File to upload does not exist.' })
            return;
        }

        const fileContentsBuffer = fs.readFileSync(filePath);       

        const uploadParams = {
            Bucket: process.env.S3_QUEUE_BUCKET_NAME,
            Key: 'sephora-fetch-queue',
            Body: fileContentsBuffer,
            ContentType: 'json'
        }

        try {
            const uploadStatus = await s3.putObject(uploadParams).promise()
            logger.info({ src: 'BrandListFetcher', event: 'uploadToS3', message: 'success' })
        } catch (e) {
            logger.error({ src: 'BrandListFetcher', event: 'uploadToS3', message: e.code, error: e })
            return;
        }
    }

    async downloadFromS3() {
        const filePath = this.queueFilePath;
        const getParams = {
            Bucket: process.env.S3_QUEUE_BUCKET_NAME,
            Key: 'sephora-fetch-queue'
        }

        try {
            const fileExists = await s3.headObject(getParams).promise();
            return (new Promise((resolve, reject) => {
                const localFileWriteStream = fs.createWriteStream(filePath);
                const s3ReadStream = s3.getObject(getParams).createReadStream();
                s3ReadStream.pipe(localFileWriteStream);
                
                localFileWriteStream.on('error', (error) => {
                    logger.error({ src: 'BrandListFetcher', event: 'downloadFromS3', code: error.message })    
                    reject(error);
                })

                localFileWriteStream.on('close', () => {
                    logger.info({ src: 'BrandListFetcher', event: 'downloadFromS3', message: 'success' })    
                    resolve(filePath);
                })

                s3ReadStream.on('error', (error) => {
                    logger.error({ src: 'BrandListFetcher', event: 'downloadFromS3', code: `S3ReadStreamError: ${error.message}`})    
                    reject(error);
                })

                logger.info({ src: 'BrandListFetcher', event: 'downloadFromS3', message: 'success' })
            }))
        } catch (e) {            
            logger.error({ src: 'BrandListFetcher', event: 'downloadFromS3', message: `${e.code}: file does not exist.`, error: e })
            return;
        }
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
