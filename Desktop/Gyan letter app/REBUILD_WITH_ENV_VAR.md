# Rebuild Frontend to Include VITE_API_URL

## Problem
Even though `VITE_API_URL` is set in Render, the frontend build doesn't have it because:
- Vite embeds environment variables at **BUILD TIME**, not runtime
- If the variable was added after the last build, it won't be in the current deployment

## Solution: Trigger a New Build

### Step 1: Go to Render Dashboard
1. Open: https://dashboard.render.com
2. Click on your **Gyan-Letter-App-1** static site service

### Step 2: Trigger Manual Deploy
1. Click the **"Manual Deploy"** button (top right)
2. Select **"Deploy latest commit"**
3. This will rebuild the frontend with the `VITE_API_URL` environment variable included

### Step 3: Wait for Build
- The build will take 2-5 minutes
- Watch the build logs to ensure it completes successfully

### Step 4: Verify After Deployment
1. Visit: https://gyan-letter-app-1.onrender.com
2. Open browser console (F12)
3. Check the console logs - you should see:
   ```
   [Auth Service] API Base URL: https://gyan-letter-app.onrender.com
   [Auth Service] VITE_API_URL env: https://gyan-letter-app.onrender.com
   ```
4. If you see `not set` or empty, the rebuild didn't pick it up

### Step 5: Test Login
1. Try logging in with: `admin` / `admin123`
2. Should work without 404 errors

## Why This Happens

Vite environment variables work like this:
- ✅ Set variable → Build → Variable is embedded in code
- ❌ Build → Set variable → Variable is NOT in the code

So you need to rebuild after setting the variable.

## Alternative: Check Build Logs

If you want to verify the variable is being used during build:
1. Go to your Render service
2. Click on the latest deployment
3. Check the build logs
4. Look for any errors or warnings about environment variables

