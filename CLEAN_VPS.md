# Complete VPS Cleanup Guide

## Quick Cleanup Commands

**Run these commands on your VPS:**

### Option 1: Use the Script

```bash
# Copy script to VPS
scp clean-vps-complete.sh root@87.106.148.40:/root/

# SSH and run
ssh root@87.106.148.40
chmod +x /root/clean-vps-complete.sh
/root/clean-vps-complete.sh
```

### Option 2: Manual Cleanup

**Run these commands one by one:**

```bash
# 1. Backup files
cp /etc/profile /etc/profile.backup
cp /root/.bashrc /root/.bashrc.backup

# 2. Remove malicious code from /etc/profile
sed -i '/\.update/d' /etc/profile
sed -i '/sleep 30/d' /etc/profile
sed -i '/done &/d' /etc/profile
sed -i '/^[[:space:]]*&[[:space:]]*$/d' /etc/profile

# 3. Remove malicious code from .bashrc
sed -i '/\.update/d' /root/.bashrc
sed -i '/sleep 30/d' /root/.bashrc
sed -i '/done &/d' /root/.bashrc
sed -i '/^[[:space:]]*&[[:space:]]*$/d' /root/.bashrc

# 4. Fix file endings (ensure files end with newline)
echo "" >> /etc/profile
echo "" >> /root/.bashrc

# 5. Test syntax
bash -n /etc/profile
bash -n /root/.bashrc

# 6. Remove malicious files
rm -f /usr/bin/.update
find /tmp -name "*update*" -delete
find /var/tmp -name "*update*" -delete

# 7. Kill malicious processes
pkill -9 -f "sleep 30"
pkill -9 -f "\.update"

# 8. Clean PM2
pm2 stop all
pm2 delete all
pm2 kill
rm -rf ~/.pm2/logs/*
rm -f ~/.pm2/dump.pm2

# 9. Remove applications
rm -rf /var/www/crm

# 10. Clean ports
lsof -ti:1337 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# 11. Verify
grep -n "\.update\|sleep 30" /etc/profile /root/.bashrc
# Should return nothing
```

## One-Liner Version

```bash
cp /etc/profile /etc/profile.backup && cp /root/.bashrc /root/.bashrc.backup && sed -i '/\.update/d; /sleep 30/d; /done &/d; /^[[:space:]]*&[[:space:]]*$/d' /etc/profile /root/.bashrc && echo "" >> /etc/profile && echo "" >> /root/.bashrc && rm -f /usr/bin/.update && pkill -9 -f "sleep 30" && pkill -9 -f "\.update" && pm2 stop all && pm2 delete all && pm2 kill && rm -rf /var/www/crm ~/.pm2/logs/* && echo "Cleanup complete!" && bash -n /etc/profile && bash -n /root/.bashrc && echo "Syntax OK!"
```

## After Cleanup

1. **Exit and reconnect to test:**
   ```bash
   exit
   ssh root@87.106.148.40
   ```
   You should NOT see any errors about `.update` or syntax errors.

2. **If errors persist**, manually edit files:
   ```bash
   nano /etc/profile
   # Remove any lines with .update, sleep 30, or "done &"
   
   nano /root/.bashrc
   # Remove any lines with .update, sleep 30, or "done &"
   ```

3. **Consider rebuilding VPS** for complete security

## What Gets Cleaned

- ✅ Malicious code from `/etc/profile` and `/root/.bashrc`
- ✅ Malicious files (`/usr/bin/.update`)
- ✅ Malicious processes
- ✅ PM2 processes and logs
- ✅ Application directories (`/var/www/crm`)
- ✅ Port processes (1337, 3000)

## Verification

After cleanup, verify:

```bash
# Check for malicious code
grep -n "\.update\|sleep 30" /etc/profile /root/.bashrc
# Should return nothing

# Check syntax
bash -n /etc/profile
bash -n /root/.bashrc
# Should return nothing (no errors)

# Check applications removed
ls -la /var/www/crm
# Should show: No such file or directory

# Check PM2
pm2 list
# Should show empty
```


