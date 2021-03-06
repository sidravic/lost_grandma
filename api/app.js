const express = require("express");
const bodyParser = require("body-parser");
const logger = require("./../config/logger");
const path = require('path')
const requestLogger = require("./middleware/request_logger");
const {notFound, errorResponder} = require('./middleware/error_handler');
const routes = require("./config/routes");
const app = express();
const port = process.env.API_PORT || 3001;
const hostname = "0.0.0.0";

app.use(express.static('api/public'));
app.use(bodyParser.json({type: "application/json"}));
app.use(logger.apiRequestLogger);


app.use(routes);
app.use(notFound);
app.use(errorResponder);

app.set('views', __dirname + '/views')
app.set('view engine', 'ejs');
app.engine('ejs', require('ejs').renderFile);



app.listen(port, hostname, () => {
    logger.info(`Server running on port ${hostname}:${port}`);
});
