#!/bin/bash

cd $APP_DIR
echo 'Waiting for tor to start'

sleep 10
echo 'Launching batch coordinator service.'
/bin/bash -c "node ./services/batch_coordinator/app.js"