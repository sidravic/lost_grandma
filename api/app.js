const express = require("express");
const bodyParser = require("body-parser");
const logger = require("./../config/logger");
const requestLogger = require("./middleware/request_logger");
const routes = require("./config/routes");
const app = express();
const port = process.env.PORT || 3001;
const hostname = process.env.HOSTNAME || "0.0.0.0";

app.use(bodyParser.json({type: "application/json"}));
app.use(requestLogger);
app.use(routes);

app.listen(port, hostname, () => {
    logger.info(`Server running on port ${hostname}:${port}`);
});
