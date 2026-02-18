#!/bin/bash
# Remove set -e so we can continue even if apt complains about the kernel
# set -e 

echo "---- Updating Package List ----"
apt-get update

# install dependencies
echo "---- Installing Dependencies ----"
# -f fixes broken installs from previous failed run
apt-get install -f -y
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
# ufw enable

# create app directory
mkdir -p /var/www/crm-winston

echo "---- Setup Complete ----"
node -v
npm -v
nginx -v
