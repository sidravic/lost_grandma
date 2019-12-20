const {predictImage} = require('./../../../services/classification_services/clarifai_classification_services/task')
const {PredictionService} = require('./../../../services/prediction_services/clarifai/coordinator');


const imageUrl = process.argv[2]

if (!imageUrl) {
    throw new Error('please use the format `node script_name.js <image_url>');
}

// predictImage(imageUrl).then((r) => {
//     console.log(r.outputs[0].data.concepts)
// })

const service = new PredictionService();
service.invoke(imageUrl).then((r) => {
    debugger;
    console.log(r);
})

// const {Product, Brand, Image} = require('./../../../models');
// const Sequelize = require('sequelize');
// const op = Sequelize.Op;
// productIds = ['fc3fe659-2984-4003-a63f-719352ac8a8d',
//     'e22446ff-f760-4b47-b3dd-dd01e41a4e8c',
//     'd5748d8b-eef7-4875-b556-f532e365ad0c',
//     '2871949a-f41b-43f6-b18f-863dcf57416d',
//     'cbe73ddb-ee64-4ef8-b11d-db2f72bd35b2',
//     '7268c067-13fa-4d14-8b65-eaef0c19d7c3',
//     '9c3a56d6-7749-49b9-bb1b-5ebedc3ce16d',
//     '9009b330-849c-47df-9fd6-e31be5aeb20a',
//     'bfa4f25e-7bc5-4534-b6bf-3cfe5802bb47',
//     '0111fbbb-2f18-4215-858e-99a188184500',
//     'a4621548-9a21-4530-89d8-3486e6663425',
//     '8890162d-d584-475d-9512-3ba96c42234f',
//     '86a29c30-337f-466c-a2f1-1ed87b945659',
//     '75fd69c8-b69c-42e3-9e4e-6c700f93043c',
//     '574ce057-9a09-4413-a93b-08de3634a32a',
//     '5d2af915-4d64-45bd-b7fa-ad03b54ea66c',
//     'f69d6765-69c5-41e4-8526-2b384764e324',
//     'c2376fd4-7425-4c1f-ab5b-6354104897bd',
//     '5a38fed6-86f1-408c-b89b-184cad12bf18',
//     '0f8f52d8-b78f-4904-b5e1-3e65136209b0']
//
// Product.findAll({
//     where: {
//         id: {[op.in]: productIds}
//     }, include: [{
//         model: Image,
//         required: true
//     }, {model: Brand, required: true}]
// }).then((r) => {
//     console.log(r)
// })

