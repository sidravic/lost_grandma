const apiVersion= 1.0;

const { successResponse, failureResponse, badRequest, unauthorized, notFound } = require('./base_controller')

module.exports.Index = (req, res) => {
    let payload = {hello: 'world', timestamp: new Date(), version: apiVersion};
    let responseObject = successResponse(payload);
    return res.status(200).json(responseObject);
}