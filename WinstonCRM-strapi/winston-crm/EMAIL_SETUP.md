# Email Configuration Guide for Winston Academy CRM

## 📧 Setting Up Email for Forgot Password

To enable email functionality for forgot password, you need to configure your email provider in Strapi.

### Step 1: Create/Update `.env` File

Create or update the `.env` file in `WinstonCRM-strapi/winston-crm/` directory:

```env
# Email Provider (options: sendmail, smtp)
EMAIL_PROVIDER=smtp

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Email From Address
EMAIL_FROM=noreply@winstonacademy.co.uk
EMAIL_REPLY_TO=noreply@winstonacademy.co.uk

# Frontend URL (for password reset links)
FRONTEND_URL=http://localhost:3000
```

### Step 2: Email Provider Options

#### Option A: Gmail (Recommended for Testing)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Create an app password for "Mail"
   - Use this password (not your regular Gmail password)

3. **Update `.env`**:
```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-16-character-app-password
```

#### Option B: SendGrid

```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

#### Option C: Mailgun

```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=your-mailgun-username
SMTP_PASSWORD=your-mailgun-password
```

#### Option D: Outlook/Office 365

```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=your-email@outlook.com
SMTP_PASSWORD=your-password
```

#### Option E: Sendmail (Local Development - No Configuration Needed)

```env
EMAIL_PROVIDER=sendmail
```

### Step 3: Restart Strapi Backend

After updating the `.env` file, restart your Strapi backend:

```bash
cd WinstonCRM-strapi/winston-crm
npm run develop
```

### Step 4: Test Email Functionality

1. Go to your frontend: `http://localhost:3000/forgot-password`
2. Enter a valid user email
3. Check your email inbox for the password reset link
4. Click the link to reset your password

### Troubleshooting

#### Emails Not Sending?

1. **Check Strapi Logs**: Look for email-related errors in the console
2. **Verify SMTP Credentials**: Double-check username and password
3. **Check Firewall**: Ensure port 587 or 465 is not blocked
4. **Gmail Users**: Make sure you're using an App Password, not your regular password
5. **Test SMTP Connection**: Try sending a test email from Strapi admin panel

#### Gmail "Less Secure Apps" Error

Gmail no longer supports "Less Secure Apps". You **must** use an App Password:
1. Enable 2-Factor Authentication
2. Generate App Password
3. Use the App Password in `.env`

#### Port Issues

- **Port 587**: Use with `SMTP_SECURE=false` (TLS)
- **Port 465**: Use with `SMTP_SECURE=true` (SSL)
- **Port 25**: Usually blocked by ISPs, avoid using

### Production Setup

For production, update the `FRONTEND_URL`:

```env
FRONTEND_URL=https://your-domain.com
```

### Security Notes

1. **Never commit `.env` file** to git (it's already in `.gitignore`)
2. **Use App Passwords** for Gmail, not your main password
3. **Use environment variables** in production hosting
4. **Consider using** email services like SendGrid or Mailgun for production

### Quick Test

To quickly test if email is working, you can check Strapi logs when requesting a password reset. If configured correctly, you should see email sending logs.

