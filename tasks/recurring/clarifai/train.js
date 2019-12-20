const { trainModelVersion } = require('./../../../services/classification_services/clarifai_classification_services/task')

trainModelVersion().then((r) => {
    debugger;

}).catch((e) => {
    console.log(e)

})