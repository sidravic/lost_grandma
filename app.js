const logger = require('./config/logger');
const BrandListFetcherService = require('./services/brand_list_fetcher');
logger.info('Logger logging to logstash')

let service = new BrandListFetcherService(process.env.BASE_CRAWL_URL);

const freezeCrawlerQueueAndExit = async () => {
    console.log('signal received');
    let freezeStatus = await service.freezeQueue();

    setTimeout(() => {
        logger.info('Shutting down.')
        process.exit(0)
    }, 3000)
}


process.on('SIGINT', freezeCrawlerQueueAndExit)
process.on('SIGTERM', freezeCrawlerQueueAndExit);
// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1',freezeCrawlerQueueAndExit);
process.on('SIGUSR2', freezeCrawlerQueueAndExit);
service.invoke();

