#!/bin/bash

cd $APP_DIR
echo 'Waiting for tor to start'

sleep 10
echo 'Launching clarifai uploader service.'
/bin/bash -c "node ./workers/clarfai_services/app.js"