export default ({ env }) => ({
  'users-permissions': {
    enabled: true,
    config: {
      jwt: {
        expiresIn: '7d',
      },
      register: {
        allowedFields: [
          'firstName',
          'lastName',
          'userRole',
          'canAccessLeads',
          'canAccessStudents',
          'canAccessUsers',
          'canAccessDashboard',
          'isActive',
          'phone'
        ]
      },
      email: {
        resetPassword: {
          enabled: true,
          // Frontend URL for password reset - change this to your production URL
          url: env('FRONTEND_URL', 'http://localhost:3000') + '/reset-password',
          emailTemplate: {
            subject: 'Reset your password for Winston Academy CRM',
            text: `Hello,

You requested a password reset for your Winston Academy CRM account.

Please click on the following link to reset your password:
<%= URL %>?code=<%= TOKEN %>

If you didn't request this, please ignore this email.

Best regards,
Winston Academy CRM Team`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                  .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                  .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                  .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>Winston Academy CRM</h1>
                    <p>Password Reset Request</p>
                  </div>
                  <div class="content">
                    <p>Hello,</p>
                    <p>You requested a password reset for your Winston Academy CRM account.</p>
                    <p>Please click on the button below to reset your password:</p>
                    <p style="text-align: center;">
                      <a href="<%= URL %>?code=<%= TOKEN %>" class="button">Reset Password</a>
                    </p>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #667eea;"><%= URL %>?code=<%= TOKEN %></p>
                    <p>If you didn't request this password reset, please ignore this email.</p>
                    <p>This link will expire in 1 hour.</p>
                  </div>
                  <div class="footer">
                    <p>Best regards,<br>Winston Academy CRM Team</p>
                  </div>
                </div>
              </body>
              </html>
            `,
          },
        },
      },
    }
  },
  email: {
    config: {
      provider: env('EMAIL_PROVIDER', 'sendmail'), // Options: sendmail, smtp, or other providers
      providerOptions: {
        host: env('SMTP_HOST', 'localhost'),
        port: env.int('SMTP_PORT', 587),
        secure: env.bool('SMTP_SECURE', false), // true for 465, false for other ports
        auth: {
          user: env('SMTP_USERNAME', ''),
          pass: env('SMTP_PASSWORD', ''),
        },
        // For Gmail, you may need to use an App Password
        // For other providers, adjust settings accordingly
      },
      settings: {
        defaultFrom: env('EMAIL_FROM', 'noreply@winstonacademy.co.uk'),
        defaultReplyTo: env('EMAIL_REPLY_TO', 'noreply@winstonacademy.co.uk'),
      },
    },
  },
  upload: {
    enabled: true,
    config: {
      sizeLimit: 100 * 1024 * 1024, // 100MB
      provider: 'local',
      providerOptions: {
        sizeLimit: 100 * 1024 * 1024, // 100MB
      },
    },
  },
});
