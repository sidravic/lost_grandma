#!/bin/bash

cd $APP_DIR
echo 'Waiting for tor to start'

sleep 10
echo 'Launching classification service.'

/bin/bash -c "node ./workers/classification_services/app.js"