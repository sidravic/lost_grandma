const { buildModel } = require('./../../../services/classification_services/clarifai_classification_services/task')

buildModel().then((r) => {
    debugger;
    console.log(r);
}).catch((e) => {
    console.log('Error');
    console.log(e);
})