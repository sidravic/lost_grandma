const winston = require('winston');
const logstashTransport = require('winston-logstash-transport').LogstashTransport;


const getTransports = () => {
    const transports = [
        new winston.transports.Console({
            format: winston.format.json(),
        }),
    ];

    if (process.env.NODE_ENV != 'development') {
        let logstashTransport = new logstashTransport({
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
            winston.format.logstash(),
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


logger.info({status: 'Logger started111.'});
module.exports = logger;

