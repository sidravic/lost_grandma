#!/bin/bash

cd $APP_DIR
echo 'Waiting for tor to start'

sleep 10
echo 'Launching image service.'
/bin/bash -c "node ./workers/images_services/app.js"