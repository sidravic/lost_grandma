#!/bin/bash

APP_DIR="/home/ubuntu/lost-grandma"

cd $APP_DIR

echo "Accessing vm1 environments..."
eval $(docker-machine env vm1)

for NODE in vm1 vm2 vm3 vm4 vm5 vm6
do
  echo "Pruning ${NODE}..."
  docker-machine ssh $NODE "docker system prune"
done
