# Altcoin Dashboard

### Requirements
- Node.js >= 4.2.6
- Postgresql >= 9.3.10
- (optional) Nginx for production env (static files delivery)

### Installation and configuration
Clone this repository:

```
git clone https://github.com/jholdstock/decred-dashboard.git
```

Install all dependencies:

```
npm install
```

Rename file 'config/config.json.sample' to 'config/config.json' and fill it with your correct Postgres database credentials.

Now you need Sequelize-CLI and PM2 installed globally:

```
sudo npm install -g pm2
sudo npm install -g sequelize-cli
```

Migrate database (if you will not specify NODE_ENV, sequelize will use configs for "development"):

```
NODE_ENV=production sequelize db:migrate
```

Well, now you can run application with PM2:
```
pm2 start package.json
```
If everything ok, cronjobs will start all parsers in the next 1-5 minutes, which will fill your database with real data. If you don't see still anything interesting on localhost:8080, you can track application logs with "pm2 logs 0" command.


Preparing ubuntu to run alt-stats
```
sudo apt-get update

# project
sudo apt-get install -y git
cd /var/www
git clone https://github.com/jholdstock/decred-dashboard.git
cd decred-dashboard

#node
sudo apt-get install -y nodejs npm
ln -s -f /usr/bin/nodejs /usr/bin/node
npm install
sudo npm install -g pm2 sequelize-cli

#postgres
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt/ `lsb_release -cs`-pgdg main" >> /etc/apt/sources.list.d/pgdg.list'
wget -q https://www.postgresql.org/media/keys/ACCC4CF8.asc -O - | sudo apt-key add -
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib
sudo su - postgres
	createuser --pwprompt alt-stats
	createdb -O alt-stats stats-db

#config
cp config/config.json.sample config/config.json
vi config/config.json

#build db
sequelize db:migrate

#nginx (production only)
sudo apt-get install -y nginx

#firewall (production only)
sudo apt-get install -y ufw
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

#startup (production only)
pm2 startup ubuntu
```
