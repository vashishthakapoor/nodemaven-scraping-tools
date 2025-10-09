# UpCloud Deployment Checklist

## Pre-Deployment ✓

- [ ] UpCloud account created
- [ ] Ubuntu 22.04/24.04 server provisioned
- [ ] Server IP address noted
- [ ] SSH access confirmed
- [ ] Domain name ready (optional)

---

## Server Setup ✓

- [ ] System updated (`apt update && apt upgrade`)
- [ ] Node.js 20.x installed
- [ ] PM2 installed globally
- [ ] Nginx installed
- [ ] Git installed (optional)
- [ ] Firewall configured (UFW)

---

## Application Deployment ✓

- [ ] Project files uploaded to `/var/www/nodemaven-scrape-browser`
- [ ] `npm install` completed
- [ ] Playwright installed (`npx playwright install chromium`)
- [ ] Playwright dependencies installed (`npx playwright install-deps`)
- [ ] File permissions set correctly
- [ ] Environment variables configured (if any)

---

## PM2 Configuration ✓

- [ ] App started with PM2 (`pm2 start ecosystem.config.js`)
- [ ] PM2 configuration saved (`pm2 save`)
- [ ] PM2 startup script configured (`pm2 startup systemd`)
- [ ] App status verified (`pm2 status`)
- [ ] Logs checked (`pm2 logs`)

---

## Nginx Configuration ✓

- [ ] Nginx config file created (`/etc/nginx/sites-available/nodemaven-scraper`)
- [ ] Config contains correct server IP or domain
- [ ] Proxy settings configured for port 3000
- [ ] Timeouts set for long operations
- [ ] Symbolic link created to sites-enabled
- [ ] Nginx config tested (`nginx -t`)
- [ ] Nginx reloaded (`systemctl reload nginx`)

---

## Firewall & Security ✓

- [ ] UFW enabled
- [ ] SSH port allowed
- [ ] HTTP (80) allowed
- [ ] HTTPS (443) allowed
- [ ] UFW status verified

---

## Domain & SSL (Optional) ✓

- [ ] Domain A record points to server IP
- [ ] Domain propagation verified
- [ ] Nginx config updated with domain name
- [ ] Certbot installed
- [ ] SSL certificate obtained
- [ ] Auto-renewal configured

---

## Testing ✓

- [ ] App accessible via `http://localhost:3000` (on server)
- [ ] App accessible via server IP in browser
- [ ] All 3 tools working:
  - [ ] Website Scraper
  - [ ] Amazon Price Checker
  - [ ] Amazon Reviews Scraper
- [ ] Navigation menu working
- [ ] Mobile responsive working
- [ ] SSL working (if configured)

---

## Monitoring & Maintenance ✓

- [ ] PM2 monitoring enabled (`pm2 monit`)
- [ ] Log rotation configured
- [ ] Backup strategy planned
- [ ] Update procedure documented

---

## Commands Quick Reference

```bash
# Check everything is running
pm2 status
sudo systemctl status nginx
pm2 logs --lines 50

# Restart if needed
pm2 restart nodemaven-scraper
sudo systemctl restart nginx

# Update app
cd /var/www/nodemaven-scrape-browser
git pull  # if using git
npm install
pm2 restart nodemaven-scraper
```

---

## Troubleshooting Checklist

If something doesn't work:

- [ ] PM2 logs checked (`pm2 logs`)
- [ ] Nginx logs checked (`sudo tail -50 /var/log/nginx/error.log`)
- [ ] Port 3000 is not blocked
- [ ] Firewall allows HTTP/HTTPS
- [ ] Node app is running (`pm2 status`)
- [ ] Nginx is running (`systemctl status nginx`)
- [ ] File permissions are correct
- [ ] All dependencies installed

---

**Deployment Status:** ___ / ___ tasks completed

**Deployed On:** ________________

**Server IP:** ________________

**Domain:** ________________

**SSL:** ☐ Yes  ☐ No

**Notes:**
_________________________________________________
_________________________________________________
_________________________________________________
