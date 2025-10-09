# Quick Start - Deploy to UpCloud Ubuntu Server

## 🚀 Fast Deployment (5 Minutes)

### Step 1: Prepare Your UpCloud Server
1. Create Ubuntu 22.04/24.04 server on UpCloud
2. Note your server IP address
3. SSH into your server:
   ```bash
   ssh root@YOUR_SERVER_IP
   ```

### Step 2: Run Auto-Setup Script
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx git
sudo npm install -g pm2
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && echo "y" | sudo ufw enable
```

### Step 3: Upload Your Project
**From your local machine:**
```bash
cd /Users/vashishtha/Downloads/Github/nodemaven-scrape-browser
rsync -avz --exclude 'node_modules' . root@YOUR_SERVER_IP:/var/www/nodemaven-scrape-browser/
```

**Or using SCP:**
```bash
scp -r /Users/vashishtha/Downloads/Github/nodemaven-scrape-browser root@YOUR_SERVER_IP:/var/www/
```

### Step 4: Install Dependencies (On Server)
```bash
cd /var/www/nodemaven-scrape-browser
npm install
npx playwright install chromium
npx playwright install-deps chromium
```

### Step 5: Start with PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd
# Run the command it outputs
```

### Step 6: Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/nodemaven-scraper
```

**Paste this config:**
```nginx
server {
    listen 80;
    server_name YOUR_SERVER_IP;  # Replace with your IP or domain

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        proxy_read_timeout 300;
    }
}
```

Save (Ctrl+X, Y, Enter)

### Step 7: Enable & Restart Nginx
```bash
sudo ln -s /etc/nginx/sites-available/nodemaven-scraper /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 8: Done! 🎉
Visit: `http://YOUR_SERVER_IP`

---

## 📋 Quick Commands Reference

### Check Status
```bash
pm2 status
pm2 logs
sudo systemctl status nginx
```

### Restart Services
```bash
pm2 restart nodemaven-scraper
sudo systemctl restart nginx
```

### View Logs
```bash
pm2 logs nodemaven-scraper
sudo tail -f /var/log/nginx/error.log
```

### Update Application
```bash
cd /var/www/nodemaven-scrape-browser
git pull  # if using git
npm install
pm2 restart nodemaven-scraper
```

---

## 🔒 Add SSL (Optional - For Domain)

If you have a domain pointed to your server:

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Done! Now accessible at: `https://yourdomain.com`

---

## 🆘 Troubleshooting

**App not starting?**
```bash
pm2 logs nodemaven-scraper
```

**Can't access website?**
```bash
sudo ufw status
sudo systemctl status nginx
curl http://localhost:3000
```

**Nginx errors?**
```bash
sudo nginx -t
sudo tail -50 /var/log/nginx/error.log
```

---

For detailed guide, see **DEPLOYMENT.md**
