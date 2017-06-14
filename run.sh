#!/bin/bash 

pm2 stop 0

sudo su - postgres -c "dropdb stats-db"

set -e

sudo su - postgres -c "createdb stats-db -O decred"
sequelize db:migrate
pm2 start package.json
pm2 logs 0