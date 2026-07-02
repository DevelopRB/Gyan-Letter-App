# Set VITE_API_URL Environment Variable in Render

## Problem
The frontend is getting 404 errors when trying to call the API because `VITE_API_URL` is not set.

## Solution: Add Environment Variable in Render

### Step 1: Go to Render Dashboard
1. Open: https://dashboard.render.com
2. Click on your **Gyan-Letter-App-1** static site service

### Step 2: Add Environment Variable
1. Go to **"Environment"** tab (in the left sidebar)
2. Or scroll down to the **"Environment Variables"** section
3. Click **"Add Environment Variable"** button
4. Add:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://gyan-letter-app.onrender.com`
   - (Replace `gyan-letter-app` with your actual backend service name if different)
5. Click **"Save Changes"**

### Step 3: Rebuild the Frontend
**IMPORTANT**: Vite environment variables are embedded at BUILD time, so you must rebuild after adding the variable.

1. After saving the environment variable, go back to the service page
2. Click **"Manual Deploy"** → **"Deploy latest commit"**
3. Wait for the build to complete (2-5 minutes)

### Step 4: Verify
After deployment:
1. Visit your frontend URL: https://gyan-letter-app-1.onrender.com
2. Open browser console (F12)
3. Check for: `[Auth Service] API Base URL: https://gyan-letter-app.onrender.com`
4. Check for: `[Auth Service] VITE_API_URL env: https://gyan-letter-app.onrender.com`
5. Try logging in with: `admin` / `admin123`

## What This Does

- **Before**: Frontend tries to call API on same origin → 404 error
- **After**: Frontend calls API on backend URL → Works correctly

## Important Notes

- The environment variable MUST be set BEFORE the build runs
- If you set it after building, you must trigger a new build
- The value should be your backend URL WITHOUT `/api` suffix
- Example: `https://gyan-letter-app.onrender.com` (NOT `https://gyan-letter-app.onrender.com/api`)

