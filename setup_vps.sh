#!/bin/bash
set -e

# update system
echo "---- Updating System ----"
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y

# install dependencies
echo "---- Installing Dependencies ----"
apt-get install -y curl git build-essential nginx certbot python3-certbot-nginx

# install nodejs 18
echo "---- Installing Node.js 18 ----"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# install pm2
echo "---- Installing PM2 ----"
npm install -g pm2

# configure firewall
echo "---- Configuring Firewall ----"
ufw allow OpenSSH
ufw allow 'Nginx Full'
# ufw enable # consistently prompting, maybe skip for now or use --force if needed, but risky

# create app directory
mkdir -p /var/www/crm-winston

echo "---- Setup Complete ----"
node -v
npm -v
nginx -v
