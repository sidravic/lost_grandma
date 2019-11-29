#!/bin/bash

cd $APP_DIR
echo 'Waiting for tor to start'

sleep 1
pwd
echo 'Launching similar images service.'
/bin/bash -c "node ./workers/similar_images_service/app.js"