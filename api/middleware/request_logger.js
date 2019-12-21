const logger = require('./../../config/logger');

const requestLogger = (req, res, next) => {
    logger.info({
        method: req.method,
        path: req.path,
        params: req.params,
        query: req.query,
        request_ip: req.ips,
        body: req.body,
        response: res.body,
        status: res.status
    })
    next();
}

module.exports = requestLogger