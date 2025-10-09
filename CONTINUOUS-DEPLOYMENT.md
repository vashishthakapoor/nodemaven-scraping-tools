# Continuous Deployment Setup

Complete guide to set up automatic deployment from GitHub to your UpCloud server.

---

## 🚀 How It Works

When you push code to the `main` branch on GitHub:
1. GitHub Actions workflow triggers automatically
2. Connects to your server via SSH
3. Pulls latest code
4. Installs dependencies
5. Restarts the application with PM2
6. Verifies deployment success

---

## 📋 Prerequisites

- ✅ Application already deployed on UpCloud server
- ✅ GitHub repository created
- ✅ Git installed on server
- ✅ PM2 running the application
- ✅ SSH access to server

---

## Step 1: Set Up Git on Server

SSH into your server and set up the repository:

```bash
ssh root@YOUR_SERVER_IP

cd /var/www/nodemaven-scrape-browser

# Initialize git (if not already)
git init

# Add remote
git remote add origin https://github.com/vashishthakapoor/nodemaven-scraping-tools.git

# Pull initial code
git pull origin main

# Set up git to remember credentials (if using HTTPS)
git config --global credential.helper store
```

---

## Step 2: Generate SSH Key for GitHub Actions

On your **local machine**, generate a dedicated SSH key for deployment:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy_key
```

This creates two files:
- `~/.ssh/github_deploy_key` (private key) - for GitHub
- `~/.ssh/github_deploy_key.pub` (public key) - for server

---

## Step 3: Add Public Key to Server

Copy the public key to your server:

```bash
# Copy public key content
cat ~/.ssh/github_deploy_key.pub

# SSH to your server
ssh root@YOUR_SERVER_IP

# Add to authorized keys
mkdir -p ~/.ssh
echo "YOUR_PUBLIC_KEY_CONTENT" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

**Or use ssh-copy-id:**
```bash
ssh-copy-id -i ~/.ssh/github_deploy_key.pub root@YOUR_SERVER_IP
```

Test the connection:
```bash
ssh -i ~/.ssh/github_deploy_key root@YOUR_SERVER_IP
```

---

## Step 4: Add Secrets to GitHub Repository

Go to your GitHub repository:
1. Click **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**

Add these secrets:

### Secret 1: `SERVER_HOST`
- **Name:** `SERVER_HOST`
- **Value:** Your server IP address (e.g., `123.456.789.0`)

### Secret 2: `SERVER_USERNAME`
- **Name:** `SERVER_USERNAME`
- **Value:** `root` (or your SSH username)

### Secret 3: `SSH_PRIVATE_KEY`
- **Name:** `SSH_PRIVATE_KEY`
- **Value:** Content of your private key

Get private key content:
```bash
cat ~/.ssh/github_deploy_key
```

Copy **everything** including:
```
-----BEGIN OPENSSH PRIVATE KEY-----
...all the key content...
-----END OPENSSH PRIVATE KEY-----
```

### Secret 4 (Optional): `SSH_PORT`
- **Name:** `SSH_PORT`
- **Value:** `22` (or your custom SSH port)

---

## Step 5: GitHub Actions Workflow

The workflow file is already created at `.github/workflows/deploy.yml`

It will automatically:
- ✅ Trigger on push to `main` branch
- ✅ Connect to your server via SSH
- ✅ Pull latest code
- ✅ Install dependencies
- ✅ Restart PM2 application
- ✅ Verify deployment

---

## Step 6: Test Continuous Deployment

Make a small change and push:

```bash
# Make a small change (e.g., update README)
echo "# Test CD" >> README.md

# Commit and push
git add .
git commit -m "Test continuous deployment"
git push origin main
```

**Watch the deployment:**
1. Go to your GitHub repository
2. Click **Actions** tab
3. See the workflow running
4. Click on the workflow run to see logs

---

## 🔍 Monitoring Deployments

### View GitHub Actions Logs
- Go to **Actions** tab in GitHub
- Click on latest workflow run
- Expand steps to see detailed logs

### Check Server Status
```bash
ssh root@YOUR_SERVER_IP

# Check PM2 status
pm2 status

# View application logs
pm2 logs nodemaven-scraper --lines 50

# Check if latest code is deployed
cd /var/www/nodemaven-scrape-browser
git log -1
```

---

## 🎯 Workflow Triggers

The deployment runs automatically when:
- ✅ Code is pushed to `main` branch
- ✅ Pull request is merged to `main`
- ✅ Manual trigger from Actions tab

### Manual Deployment
Go to **Actions** → **Deploy to UpCloud Server** → **Run workflow**

---

## 🛠️ Customizing Deployment

Edit `.github/workflows/deploy.yml` to customize:

