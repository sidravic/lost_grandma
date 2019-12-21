const logger = require('./../../config/logger');
const BaseController = require('./../controllers/v1/base_controller');

const notFound = (req, res, next) => {

    const error = new Error('Not Found');
    error.status = 404;
    next(error);
}

const errorResponder = (error, req, res, next) => {
    let response;
    if (!error.status) { error.status = 500; }

    if(error.status == 404) {
        response = BaseController.notFound([error.message])
    } else {
        logger.error({
            src: 'middleware/error_handler',
            event: 'errorResponder',
            data: {},
            error: {message: error.message, stack: error.stack}
        });
        response = BaseController.internalError([error.message])
    }
    res.status(error.status);
    return res.json(response);
}

module.exports.notFound = notFound;
module.exports.errorResponder = errorResponder;