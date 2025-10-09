#!/bin/bash
# Fix server git state - Run this on your server

cd /var/www/nodemaven-scraping-tools

# Option 1: Discard all local changes (RECOMMENDED if you don't need them)
echo "Discarding local changes..."
git reset --hard HEAD
git clean -fd

# Pull latest code
git pull origin main

# Restart application
pm2 restart nodemaven-scraper

echo "Server git state fixed and application restarted!"
