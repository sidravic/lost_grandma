const Coordinator = require('./coordinator');

new Coordinator().batch().then((r) => {
    console.log('Done adding tasks');
    console.log(r);
    process.exit(0);
}).catch((e) => {
    console.log(e.message);
    console.log(e.stack);
    console.log('Crapped out middway!');
    process.exit(1)
});