### Add Build Step
```yaml
- name: Build application
  uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets.SERVER_HOST }}
    username: ${{ secrets.SERVER_USERNAME }}
    key: ${{ secrets.SSH_PRIVATE_KEY }}
    script: |
      cd /var/www/nodemaven-scrape-browser
      npm run build
```

### Add Tests Before Deploy
```yaml
- name: Run tests
  uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets.SERVER_HOST }}
    username: ${{ secrets.SERVER_USERNAME }}
    key: ${{ secrets.SSH_PRIVATE_KEY }}
    script: |
      cd /var/www/nodemaven-scrape-browser
      npm test
```

### Deploy to Multiple Servers
```yaml
deploy:
  strategy:
    matrix:
      server: [production, staging]
  steps:
    - name: Deploy to ${{ matrix.server }}
      # ... deployment steps
```

---

## 🔒 Security Best Practices

1. **Use Dedicated SSH Key**
   - ✅ Don't use your personal SSH key
   - ✅ Create a separate key for CI/CD
   - ✅ Limit permissions on server

2. **Restrict SSH Key**
   On server, edit `/root/.ssh/authorized_keys`:
   ```bash
   # Add restrictions before the key
   command="cd /var/www/nodemaven-scrape-browser && git pull && npm install && pm2 restart nodemaven-scraper",no-port-forwarding,no-X11-forwarding,no-agent-forwarding ssh-ed25519 AAAA...
   ```

3. **Use Deploy User**
   Instead of root, create a dedicated deploy user:
   ```bash
   sudo adduser deploy
   sudo usermod -aG www-data deploy
   # Give deploy user access to project directory
   ```

4. **Environment Variables**
   Store sensitive data in GitHub Secrets, not in code

---

## 🆘 Troubleshooting

### Deployment Fails with "Permission Denied"
- Check SSH key is correct
- Verify public key is in `~/.ssh/authorized_keys` on server
- Check file permissions: `chmod 600 ~/.ssh/authorized_keys`

### "Repository not found" on Server
```bash
# SSH to server
cd /var/www/nodemaven-scrape-browser

# Check remote URL
git remote -v

# Fix if needed
git remote set-url origin https://github.com/vashishthakapoor/nodemaven-scraping-tools.git
```

### PM2 Restart Fails
```bash
# SSH to server
pm2 list

# Check if app exists
pm2 describe nodemaven-scraper

# Restart manually
pm2 restart nodemaven-scraper

# View logs
pm2 logs nodemaven-scraper
```

### Git Pull Fails (Merge Conflicts)
```bash
# SSH to server
cd /var/www/nodemaven-scrape-browser

# Reset to latest remote
git fetch origin main
git reset --hard origin/main
```

### Dependencies Not Installing
```bash
# SSH to server
cd /var/www/nodemaven-scrape-browser

# Clear cache and reinstall
rm -rf node_modules
npm cache clean --force
npm install
```

---

## 📊 Deployment Status Badge

Add this to your README.md:

```markdown
![Deploy Status](https://github.com/vashishthakapoor/nodemaven-scraping-tools/actions/workflows/deploy.yml/badge.svg)
```

Result: ![Deploy Status](https://github.com/vashishthakapoor/nodemaven-scraping-tools/actions/workflows/deploy.yml/badge.svg)

---

## 🔄 Rollback Procedure

If deployment breaks something:

```bash
# SSH to server
ssh root@YOUR_SERVER_IP

cd /var/www/nodemaven-scrape-browser

# View recent commits
git log --oneline -10

# Rollback to previous commit
git reset --hard COMMIT_HASH

# Reinstall dependencies
npm install

# Restart application
pm2 restart nodemaven-scraper
```

---

## 📈 Advanced: Zero-Downtime Deployment

For zero-downtime deployments, use PM2 cluster mode:

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'nodemaven-scraper',
    script: './index.js',
    instances: 2,  // Run 2 instances
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

Then use `pm2 reload` instead of `pm2 restart` in workflow:
```bash
pm2 reload nodemaven-scraper
```

---

## ✅ Verification Checklist

After setting up CD:

- [ ] SSH key generated
- [ ] Public key added to server
- [ ] GitHub secrets configured
- [ ] Workflow file exists (`.github/workflows/deploy.yml`)
- [ ] Test push triggers deployment
- [ ] Deployment succeeds in GitHub Actions
- [ ] Application restarts successfully
- [ ] Website is accessible
- [ ] No errors in PM2 logs

---

## 🎉 You're Done!

Your continuous deployment is now set up!

**Every time you push to `main`:**
1. Code automatically deploys to server
2. Dependencies auto-update
3. Application auto-restarts
4. You get notified of success/failure

**Test it:** Make a change, commit, push, and watch it deploy automatically! 🚀
