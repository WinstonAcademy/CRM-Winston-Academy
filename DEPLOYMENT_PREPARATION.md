# Deployment Preparation Summary

## Step 1 Completed: Code Preparation for Production

### Changes Made

#### Frontend (CRMWinston)

1. **Environment Files Created:**
   - `.env.production` - Production environment variables
   - `.env.local` - Local development environment variables

2. **Configuration Files Updated:**
   - `src/config/api.ts` - Now uses `NEXT_PUBLIC_STRAPI_URL` environment variable
   - `src/services/realBackendAuthService.ts` - Uses environment variable for BASE_URL
   - `src/services/simpleUserService.ts` - Uses environment variable for BASE_URL

3. **API Routes Updated:**
   - `src/app/api/auth/login/route.ts` - Uses environment variable
   - `src/app/api/auth/forgot-password/route.ts` - Uses environment variable
   - `src/app/api/auth/reset-password/route.ts` - Uses environment variable
   - `src/app/api/auth/change-password/route.ts` - Uses environment variable

4. **Table Components Updated:**
   - `src/components/tables/LeadsTable.tsx` - All hardcoded URLs replaced with environment variables
   - `src/components/tables/StudentTable.tsx` - Hardcoded URLs replaced
   - `src/components/tables/TimesheetTable.tsx` - Error messages updated

#### Backend (WinstonCRM-strapi)

1. **CORS Configuration Updated:**
   - `config/middlewares.ts` - Added production domain `https://crm.winstonacademy.co.uk` to allowed origins

2. **Environment Template Created:**
   - `.env.production.example` - Template for production environment variables

### Environment Variables

#### Frontend (.env.production)
```env
NEXT_PUBLIC_STRAPI_URL=https://crm.winstonacademy.co.uk/api
NODE_ENV=production
```

#### Backend (.env.production)
```env
FRONTEND_URL=https://crm.winstonacademy.co.uk
SMTP_HOST=mail.name.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=info@winstonacademy.co.uk
SMTP_PASSWORD=your-email-password-here
EMAIL_FROM=info@winstonacademy.co.uk
EMAIL_REPLY_TO=info@winstonacademy.co.uk
```

### Next Steps

1. **Build Applications:**
   ```bash
   # Frontend
   cd CRMWinston
   npm run build
   
   # Backend
   cd WinstonCRM-strapi/winston-crm
   npm run build
   ```

2. **Deploy to VPS:**
   - Transfer files to VPS
   - Install dependencies
   - Set up environment variables
   - Configure Nginx
   - Set up SSL
   - Start with PM2

### Notes

- All hardcoded `localhost:1337` URLs have been replaced with environment variables
- The code will work in both development (localhost) and production (crm.winstonacademy.co.uk)
- Environment variables are read at build time for Next.js (NEXT_PUBLIC_*)
- Backend CORS is configured to allow the production domain





