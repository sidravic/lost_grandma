const enqueueImagesForUpload = require('./../../services/classification_services/task');

enqueueImagesForUpload().then((r) => {
    console.log(r)
    process.exit(0);
})