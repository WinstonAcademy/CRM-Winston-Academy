# 🚨 SECURITY ALERT - VPS Compromised

## Critical Issue Detected

Your VPS shows signs of compromise:
- Malicious processes in `.bashrc` and `/etc/profile`
- References to `/usr/bin/.update` (backdoor)
- Hundreds of zombie processes
- System instability

## Immediate Actions Required

### Step 1: Disconnect and Secure

**DO NOT run any commands on the compromised system until it's cleaned.**

1. **Change all passwords immediately:**
   - Root password
   - SSH keys
   - Any service passwords

2. **Check for unauthorized access:**
   ```bash
   # Check recent logins
   last
   lastlog
   
   # Check SSH access
   grep "Accepted" /var/log/auth.log | tail -20
   ```

### Step 2: Clean Up Malicious Files

**Run these commands CAREFULLY:**

```bash
# 1. Check .bashrc for malicious code
cat /root/.bashrc | grep -v "^#" | grep -v "^$"

# 2. Check /etc/profile for malicious code
cat /etc/profile | grep -v "^#" | grep -v "^$"

# 3. Look for the .update file
find /usr/bin -name ".update" 2>/dev/null
find /tmp -name "*update*" 2>/dev/null
find /var/tmp -name "*update*" 2>/dev/null

# 4. Check for suspicious cron jobs
crontab -l
cat /etc/crontab
ls -la /etc/cron.d/
ls -la /var/spool/cron/

# 5. Check for suspicious systemd services
systemctl list-units --type=service --state=running | grep -v "systemd\|dbus\|network"
```

### Step 3: Remove Malicious Code

**Backup first, then clean:**

```bash
# Backup original files
cp /root/.bashrc /root/.bashrc.backup
cp /etc/profile /etc/profile.backup

# Remove malicious lines (be VERY careful)
# Edit .bashrc and remove any lines referencing:
# - /usr/bin/.update
# - sleep 30
# - suspicious processes

nano /root/.bashrc
# Remove malicious lines

nano /etc/profile
# Remove malicious lines
```

### Step 4: Kill Malicious Processes

```bash
# Kill all sleep processes (they're likely part of the attack)
pkill -9 sleep

# Kill any processes related to .update
ps aux | grep -i update | grep -v grep
# Kill the PIDs shown

# Clean up zombie processes
# Note: Zombies are cleaned by their parent, but you can try:
killall -9 sleep 2>/dev/null
```

### Step 5: Secure the System

```bash
# 1. Update system
apt update && apt upgrade -y

# 2. Install security tools
apt install -y fail2ban rkhunter chkrootkit

# 3. Run security scans
rkhunter --update
rkhunter --check

# 4. Check for rootkits
chkrootkit

# 5. Review firewall
ufw status
# Ensure only necessary ports are open
```

### Step 6: Rebuild or Restore

**Consider these options:**

**Option A: Fresh Install (Recommended)**
- Backup your application files (`/var/www/crm`)
- Reinstall Ubuntu
- Restore files
- Change all passwords

**Option B: Deep Clean**
- Follow steps above
- Monitor system closely
- Consider professional security audit

## Prevention

1. **Use SSH keys instead of passwords**
2. **Disable root login via password**
3. **Use fail2ban**
4. **Keep system updated**
5. **Monitor logs regularly**
6. **Use firewall (ufw)**
7. **Regular security audits**

## After Cleanup

Once the system is secure, we can:
1. Fix the port 3000 issue
2. Restart services properly
3. Set up proper monitoring

## Important Notes

- **DO NOT** run commands that download and execute scripts
- **DO NOT** trust any files on the compromised system
- **Consider** rebuilding from scratch if possible
- **Change** all credentials immediately


