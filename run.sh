#!/bin/bash 

set -e

pm2 stop 0
sudo su - postgres -c "dropdb stats-db"
sudo su - postgres -c "createdb stats-db -O decred"
sequelize db:migrate
pm2 start package.json
pm2 logs 0