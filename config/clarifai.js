const Clarifai = require('clarifai');

const ClarifaiApp = new Clarifai.App({
    apiKey: process.env.CLARIFAI_API_KEY
})

module.exports = ClarifaiApp;