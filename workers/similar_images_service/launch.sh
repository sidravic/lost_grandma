#!/bin/bash

cd $APP_DIR
echo 'Waiting for tor to start'

sleep 10
echo 'Launching similar images service.'
/bin/bash -c "node ./app.js"