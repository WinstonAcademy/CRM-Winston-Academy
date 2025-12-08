# Name.com Email Configuration for Winston Academy CRM

## 📧 Quick Setup Guide

### Step 1: Create `.env` File

Create a `.env` file in `WinstonCRM-strapi/winston-crm/` directory with the following content:

```env
# Email Provider
EMAIL_PROVIDER=smtp

# Name.com SMTP Configuration
SMTP_HOST=mail.name.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USERNAME=info@winstonacademy.co.uk
SMTP_PASSWORD=your-email-password-here

# Email From Address
EMAIL_FROM=info@winstonacademy.co.uk
EMAIL_REPLY_TO=info@winstonacademy.co.uk

# Frontend URL (for password reset links)
FRONTEND_URL=http://localhost:3000
```

### Step 2: Replace Placeholder Values

1. **SMTP_PASSWORD**: Replace `your-email-password-here` with the actual password for `info@winstonacademy.co.uk`
2. **FRONTEND_URL**: 
   - For local development: `http://localhost:3000`
   - For production: `https://your-domain.com`

### Step 3: Name.com SMTP Settings

**Outgoing Mail Server (SMTP):**
- **Server:** `mail.name.com`
- **Port:** `465` (SSL) or `587` (TLS)
- **Security:** SSL/TLS
- **Authentication:** Required
- **Username:** Full email address (`info@winstonacademy.co.uk`)
- **Password:** Your email account password

### Step 4: Alternative Port Configuration

If port 465 doesn't work, try port 587 with TLS:

```env
SMTP_HOST=mail.name.com
SMTP_PORT=587
SMTP_SECURE=false
```

### Step 5: Restart Strapi

After creating/updating `.env`, restart your Strapi backend:

```bash
cd WinstonCRM-strapi/winston-crm
npm run develop
```

### Step 6: Test Email

1. Go to `http://localhost:3000/forgot-password`
2. Enter a valid user email
3. Check `info@winstonacademy.co.uk` inbox for the reset link

## 🔧 Troubleshooting

### Emails Not Sending?

1. **Verify Email Account Exists:**
   - Log in to Name.com account
   - Go to "My Products" → "Email" → "Manage Email"
   - Ensure `info@winstonacademy.co.uk` is created and active

2. **Check Password:**
   - Make sure you're using the correct password for the email account
   - Try logging into webmail at https://mail.name.com to verify credentials

3. **Port Issues:**
   - Try port `465` with `SMTP_SECURE=true` first
   - If that doesn't work, try port `587` with `SMTP_SECURE=false`

4. **Check Strapi Logs:**
   - Look for email-related errors in the Strapi console
   - Common errors include authentication failures or connection timeouts

5. **Firewall/Network:**
   - Ensure ports 465 or 587 are not blocked
   - Check if your network allows SMTP connections

### Common Error Messages

**"Authentication failed":**
- Double-check your email and password
- Ensure the email account is active in Name.com

**"Connection timeout":**
- Check if `mail.name.com` is accessible
- Try the alternative port (587 instead of 465)

**"Self-signed certificate":**
- Add `rejectUnauthorized: false` to providerOptions (not recommended for production)

## 📝 Production Configuration

For production deployment, update:

```env
FRONTEND_URL=https://your-production-domain.com
EMAIL_FROM=info@winstonacademy.co.uk
EMAIL_REPLY_TO=info@winstonacademy.co.uk
```

## 🔒 Security Notes

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use strong passwords** for your email account
3. **Keep email credentials secure** - Don't share them
4. **Monitor email logs** for suspicious activity

## ✅ Verification Checklist

- [ ] `.env` file created with correct SMTP settings
- [ ] Email account `info@winstonacademy.co.uk` exists in Name.com
- [ ] Password is correct and account is active
- [ ] Strapi backend restarted after `.env` changes
- [ ] Test forgot password flow works
- [ ] Email received in inbox
- [ ] Reset link works correctly

## 📞 Need Help?

If you're still having issues:
1. Check Name.com email documentation
2. Verify email account status in Name.com dashboard
3. Test SMTP settings with an email client (Outlook, Thunderbird)
4. Check Strapi console for detailed error messages

