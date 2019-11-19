#!/bin/bash

cd $APP_DIR
echo 'Waiting for tor to start'

sleep 10

/bin/bash -c "node ./workers/image_services/app.js"