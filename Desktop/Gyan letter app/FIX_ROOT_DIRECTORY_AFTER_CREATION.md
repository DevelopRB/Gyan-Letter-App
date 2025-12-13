# 🔧 Fix Root Directory After Project Creation

## The Problem:
Build fails with: `Could not read package.json: Error: ENOENT: no such file or directory, open '/vercel/path0/package.json'`

This means Root Directory is still set incorrectly.

## Solution: Fix in Vercel Dashboard Settings

### Step 1: Go to Project Settings
1. Go to: **https://vercel.com/dashboard**
2. Click on your project: **Gyan-Letter-App**
3. Click **Settings** tab (top menu)

### Step 2: Fix Root Directory
1. Scroll to **General** section
2. Find **"Root Directory"** field
3. Click **"Edit"** button next to it
4. In the modal:
   - Select **"Gyan-Letter-App"** (repository root)
   - Click **"Continue"**
5. **If it still shows `"./"`**:
   - Try clicking in the Root Directory text field
   - Delete `"./"`
   - Leave it **completely empty**
   - If you can't delete it, try the next step

### Step 3: Alternative - Use Vercel CLI
If the dashboard won't let you change it:

1. **Install Vercel CLI** (if not installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Link to your project**:
   ```bash
   cd "C:\Users\abhis\Desktop\Gyan letter app"
   vercel link
   ```
   - Select your project when prompted
   - Select scope (your account/team)

4. **Check current settings**:
   ```bash
   vercel project ls
   ```

5. **Update Root Directory** (if CLI supports it):
   - Unfortunately, Vercel CLI doesn't directly support changing Root Directory
   - You'll need to use the dashboard

### Step 4: Delete and Re-create Project (Last Resort)
If nothing works:

1. **Delete the project**:
   - Settings → Scroll to bottom → **Delete Project**

2. **Re-import**:
   - Go to: **https://vercel.com/new**
   - Import: **DevelopRB/Gyan-Letter-App**
   - **When Root Directory modal appears**:
     - Select **"Gyan-Letter-App"**
     - Click **Continue**
   - **If Root Directory shows `"./"`**:
     - **Proceed anyway** - we'll fix it after
   - Set Framework to **Vite**
   - Add Environment Variables
   - Click **Deploy**

3. **After first deployment** (even if it fails):
   - Go to **Settings** → **General**
   - Try to edit Root Directory again
   - It might be editable now

## Why This Happens:
Vercel's Root Directory setting is stored in their database, not in your code. The `"./"` value might be getting set automatically and the UI doesn't always allow editing it during project creation.

## Quick Test:
After fixing Root Directory:
1. Go to **Deployments**
2. Click **three dots (⋯)** on latest deployment
3. Click **Redeploy**
4. **UNCHECK** "Use existing Build Cache"
5. Click **Redeploy**

The build should now find `package.json` correctly!

---

**The key is to fix Root Directory in Settings AFTER the project is created!**

