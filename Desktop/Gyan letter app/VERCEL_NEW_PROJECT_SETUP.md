# 🚀 Setting Up a New Vercel Project

## Step-by-Step Guide to Create a Fresh Vercel Project

### Step 1: Delete the Old Project (Optional but Recommended)

1. Go to: **https://vercel.com/dashboard**
2. Find your project: **Gyan-Letter-App**
3. Click on it
4. Go to **Settings** → Scroll to bottom
5. Click **"Delete Project"**
6. Confirm deletion

### Step 2: Create New Project

1. Go to: **https://vercel.com/new**
2. Click **"Import Git Repository"**
3. Search for: **DevelopRB/Gyan-Letter-App**
4. Click **"Import"**

### Step 3: Configure Project Settings

**IMPORTANT**: Configure these settings correctly from the start!

#### Framework Settings:
- **Framework Preset**: Select **"Vite"** from the dropdown
- **Root Directory**: **LEAVE EMPTY** (don't type anything!)
- **Build Command**: Should auto-fill to `npm run build` (verify it's there)
- **Output Directory**: Should auto-fill to `dist` (verify it's there)
- **Install Command**: Should be `npm install` (verify it's there)

**⚠️ CRITICAL**: Make sure **Root Directory is EMPTY/BLANK**!

#### Environment Variables:
**BEFORE clicking Deploy**, click **"Environment Variables"** and add:

```
DB_HOST=ep-flat-bird-afkh2n4z-pooler.c-2.us-west-2.aws.neon.tech
DB_USER=neondb_owner
DB_PASSWORD=npg_1c6KUGfSRJvw
DB_NAME=neondb
DB_PORT=5432
NODE_ENV=production
PORT=5000
```

For each variable:
- **Key**: The variable name (e.g., `DB_HOST`)
- **Value**: The variable value (e.g., `ep-flat-bird-afkh2n4z-pooler.c-2.us-west-2.aws.neon.tech`)
- **Environment**: Select **Production**, **Preview**, and **Development** (or just **Production**)

### Step 4: Deploy

1. Click **"Deploy"** button
2. Wait for the build to complete
3. Check the build logs to ensure:
   - ✅ `npm install` runs successfully
   - ✅ `npm run build` runs successfully
   - ✅ Framework is detected as "Vite"
   - ✅ Build completes without errors

### Step 5: Verify Deployment

1. Once deployed, click **"Visit"** to open your app
2. Test the frontend: Should load the React app
3. Test the API: Go to `https://your-app.vercel.app/api/health`
   - Should return: `{"status":"ok","database":"connected",...}`

## What to Check After Deployment

### ✅ Build Logs Should Show:
```
Running "install" command: `npm install`...
✓ Dependencies installed
Running "build" command: `npm run build`...
✓ Build completed
Framework detected: Vite
```

### ✅ Functions Should Be Available:
- Go to **Deployments** → Click latest → **Functions** tab
- Should see:
  - `api/health.js`
  - `api/records/[...path].js`

### ✅ Environment Variables:
- Go to **Settings** → **Environment Variables**
- Verify all 7 variables are set correctly

## Troubleshooting

### If Build Fails:
1. Check build logs for specific errors
2. Verify Root Directory is empty
3. Verify Framework is set to "Vite"
4. Check that `package.json` exists in repository root

### If API Returns 404:
1. Check Functions tab - should see serverless functions
2. Test `/api/health` endpoint
3. Check function logs for errors

### If Frontend Shows 404:
1. Verify Output Directory is `dist`
2. Check that build created `dist` folder
3. Verify rewrite rule in `vercel.json` is correct

## Success Checklist

- [ ] Root Directory is **EMPTY**
- [ ] Framework is set to **Vite**
- [ ] All 7 environment variables are added
- [ ] Build completes successfully
- [ ] Frontend loads at root URL
- [ ] API endpoint `/api/health` works
- [ ] Database connection is successful

---

**Starting fresh will avoid all the Root Directory issues!**













