const {ClassificationBatch} = require('./../../models');
const {BaseService, BaseServiceResponse} = require('./../base_service');
const {BatchSequence, launchMonitor} = require('./monitor');
const {any} = require('./../../services/utils');

const createAndActivateBatch = async () => {

    const batch = await ClassificationBatch.create();
    await batch.activate();
    return batch;
}

const fetchBatch = async (service) => {
    let batch;
    try {
        batch = await ClassificationBatch.findLatestActiveBatch()

        if (!batch) {
            batch = await createAndActivateBatch();
        }
        service.activeBatch = batch;
    } catch (e) {
        service.addErrors([e.message])
        service.errorCode = 'error_batch_fetch';
    }

    return;
}

const fetchBatchSequence = async (service) => {
    if (service.anyErrors()) {
        return;
    }

    const defaultSequence = BatchSequence;
    service.currentSequence = defaultSequence;
    let activeBatch = service.activeBatch;

    if (activeBatch.classification_service) {
        service.currentSequence = [];
        return;
    }

    if (activeBatch.label_detection_service) {
        service.currentSequence = defaultSequence.splice(-1);
        return;
    }

    if (activeBatch.similar_image_service) {
        service.currentSequence = defaultSequence.splice(-2);
        return;
    }

    if (activeBatch.image_service) {
        service.currentSequence = defaultSequence.splice(-3);
        return;
    }

    return;
}

const closeBatch = async (service) => {

    if (service.anyErrors()) {
        return;
    }

    if (!any(service.currentSequence)) {
        try {
            await service.activeBatch.complete();
        }catch(e) {
            service.addErrors([e.message]);
            service.errorCode = 'error_completing_batch';
        }
    }
    return;
}

const monitor = async (service) => {
    try {
        await launchMonitor(service);
    }catch(e) {
        service.addErrors([e.message]);
        service.errorCode = 'error_in_monitor'
    }
    return;
}


class Coordinator extends BaseService {
    constructor() {
        super();
        this.currentSequence = [];
        this.activeBatch = null;
    }

    async invoke() {
        await fetchBatch(this);
        await fetchBatchSequence(this);
        await closeBatch(this);
        await monitor(this);
        return this;
    }
}


let c = new Coordinator()
c.invoke().then((r) => {
    console.log(r);
}).catch((e) => {
    console.log(e);
})