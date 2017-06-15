#!/bin/bash 

pm2 stop 0

set -e

pm2 start package.json
pm2 logs 0