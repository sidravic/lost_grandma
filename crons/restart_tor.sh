#!/bin/bash


APP_DIR="/home/ubuntu/lost-grandma"

cd $APP_DIR

echo "Accessing vm1 environments..."
eval $(docker-machine env vm1)

docker service update crawler_tor --force >
