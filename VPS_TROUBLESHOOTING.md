# Troubleshooting crm.winstonacademy.co.uk

## Quick Diagnostic Steps

### Step 1: Run Diagnostic Script on VPS

SSH into your VPS and run:

```bash
# Copy the diagnostic script to VPS
scp vps-diagnostic.sh root@87.106.148.40:/root/

# SSH into VPS
ssh root@87.106.148.40

# Run diagnostic
chmod +x /root/vps-diagnostic.sh
/root/vps-diagnostic.sh
```

### Step 2: Check Common Issues

#### Issue 1: DNS Not Resolving

**Check DNS:**
```bash
dig crm.winstonacademy.co.uk
# Should return: 87.106.148.40
```

**If wrong IP:**
- Go to name.com DNS management
- Verify A record: `crm` → `87.106.148.40`
- Wait 15-60 minutes for DNS propagation

#### Issue 2: Services Not Running

**Check PM2:**
```bash
pm2 status
pm2 list
```

**If services are stopped:**
```bash
cd /var/www/crm
pm2 start ecosystem.config.js
pm2 save
```

**If services don't exist:**
```bash
# Check if files exist
ls -la /var/www/crm/backend/package.json
ls -la /var/www/crm/frontend/package.json

# If missing, you need to deploy files first
# See DEPLOYMENT_INSTRUCTIONS.md
```

**Check logs:**
```bash
pm2 logs crm-backend
pm2 logs crm-frontend
```

#### Issue 3: Ports Not Listening

**Check ports:**
```bash
netstat -tuln | grep -E "1337|3000"
# or
ss -tuln | grep -E "1337|3000"
```

**If ports not listening:**
- Services aren't running (see Issue 2)
- Check PM2 logs for errors
- Verify .env files exist and are correct

#### Issue 4: Nginx Not Configured

**Check Nginx:**
```bash
systemctl status nginx
nginx -t
```

**If Nginx not running:**
```bash
systemctl start nginx
systemctl enable nginx
```

**If config missing:**
```bash
# Create config file (see DEPLOYMENT_INSTRUCTIONS.md Step 11)
nano /etc/nginx/sites-available/crm.winstonacademy.co.uk

# Enable site
ln -s /etc/nginx/sites-available/crm.winstonacademy.co.uk /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

#### Issue 5: SSL Certificate Missing

**Check SSL:**
```bash
ls -la /etc/letsencrypt/live/crm.winstonacademy.co.uk/
```

**If missing:**
```bash
certbot --nginx -d crm.winstonacademy.co.uk
```

**Note:** SSL requires:
- DNS pointing correctly
- Port 80 accessible
- Nginx configured

#### Issue 6: Firewall Blocking

**Check firewall:**
```bash
ufw status
```

**Allow ports:**
```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw reload
```

### Step 3: Test Each Component

**Test Backend locally:**
```bash
curl http://localhost:1337
# Should redirect to /admin
```

**Test Frontend locally:**
```bash
curl http://localhost:3000
# Should return HTML
```

**Test through Nginx:**
```bash
curl -H "Host: crm.winstonacademy.co.uk" http://localhost
# Should return frontend HTML
```

**Test from outside:**
```bash
curl https://crm.winstonacademy.co.uk
# Should return frontend HTML
```

### Step 4: Check Application Logs

**PM2 Logs:**
```bash
pm2 logs --lines 50
```

**Nginx Logs:**
```bash
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

**System Logs:**
```bash
journalctl -u nginx -n 50
```

## Common Error Messages and Solutions

### "ERR_CONNECTION_REFUSED"
- **Cause:** Services not running or firewall blocking
- **Solution:** Start PM2 services, check firewall

### "ERR_NAME_NOT_RESOLVED"
- **Cause:** DNS not configured or not propagated
- **Solution:** Check DNS settings, wait for propagation

### "502 Bad Gateway"
- **Cause:** Nginx can't connect to backend/frontend
- **Solution:** Check if services are running on ports 1337/3000

### "SSL_ERROR"
- **Cause:** SSL certificate missing or expired
- **Solution:** Run `certbot --nginx -d crm.winstonacademy.co.uk`

### "404 Not Found"
- **Cause:** Nginx config incorrect or files not deployed
- **Solution:** Check Nginx config, verify files exist

## Quick Fix Commands

**Restart everything:**
```bash
pm2 restart all
systemctl restart nginx
```

**Rebuild and restart:**
```bash
cd /var/www/crm/backend
npm run build
pm2 restart crm-backend

cd /var/www/crm/frontend
npm run build
pm2 restart crm-frontend
```

**Check everything:**
```bash
pm2 status
systemctl status nginx
netstat -tuln | grep -E "1337|3000"
curl http://localhost:1337
curl http://localhost:3000
```

## Still Not Working?

1. **Share the diagnostic output:**
   ```bash
   /root/vps-diagnostic.sh > diagnostic.txt
   # Then share diagnostic.txt
   ```

2. **Check specific error:**
   - What error do you see in browser?
   - What do PM2 logs show?
   - What do Nginx logs show?

3. **Verify deployment:**
   - Are files on VPS?
   - Are dependencies installed?
   - Are .env files configured?
   - Are applications built?


