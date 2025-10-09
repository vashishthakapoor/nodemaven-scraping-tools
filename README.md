# Nodemaven Scraping Browser

A web scraper built with Node.js, Express, and Playwright that extracts metadata from websites.

## Features
- Extract page title, meta title, meta description
- Extract schema/JSON-LD data
- Extract favicon URLs
- Beautiful Tailwind CSS frontend

## Requirements
- Node.js 18+ or 20+
- npm or yarn

## Installation

```bash
# Install dependencies
npm install

# Start the server
npm start
```

The server will run on http://localhost:3000

## Deployment on Hostinger VPS

### Step 1: Connect to your VPS via SSH
```bash
ssh root@your-vps-ip
```

### Step 2: Install Node.js (if not installed)
```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 3: Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### Step 4: Clone or Upload Your Project
```bash
# Create directory
mkdir -p /var/www/nodemaven-scraper
cd /var/www/nodemaven-scraper

# Upload your files via SFTP or git clone
```

### Step 5: Install Dependencies
```bash
cd /var/www/nodemaven-scraper
npm install
```

### Step 6: Install Playwright Dependencies
```bash
# Install required system dependencies for Playwright
sudo npx playwright install-deps chromium
npx playwright install chromium
```

### Step 7: Start with PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Step 8: Configure Nginx (Reverse Proxy)
```bash
sudo nano /etc/nginx/sites-available/nodemaven-scraper
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/nodemaven-scraper /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 9: Configure Firewall
```bash
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### Step 10: Setup SSL (Optional but Recommended)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## PM2 Commands
```bash
# View logs
pm2 logs nodemaven-scraper

# Restart app
pm2 restart nodemaven-scraper

# Stop app
pm2 stop nodemaven-scraper

# View status
pm2 status
```

## Environment Variables
Create a `.env` file (optional):
```
PORT=3000
NODE_ENV=production
```

## License
ISC
