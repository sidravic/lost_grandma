const {findLastClassified, trainProjectAndPublish} = require('./../../services/classification_services/azure_classifier_training');

findLastClassified().then((project) => {
    trainProjectAndPublish(project).then((response) => {
        console.log(response)
    })
})