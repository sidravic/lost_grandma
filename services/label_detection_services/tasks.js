const Coordinator = require('./coordinator');

const main = async () => {
    const coordinator = new Coordinator()
    await coordinator.batch();
    return
}

module.exports = main;
