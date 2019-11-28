const checkBatchCompleted = async (queue) => {
    const jobCounts = await queue.getJobCounts();
    const pendingJobsCount = jobCounts.waiting + jobCounts.active + jobCounts.delayed;

    return (new Promise((resolve, reject) => {

        const isCompleted = (pendingJobsCount == 0);
        resolve([isCompleted, pendingJobsCount])
    }))
}

const ifCompleteTriggerNext = async (queue, next) => {
    const [isCompleted, pendingJobsCount] = await checkBatchCompleted(queue)
    if (isCompleted) {
        logger.info({ src: 'batch_completion_check', data: {status: 'completed', queue: queue.name}})
        await next();
    }

    return;
}

module.exports.checkBatchCompleted = checkBatchCompleted;
module.exports.ifCompleteTriggerNext = ifCompleteTriggerNext;
