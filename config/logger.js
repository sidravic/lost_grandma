const winston = require('winston');
const LogstashTransport = require('winston-logstash-transport').LogstashTransport;


const getTransports = () => {
    const transports = [
        new winston.transports.Console({
            format: winston.format.json(),
        }),
    ];

    if (process.env.NODE_ENV == 'development') {
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

process.on('uncaughtException', (err) => {
    logger.error({event: 'uncaughtException', message: err.message, stack: err.stack })
})

logger.info({status: 'Logger started111.'});
module.exports = logger;

