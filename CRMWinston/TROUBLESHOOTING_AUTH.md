# Troubleshooting Authentication Issues

## Current Issue

You're seeing `TypeError: Failed to fetch` when trying to login. This means the frontend cannot connect to the backend.

## Quick Diagnostic Steps

### 1. Test Backend Connection

Open this URL in your browser:
```
http://localhost:3000/test-auth.html
```

This will automatically test:
- ✅ Backend health check
- ✅ Login functionality

### 2. Check if Services are Running

**Check Strapi (Backend):**
```bash
curl http://localhost:1337/_health
```
Should return status 204 (no content).

**Check Frontend:**
```bash
curl http://localhost:3000
```
Should return HTML.

### 3. Check Browser Console

1. Open your browser (Chrome/Firefox)
2. Press F12 to open Developer Tools
3. Go to the "Console" tab
4. Try to login
5. Look for error messages

## Common Issues and Solutions

### Issue 1: "Failed to fetch" Error

**Cause**: Browser cannot connect to backend

**Solutions**:

1. **Clear Browser Cache**
   - Press Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
   - Select "Cached images and files"
   - Click "Clear data"

2. **Try Incognito/Private Window**
   - Chrome: Ctrl+Shift+N (Cmd+Shift+N on Mac)
   - Firefox: Ctrl+Shift+P (Cmd+Shift+P on Mac)

3. **Restart Both Services**
   ```bash
   # Kill all processes
   pkill -f "strapi"
   pkill -f "next"
   
   # Wait a moment
   sleep 3
   
   # Start Strapi
   cd /Users/nikitasomani/Desktop/Win/WinstonCRM-strapi/winston-crm
   npm run develop &
   
   # Wait for Strapi to start
   sleep 10
   
   # Start Frontend
   cd /Users/nikitasomani/Desktop/Win/CRMWinston
   npm run dev
   ```

4. **Check if ports are available**
   ```bash
   # Check if port 1337 is in use
   lsof -i :1337
   
   # Check if port 3000 is in use
   lsof -i :3000
   ```

### Issue 2: CORS Errors

**Cause**: Cross-Origin Resource Sharing is blocking requests

**Solution**: The CORS configuration should already be correct in `WinstonCRM-strapi/winston-crm/config/middlewares.ts`:

```typescript
{
  name: 'strapi::cors',
  config: {
    enabled: true,
    headers: '*',
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000']
  }
}
```

If you're still seeing CORS errors, restart Strapi.

### Issue 3: Backend Not Responding

**Cause**: Strapi crashed or is not running

**Solution**:
```bash
cd /Users/nikitasomani/Desktop/Win/WinstonCRM-strapi/winston-crm
npm run develop
```

Watch for errors in the console. Common issues:
- Database locked
- Port already in use
- Missing dependencies

### Issue 4: Frontend Not Loading

**Cause**: Next.js build cache is corrupted

**Solution**:
```bash
cd /Users/nikitasomani/Desktop/Win/CRMWinston
rm -rf .next
npm run dev
```

## Testing the Fix

After applying any solution:

1. **Open the test page**: `http://localhost:3000/test-auth.html`
2. **Click "Test Backend Health"** - should show ✅
3. **Click "Test Login"** - should show ✅ with user data
4. **Go to login page**: `http://localhost:3000/login`
5. **Login with**:
   - Email: `adminuser@winstonacademy.co.uk`
   - Password: `Admin123!`

## Expected Behavior

When everything is working:

1. **Backend health check** returns 204
2. **Login request** returns 200 with JWT token and user data
3. **Frontend login** redirects to dashboard
4. **Dashboard shows** all backend tables (Leads, Students, Users)

## Still Not Working?

If you're still seeing errors:

1. **Check the browser console** (F12) for detailed error messages
2. **Check Strapi logs** in the terminal where you ran `npm run develop`
3. **Try the curl test**:
   ```bash
   curl -X POST http://localhost:1337/api/auth/local \
     -H "Content-Type: application/json" \
     -d '{"identifier":"adminuser@winstonacademy.co.uk","password":"Admin123!"}'
   ```
   This should return a JWT token and user data.

4. **Check if there are multiple Next.js processes**:
   ```bash
   ps aux | grep next
   ```
   If you see multiple processes, kill them all:
   ```bash
   pkill -9 -f "next"
   ```

## Contact Information

If none of these solutions work, please provide:
1. Screenshot of browser console errors
2. Strapi terminal output
3. Frontend terminal output
4. Result of the curl test above

