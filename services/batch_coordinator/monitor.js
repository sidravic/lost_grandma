const logger = require('./../../config/logger.js')
const util = require('util')
const sleep = util.promisify(setTimeout);
const checkBatchCompleted = require('./batch_complete_check').checkBatchCompleted;

const ImageServicesTask = require('./../image_services/task');
const SimilarImageServiceTask = require('./../similar_images_service/task');
const LabelDetectionTask = require('./../label_detection_services/tasks');
const ClassificationTask = require('./../classification_services/task');

const UploadToS3Queue = require('./../../workers/image_services/upload_to_s3_queue').UploadToS3Queue;
const SimilarImagesQueue = require('./../../workers/similar_images_service/similar_images_queue').SimilarImagesQueue;
const LabelDetectionQueue = require('./../../workers/label_detection_services/label_detection_queue').LabelDetectionQueue;
const ClassificationQueue = require('./../../workers/classification_services/classification_queue').ClassificationQueue;

const batchSequence = [{name: 'image_service', invoker: ImageServicesTask, queue: UploadToS3Queue},
    {name: 'similar_image_service', invoker: SimilarImageServiceTask, queue: SimilarImagesQueue},
    {name: 'label_detection_service', invoker: LabelDetectionTask, queue: LabelDetectionQueue},
    {name: 'classification_service', invoker: ClassificationTask, queue: ClassificationQueue}
];

const getNext = async (currentSequence) => {
    return currentSequence.shift();
}

const markCompleted = async (service, serviceName) => {
    return await service.activeBatch.markStepComplete(serviceName);
}

const completeBatch = async (service) => {
    if(service.currentSequence.length == 0){
        await service.activeBatch.complete();
    }
    return;
}

const invokeAndMarkComplete = async(invoker, service, serviceName) => {

    if (isToBeInvoked(service, serviceName)) {
        await invoker();
        await markCompleted(service, serviceName);
    }
    return;
}

const monitor = async (service, serviceName, invoker, queue) => {
    await invokeAndMarkComplete(invoker, service, `${serviceName}_invoked`)

    const currentQueue = queue;
    let batchCompleted = false;
    let pendingCount = 'unknown';

    while (!batchCompleted) {
        logger.info({
            src: 'batch_coordinator',
            event: 'monitoring',
            data: {queue: currentQueue.name, completed: batchCompleted, pendingCount: pendingCount}
        })

        await sleep(5000);
        [batchCompleted, pendingCount] = await checkBatchCompleted(currentQueue);

        if (batchCompleted) {
            await markCompleted(service, serviceName)
        }
    }

    logger.info({
        src: 'batch_coordinator',
        event: 'monitoring',
        data: {queue: currentQueue.name, completed: batchCompleted}
    })

    return;

}

const isToBeInvoked = (service, serviceName) => {
    return (!service.activeBatch[serviceName]);
}

const launchMonitor = async (service) => {
    let invoker;
    let queue;
    let serviceName;
    let nextItem = await getNext(service.currentSequence);

    try {
        invoker = nextItem.invoker;
        queue = nextItem.queue;
        serviceName = nextItem.name;

        while (queue) {

            await monitor(service, serviceName, invoker, queue);
            nextItem = await getNext(service.currentSequence);

            if (!nextItem) {
                await markCompleted(service, serviceName);
                await completeBatch(service)
                return;
            }
            invoker = nextItem.invoker;
            queue = nextItem.queue;
            serviceName = nextItem.name;
        }
    } catch (e) {
        console.log('Crapped out 1');
        console.log(e.message)
        console.log(e.stack);
        throw e;
    }
}

module.exports.BatchSequence = batchSequence;
module.exports.launchMonitor = launchMonitor;