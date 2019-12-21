const express = require("express");
const bodyParser = require("body-parser");
const logger = require("./../config/logger");
const requestLogger = require("./middleware/request_logger");
const {notFound, errorResponder} = require('./middleware/error_handler');
const routes = require("./config/routes");
const app = express();
const port = process.env.PORT || 3001;
const hostname = process.env.HOSTNAME || "0.0.0.0";

app.use(bodyParser.json({type: "application/json"}));

app.use(logger.apiRequestLogger);
app.use(routes);

app.use(notFound);
app.use(errorResponder);


app.listen(port, hostname, () => {
    logger.info(`Server running on port ${hostname}:${port}`);
});
