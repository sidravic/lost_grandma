const logger = require('./config/logger');
const BrandListFetcherService = require('./services/brand_list_fetcher');
logger.info({src: 'app', data: {message: 'Logger logging to logstash'}, event: ''});

let service = new BrandListFetcherService(process.env.BASE_CRAWL_URL);

const freezeCrawlerQueueAndExit = async () => {
    logger.info('term signal received');
    let freezeStatus = await service.freezeQueue();
    await service.uploadToS3();

    setTimeout(() => {
        logger.info({data: {message: 'Shutting down.'}, src: 'app.js', event: 'freezeCrawlerQueueAndExit'})
        process.exit(0)
    }, 3000)
}


process.on('SIGINT', freezeCrawlerQueueAndExit)
process.on('SIGTERM', freezeCrawlerQueueAndExit);
// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', freezeCrawlerQueueAndExit);
process.on('SIGUSR2', freezeCrawlerQueueAndExit);
service.invoke();

