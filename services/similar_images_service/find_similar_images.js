const ImageSearchAPIClient =  require('azure-cognitiveservices-imagesearch');
const CognitiveServicesCredentials = require('ms-rest-azure').CognitiveServicesCredentials;
const similarImagesApiKey = process.env.AZURE_SIMILAR_IMAGES_API_KEY;
const credentials = new CognitiveServicesCredentials(similarImagesApiKey);
const similarImagesApiEndpoint = process.env.AZURE_SIMILIAR_IMAGES_API_ENDPOINT;
const imageSearchApiClient = new ImageSearchAPIClient(credentials);
const url = require('url')

const findSimilarImages = async (searchTerm) => {
    const searchOptions = {
        market: 'en-US',
        safeSearch: 'Strict',
        count: 20
    }
    return await imageSearchApiClient.imagesOperations.search(searchTerm, searchOptions)
}

const findSimilarImagesByFormat = async (searchTerm, encodingFormat=['jpeg', 'png']) => {
    const similarImagesResponse = await findSimilarImages(searchTerm)
    const similarImages = similarImagesResponse.value;

    const validSimilarImages = similarImages.filter((image) => {
        const isJpegorPng = encodingFormat.includes(image.encodingFormat);
        const parsedUrl = url.parse(image.contentUrl)
        const isHttps = (parsedUrl.protocol == 'https:')
        return (isJpegorPng && isHttps);
    })

    return validSimilarImages;
}

module.exports.findSimilarImages = findSimilarImages;
module.exports.findSimilarImagesByFormat = findSimilarImagesByFormat;