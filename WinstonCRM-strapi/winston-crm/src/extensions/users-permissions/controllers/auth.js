'use strict';

/**
 * Custom auth controller
 * Extends default Strapi authentication to check custom isActive field
 * Includes rate limiting for login attempts
 */

const utils = require('@strapi/utils');
const { getService } = require('@strapi/plugin-users-permissions/server/utils');
const { sanitize } = utils;
const { ApplicationError, ValidationError } = utils.errors;

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  MAX_ATTEMPTS: 5, // Maximum failed attempts
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes window
  LOCKOUT_MS: 30 * 60 * 1000, // 30 minutes lockout after max attempts
};

// In-memory store for rate limiting (in production, use Redis or similar)
const loginAttempts = new Map();

/**
 * Get client identifier (IP address or identifier)
 */
function getClientIdentifier(ctx, identifier) {
  const ip = ctx.request.ip || ctx.request.connection?.remoteAddress || 'unknown';
  return `${ip}:${identifier?.toLowerCase() || 'unknown'}`;
}

/**
 * Check if client is rate limited
 */
function isRateLimited(clientId) {
  const attempts = loginAttempts.get(clientId);
  if (!attempts) {
    return false;
  }

  const now = Date.now();
  
  // Check if locked out
  if (attempts.lockedUntil && now < attempts.lockedUntil) {
    const remainingMinutes = Math.ceil((attempts.lockedUntil - now) / 60000);
    return {
      limited: true,
      message: `Too many login attempts. Please try again in ${remainingMinutes} minute(s).`,
    };
  }

  // Clear old attempts outside the window
  attempts.timestamps = attempts.timestamps.filter(
    (timestamp) => now - timestamp < RATE_LIMIT_CONFIG.WINDOW_MS
  );

  // Check if exceeded max attempts
  if (attempts.timestamps.length >= RATE_LIMIT_CONFIG.MAX_ATTEMPTS) {
    attempts.lockedUntil = now + RATE_LIMIT_CONFIG.LOCKOUT_MS;
    const lockoutMinutes = Math.ceil(RATE_LIMIT_CONFIG.LOCKOUT_MS / 60000);
    return {
      limited: true,
      message: `Too many login attempts. Account locked for ${lockoutMinutes} minutes.`,
    };
  }

  return false;
}

/**
 * Record failed login attempt
 */
function recordFailedAttempt(clientId) {
  const now = Date.now();
  const attempts = loginAttempts.get(clientId) || { timestamps: [] };
  
  attempts.timestamps.push(now);
  
  // Clean old timestamps outside the window
  attempts.timestamps = attempts.timestamps.filter(
    (timestamp) => now - timestamp < RATE_LIMIT_CONFIG.WINDOW_MS
  );
  
  loginAttempts.set(clientId, attempts);
  
  // Clean up old entries periodically (every hour)
  if (Math.random() < 0.01) { // 1% chance on each request
    const cutoff = now - RATE_LIMIT_CONFIG.WINDOW_MS * 2;
    for (const [key, value] of loginAttempts.entries()) {
      if (value.timestamps.length === 0 || 
          (value.timestamps[value.timestamps.length - 1] < cutoff && 
           (!value.lockedUntil || value.lockedUntil < now))) {
        loginAttempts.delete(key);
      }
    }
  }
}

/**
 * Clear failed attempts on successful login
 */
function clearFailedAttempts(clientId) {
  loginAttempts.delete(clientId);
}

