# Deployment Guide for UpCloud Ubuntu Server

Complete guide to deploy Nodemaven Scraping Tools on UpCloud Ubuntu server.

## Prerequisites
- UpCloud Ubuntu 22.04 or 24.04 server
- Root or sudo access
- Domain name (optional but recommended)

---

## Step 1: Connect to Your UpCloud Server

```bash
ssh root@your-server-ip
```

---

## Step 2: Update System

```bash
sudo apt update && sudo apt upgrade -y
```

---

## Step 3: Install Node.js (v20.x)

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

---

## Step 4: Install PM2 (Process Manager)

```bash
sudo npm install -g pm2

# Verify installation
pm2 --version
```

---

## Step 5: Install Nginx (Web Server)

```bash
sudo apt install nginx -y

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

---

## Step 6: Configure Firewall

```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Check status
sudo ufw status
```

---

## Step 7: Upload Your Project

### Option A: Using Git (Recommended)

```bash
# Install Git if not installed
sudo apt install git -y

# Create directory
sudo mkdir -p /var/www
cd /var/www

# Clone your repository (if you have one)
sudo git clone https://github.com/vashishthakapoor/nodemaven-scraping-tools.git

# Or create directory manually
sudo mkdir nodemaven-scrape-browser
cd nodemaven-scrape-browser
```

### Option B: Using SCP/SFTP

From your local machine:
```bash
scp -r /Users/vashishtha/Downloads/Github/nodemaven-scrape-browser root@your-server-ip:/var/www/
```

---

## Step 8: Install Project Dependencies

```bash
cd /var/www/nodemaven-scrape-browser

# Install dependencies
npm install

# Install Playwright and browser dependencies
npx playwright install chromium
npx playwright install-deps chromium
```

---

## Step 9: Set Correct Permissions

```bash
sudo chown -R $USER:$USER /var/www/nodemaven-scrape-browser
sudo chmod -R 755 /var/www/nodemaven-scrape-browser
```

---

## Step 10: Configure Environment Variables (Optional)

```bash
nano /var/www/nodemaven-scrape-browser/.env
```

Add:
```env
NODE_ENV=production
PORT=3000
```

---

## Step 11: Start Application with PM2

```bash
cd /var/www/nodemaven-scrape-browser

# Start with PM2 using ecosystem config
pm2 start ecosystem.config.js

# Or start directly
pm2 start index.js --name "nodemaven-scraper"

# Save PM2 configuration
pm2 save

# Set PM2 to start on system boot
pm2 startup systemd
# Follow the command it outputs
```

---

## Step 12: Configure Nginx as Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/nodemaven-scraper
```

Add this configuration:

```nginx
server {
    listen 80;
    listen [::]:80;
    
    # Replace with your domain or server IP
    server_name your-domain.com www.your-domain.com;
    # Or use IP: server_name 123.456.789.0;

    # Logs
    access_log /var/log/nginx/nodemaven-access.log;
    error_log /var/log/nginx/nodemaven-error.log;

    # Reverse proxy to Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts for slow scraping operations
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        proxy_read_timeout 300;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Save and exit (Ctrl+X, Y, Enter)

---

## Step 13: Enable Nginx Configuration

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/nodemaven-scraper /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

---

## Step 14: Install SSL Certificate (Optional but Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Follow the prompts
# Certificate will auto-renew
```

---

## Step 15: Verify Deployment

```bash
# Check if app is running
pm2 status

# Check logs
pm2 logs nodemaven-scraper

# Check Nginx status
sudo systemctl status nginx

# Visit your site
curl http://your-server-ip
# Or in browser: http://your-domain.com
```

---

## Useful PM2 Commands

```bash
# View all processes
pm2 list

# View logs
pm2 logs nodemaven-scraper

# Restart app
pm2 restart nodemaven-scraper

# Stop app
pm2 stop nodemaven-scraper

# Delete from PM2
pm2 delete nodemaven-scraper

# Monitor resources
pm2 monit

# View detailed info
pm2 info nodemaven-scraper
```

---

## Useful Nginx Commands

```bash
# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Reload Nginx (graceful)
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx

# View error logs
sudo tail -f /var/log/nginx/nodemaven-error.log

# View access logs
sudo tail -f /var/log/nginx/nodemaven-access.log
```

---

## Updating Your Application

```bash
cd /var/www/nodemaven-scrape-browser

# If using Git
sudo git pull origin main

# Install new dependencies
npm install

# Restart with PM2
pm2 restart nodemaven-scraper
```

---

## Troubleshooting

### App won't start
```bash
# Check logs
pm2 logs nodemaven-scraper

# Check if port 3000 is already in use
sudo netstat -tulpn | grep 3000

# Kill process on port 3000 if needed
sudo kill -9 $(sudo lsof -t -i:3000)
```

### Nginx issues
```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -50 /var/log/nginx/nodemaven-error.log

# Restart Nginx
sudo systemctl restart nginx
```

### Playwright/Browser issues
```bash
# Reinstall browser dependencies
cd /var/www/nodemaven-scrape-browser
npx playwright install-deps chromium
npx playwright install chromium
```

### Permission issues
```bash
# Fix ownership
sudo chown -R $USER:$USER /var/www/nodemaven-scrape-browser

# Fix permissions
sudo chmod -R 755 /var/www/nodemaven-scrape-browser
```

---

## Security Recommendations

1. **Change default SSH port**
```bash
sudo nano /etc/ssh/sshd_config
# Change Port 22 to something else
sudo systemctl restart sshd
```

2. **Disable root login**
```bash
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart sshd
```

3. **Enable automatic security updates**
```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

4. **Setup Fail2Ban**
```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## Performance Optimization

### 1. Enable Nginx caching
```nginx
# Add to nginx config
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m;

# In location block:
proxy_cache my_cache;
proxy_cache_valid 200 1h;
```

### 2. Enable Gzip compression
```bash
sudo nano /etc/nginx/nginx.conf
```

Uncomment or add:
```nginx
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
```

---

## Monitoring

### Check server resources
```bash
# CPU and Memory
htop

# Install if not available
sudo apt install htop -y

# Disk usage
df -h

# Memory usage
free -h
```

### Monitor PM2
```bash
pm2 monit
```

---

## Domain Configuration

If you're using a domain name:

1. **Update DNS Records** (at your domain registrar):
   - Add A record: `@` pointing to your server IP
   - Add A record: `www` pointing to your server IP

2. **Wait for DNS propagation** (can take up to 24 hours)

3. **Update Nginx config** with your domain name

4. **Get SSL certificate** using Certbot (Step 14)

---

## Your Application Will Be Accessible At:

- **With Domain:** https://your-domain.com
- **With IP:** http://your-server-ip
- **Local (on server):** http://localhost:3000

---

## Support

If you encounter issues:
1. Check PM2 logs: `pm2 logs`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/nodemaven-error.log`
3. Check application is running: `pm2 status`
4. Test Nginx config: `sudo nginx -t`

---

**Deployment Complete! 🚀**

Your Nodemaven Scraping Tools are now live and accessible!
