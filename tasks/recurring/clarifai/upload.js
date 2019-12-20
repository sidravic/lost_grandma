const upload = require('./../../../services/classification_services/clarifai_classification_services/task').upload;


upload().then((r) => {
    console.log(r);

}).catch((e) => {
    console.log(e)

})