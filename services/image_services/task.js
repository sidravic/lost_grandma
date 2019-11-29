const Coordinator = require('./coordinator');


const main = async () => {
    const service = new Coordinator();
    await service.batch();
    return;
}

module.exports = main;
