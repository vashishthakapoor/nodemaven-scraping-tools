#!/bin/bash

# Nodemaven Scraper - Quick Deployment Script for Ubuntu Server
# Run this script on your UpCloud Ubuntu server

set -e

echo "=========================================="
echo "Nodemaven Scraper Deployment Script"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

echo -e "${GREEN}Step 1: Updating system...${NC}"
apt update && apt upgrade -y

echo -e "${GREEN}Step 2: Installing Node.js 20.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

echo -e "${GREEN}Step 3: Installing PM2...${NC}"
npm install -g pm2

echo -e "${GREEN}Step 4: Installing Nginx...${NC}"
apt install nginx -y
systemctl start nginx
systemctl enable nginx

echo -e "${GREEN}Step 5: Configuring firewall...${NC}"
ufw allow OpenSSH
ufw allow 'Nginx Full'
echo "y" | ufw enable

echo -e "${GREEN}Step 6: Installing Git...${NC}"
apt install git -y

echo -e "${GREEN}Step 7: Creating application directory...${NC}"
mkdir -p /var/www/nodemaven-scrape-browser
cd /var/www/nodemaven-scrape-browser

echo ""
echo -e "${YELLOW}=========================================="
echo "Manual Steps Required:"
echo "==========================================${NC}"
echo ""
echo "1. Upload your application files to: /var/www/nodemaven-scrape-browser"
echo "   Using SCP: scp -r /path/to/local/project root@server-ip:/var/www/"
echo ""
echo "2. After uploading, run these commands:"
echo ""
echo "   cd /var/www/nodemaven-scrape-browser"
echo "   npm install"
echo "   npx playwright install chromium"
echo "   npx playwright install-deps chromium"
echo "   pm2 start ecosystem.config.js"
echo "   pm2 save"
echo "   pm2 startup systemd"
echo ""
echo "3. Configure Nginx:"
echo "   nano /etc/nginx/sites-available/nodemaven-scraper"
echo "   (Copy config from DEPLOYMENT.md)"
echo "   ln -s /etc/nginx/sites-available/nodemaven-scraper /etc/nginx/sites-enabled/"
echo "   nginx -t"
echo "   systemctl reload nginx"
echo ""
echo -e "${GREEN}Base setup complete!${NC}"
echo "Refer to DEPLOYMENT.md for detailed instructions."
