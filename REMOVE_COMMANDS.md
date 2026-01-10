# Commands to Remove Apps from VPS

## Run These Commands Directly on VPS

**SSH into VPS first:**
```bash
ssh root@87.106.148.40
```

**Then run these commands one by one:**

```bash
# 1. Stop all PM2 processes
pm2 stop all

# 2. Delete all PM2 processes
pm2 delete all

# 3. Kill PM2 daemon
pm2 kill

# 4. Kill any processes on port 1337
lsof -ti:1337 | xargs kill -9 2>/dev/null || true

# 5. Kill any processes on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# 6. Kill any strapi processes
pkill -9 -f "strapi" 2>/dev/null || true

# 7. Kill any next.js processes
pkill -9 -f "next start" 2>/dev/null || true

# 8. Remove the entire /var/www/crm directory
rm -rf /var/www/crm

# 9. Remove PM2 dump file
rm -f ~/.pm2/dump.pm2 2>/dev/null || true

# 10. Verify removal
ls -la /var/www/crm
# Should show: No such file or directory

# 11. Check ports are free
lsof -i:1337
lsof -i:3000
# Should return nothing

# 12. Check PM2 is empty
pm2 list
# Should show empty list
```

## One-Liner Version (Copy and Paste Entire Block)

```bash
pm2 stop all && pm2 delete all && pm2 kill && lsof -ti:1337 | xargs kill -9 2>/dev/null; lsof -ti:3000 | xargs kill -9 2>/dev/null; pkill -9 -f "strapi" 2>/dev/null; pkill -9 -f "next start" 2>/dev/null; rm -rf /var/www/crm && rm -f ~/.pm2/dump.pm2 2>/dev/null && echo "Removal complete!" && ls -la /var/www/crm 2>&1 | head -3
```

## Troubleshooting Connection Issues

If SSH connection keeps resetting:

1. **Try connecting again:**
   ```bash
   ssh root@87.106.148.40
   ```

2. **If connection fails, wait a minute and try again**

3. **Check if VPS is accessible:**
   ```bash
   ping 87.106.148.40
   ```

4. **If still having issues, the VPS might be under heavy load from the malware**

## After Removal

Once removed, you can:
1. Secure the VPS
2. Redeploy from your local files
3. Set up proper security


