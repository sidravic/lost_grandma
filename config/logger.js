const winston = require('winston');
const LogstashTransport = require('winston-logstash-transport').LogstashTransport;
const expressWinston = require('express-winston');

const getTransports = () => {
    const transports = [
        new winston.transports.Console({
            format: winston.format.json(),
        }),
    ];

    if (process.env.NODE_ENV == 'staging' || process.env.NODE_ENV == 'development') {
        let logstashTransport = new LogstashTransport({
            host: process.env.LOGSTASH_HOST,
            port: process.env.LOGSTASH_UDP_PORT
        })
        transports.push(logstashTransport);
    }

    return transports
}

const getFormats = () => {

    let formats = null;
    if (process.env.NODE_ENV == 'development') {
        formats = winston.format.combine(
            winston.format.json(),
            winston.format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            })
        )
    } else {
        formats = winston.format.combine(
            winston.format.json(),
            winston.format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            })
        )
    }

    return formats;
}

const logger = winston.createLogger({
    level: 'info',
    defaultMeta: {service: 'sephora-crawler'},
    format: getFormats(),
    transports: getTransports()
});

const apiRequestLogger = expressWinston.logger({
    level: 'info',
    defaultMeta: {service: 'api'},
    msg: 'HTTP {{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms {{req.url}}"',
    format: getFormats(),
    colorize: true,
    transports: getTransports(),

});

logger.apiRequestLogger = apiRequestLogger;


if (process.env.NODE_ENV != 'test') {
    process.on('uncaughtException', (err) => {
        logger.error("-----------------------------------------------------------------------------")
        logger.error({event: 'uncaughtException', error: {message: err.message, stack: err.stack}})
        logger.error("-----------------------------------------------------------------------------")
        process.exit(1);
    })
}


logger.info({event: 'LoggerStarted.'});
module.exports = logger;

