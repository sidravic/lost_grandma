#!/bin/bash

cd $APP_DIR
echo "Migrating database..."

npx sequelize db:migrate

status=$?
if [ $status -eq 0 ]; then        
        echo "Migration successful"
    else
        echo "Migration failed"
        sleep 10
        exit 1
fi

echo 'Waiting for tor to start'
sleep 10

/bin/bash -c "node app.js"