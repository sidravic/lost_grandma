#!/bin/bash

cd $APP_DIR
echo 'Waiting for tor to start'
sleep 10
node ./workers/app.js