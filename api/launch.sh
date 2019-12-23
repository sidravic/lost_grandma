#!/bin/bash

cd $APP_DIR
echo 'Waiting for tor to start'

sleep 10
echo 'Launching api service.'
/bin/bash -c "node ./api/app.js"