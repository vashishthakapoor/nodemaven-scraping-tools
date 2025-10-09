# UpCloud Ubuntu Server Deployment Summary

## What You Need:

### 1. **UpCloud Server Requirements**
- Ubuntu 22.04 or 24.04 LTS
- Minimum 2GB RAM (recommended 4GB)
- 2 vCPU cores
- 40GB storage
- Root or sudo access

### 2. **Software to Install on Server**
- Node.js 20.x
- PM2 (Process Manager)
- Nginx (Web Server)
- Playwright & Chromium
- Git (optional)

### 3. **What Gets Deployed**
- Your Node.js/Express application
- All 3 tools (Website Scraper, Price Checker, Reviews Scraper)
- Frontend (HTML/CSS/JS)
- Backend API endpoints

---

## Deployment Files Created:

1. **DEPLOYMENT.md** - Complete step-by-step guide (15 steps)
2. **QUICKSTART.md** - Fast 5-minute deployment guide
3. **deploy.sh** - Automated setup script
4. **ecosystem.config.js** - PM2 configuration (already exists)

---

## Deployment Methods:

### Option A: Manual (Recommended for first time)
Follow **DEPLOYMENT.md** - Takes 20-30 minutes
- Most control
- Learn the process
- Best for troubleshooting

### Option B: Quick Deploy
Follow **QUICKSTART.md** - Takes 5-10 minutes
- Fastest method
- Good for experienced users
- Assumes familiarity with servers

### Option C: Automated Script
Run **deploy.sh** on server
- Automates system setup
- Still requires manual file upload
- Good for repeated deployments

---

## Key Points:

### ✅ What Works Out of the Box:
- All 3 scraping tools
- Navigation between pages
- Mobile responsive design
- Nodemaven browser integration

### ⚙️ What You Need to Configure:
- Server IP or domain name in Nginx config
- Firewall rules
- SSL certificate (if using domain)
- PM2 startup on boot

### 🔒 Security Included:
- Nginx reverse proxy
- Firewall (UFW)
- SSL ready (with Certbot)
- Process isolation with PM2

---

## Post-Deployment:

### Your app will be accessible at:
- **With IP:** `http://YOUR_SERVER_IP`
- **With Domain:** `http://yourdomain.com`
- **With SSL:** `https://yourdomain.com`

### Management Commands:
```bash
pm2 status              # Check app status
pm2 logs                # View logs
pm2 restart all         # Restart app
sudo systemctl status nginx  # Check Nginx
```

---

## Cost Estimate (UpCloud):

- **Small Server:** ~$10-15/month (2GB RAM, 1 vCPU)
- **Medium Server:** ~$20-30/month (4GB RAM, 2 vCPU) ⭐ Recommended
- **Domain:** $10-15/year (optional)
- **SSL:** Free with Let's Encrypt

---

## Next Steps:

1. **Create UpCloud server** (Ubuntu 22.04/24.04)
2. **Choose deployment method** (see above)
3. **Follow guide** (DEPLOYMENT.md or QUICKSTART.md)
4. **Test your deployment**
5. **Add domain + SSL** (optional)

---

## Support Resources:

- **DEPLOYMENT.md** - Full detailed guide
- **QUICKSTART.md** - Fast deployment
- **Troubleshooting section** in both guides
- **PM2 docs:** https://pm2.keymetrics.io/
- **Nginx docs:** https://nginx.org/en/docs/

---

## Important Notes:

⚠️ **Playwright/Chromium**
- Requires extra system dependencies
- `npx playwright install-deps chromium` installs them
- Takes ~500MB disk space

⚠️ **Nodemaven Connection**
- Uses your existing Nodemaven credentials
- Hardcoded in index.js
- Works from any server location

⚠️ **Memory Usage**
- Each scraping operation uses ~200-400MB
- PM2 set to restart at 1GB
- Monitor with `pm2 monit`

---

**Ready to deploy?** Start with **QUICKSTART.md** for fast setup or **DEPLOYMENT.md** for detailed guide! 🚀