module.exports = ({ strapi }) => ({
  async callback(ctx) {
    const provider = ctx.params.provider || 'local';
    const params = ctx.request.body;

    const store = strapi.store({ type: 'plugin', name: 'users-permissions' });
    const grantSettings = await store.get({ key: 'grant' });

    const grantProvider = provider === 'local' ? 'email' : provider;

    if (!grantSettings[grantProvider]?.enabled) {
      throw new ApplicationError('This provider is disabled');
    }

    if (provider === 'local') {
      await validateCallbackBody(params);

      const { identifier } = params;

      // Check if is an email
      const isEmail = /^.+@.+\..+$/.test(identifier);

      if (isEmail) {
        params.identifier = identifier.toLowerCase();
      }

      // ⭐ RATE LIMITING: Check if client is rate limited
      const clientId = getClientIdentifier(ctx, identifier);
      const rateLimitCheck = isRateLimited(clientId);
      
      if (rateLimitCheck && rateLimitCheck.limited) {
        console.log(`🚫 Rate limit triggered for: ${clientId}`);
        throw new ApplicationError(rateLimitCheck.message);
      }

      const query = { provider };

      if (isEmail) {
        query.email = params.identifier;
      } else {
        query.username = params.identifier;
      }

      // Find user
      const user = await strapi.query('plugin::users-permissions.user').findOne({ where: query });

      if (!user) {
        // Record failed attempt (don't reveal if user exists)
        recordFailedAttempt(clientId);
        throw new ValidationError('Invalid identifier or password');
      }

      if (!user.password) {
        recordFailedAttempt(clientId);
        throw new ValidationError('Invalid identifier or password');
      }

      const validPassword = await getService('user').validatePassword(
        params.password,
        user.password
      );

      if (!validPassword) {
        // Record failed attempt
        recordFailedAttempt(clientId);
        throw new ValidationError('Invalid identifier or password');
      }
      
      // ⭐ Clear failed attempts on successful login
      clearFailedAttempts(clientId);

      // ⭐ CUSTOM CHECK: Verify user is active
      if (user.isActive === false) {
        console.log('❌ Login blocked: User is inactive:', user.email);
        throw new ApplicationError('Your account has been deactivated. Please contact an administrator.');
      }

      // ⭐ Also check the built-in blocked field
      if (user.blocked) {
        throw new ApplicationError('Your account has been blocked. Please contact an administrator.');
      }

      // ⭐ Check if user is confirmed (if email confirmation is enabled)
      const advancedSettings = await store.get({ key: 'advanced' });
      if (advancedSettings.email_confirmation && !user.confirmed) {
        throw new ApplicationError('Your account email is not confirmed');
      }

      console.log('✅ Login successful for user:', user.email, '(isActive:', user.isActive, ')');

      ctx.send({
        jwt: getService('jwt').issue({ id: user.id }),
        user: await sanitize.contentAPI.output(user, strapi.getModel('plugin::users-permissions.user')),
      });
    } else {
      // Redirect to the front-end with the access_token
      return ctx.redirect(
        `${grantSettings[grantProvider].redirectUri}?access_token=${accessToken}`
      );
    }
  },

  async forgotPassword(ctx) {
    const { email } = ctx.request.body;

    if (!email) {
      return ctx.badRequest('Missing email');
    }

    // Get the frontend URL from environment or config
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetPasswordUrl = `${frontendUrl}/reset-password`;

    try {
      // Find user by email
      const user = await strapi.query('plugin::users-permissions.user').findOne({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        // Don't reveal if user exists (security best practice)
        return ctx.send({ ok: true });
      }

      // Generate reset token using Strapi's service
      const resetPasswordToken = strapi.plugins['users-permissions'].services.user.generateResetPasswordToken(user);

      // Update user with reset token
      await strapi.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: { resetPasswordToken },
      });

      // Send email with custom URL
      await strapi.plugins['users-permissions'].services.email.sendTemplatedEmail(
        {
          to: user.email,
        },
        {
          subject: 'Reset your password for Winston Academy CRM',
          text: `Hello,

You requested a password reset for your Winston Academy CRM account.

Please click on the following link to reset your password:
${resetPasswordUrl}?code=${resetPasswordToken}

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
                    <a href="${resetPasswordUrl}?code=${resetPasswordToken}" class="button">Reset Password</a>
                  </p>
                  <p>Or copy and paste this link into your browser:</p>
                  <p style="word-break: break-all; color: #667eea;">${resetPasswordUrl}?code=${resetPasswordToken}</p>
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
        }
      );

      return ctx.send({ ok: true });
    } catch (error) {
      console.error('Error in forgot password:', error);
      return ctx.badRequest('An error occurred while processing your request');
    }
  },
});

const validateCallbackBody = async (data) => {
  if (!data.identifier) {
    throw new ValidationError('Missing identifier');
  }

  if (!data.password) {
    throw new ValidationError('Missing password');
  }
};

