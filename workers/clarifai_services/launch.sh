#!/bin/bash

cd $APP_DIR
echo 'Waiting for tor to start'

sleep 10
echo 'Launching clarifai uploader service.'
/bin/bash -c "node ./workers/clarifai_services/app.js"