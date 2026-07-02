# 🚀 Deploy Frontend to Render

Your backend is live at: **https://gyan-letter-app.onrender.com**

Now let's deploy the frontend!

## Step 1: Create Static Site

1. Go to: **https://dashboard.render.com**
2. Click **"New +"** → **"Static Site"**
3. Connect GitHub if not already connected
4. Select repository: **DevelopRB/Gyan-Letter-App**

## Step 2: Configure Frontend

### Basic Settings:
- **Name**: `gyan-letter-app-frontend` (or any name you prefer)
- **Branch**: `main`
- **Root Directory**: `Desktop/Gyan letter app` ⚠️ (Same as backend!)

### Build Settings:
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`

### Environment Variables:
Click **"Add Environment Variable"** and add:

```
VITE_API_URL=https://gyan-letter-app.onrender.com
```

**Important**: Replace `gyan-letter-app` with your actual backend service name if different!

## Step 3: Deploy

1. Click **"Create Static Site"**
2. Wait for build and deployment to complete
3. Your frontend will be available at: `https://gyan-letter-app-frontend.onrender.com` (or your chosen name)

## Step 4: Test

1. Visit your frontend URL
2. Test uploading Excel files
3. Verify data is saved to database
4. Test all features

## Quick Checklist:

- [ ] Root Directory: `Desktop/Gyan letter app`
- [ ] Build Command: `npm install && npm run build`
- [ ] Publish Directory: `dist`
- [ ] Environment Variable: `VITE_API_URL=https://gyan-letter-app.onrender.com`
- [ ] Backend URL matches your actual backend service name

---

**After deployment, your full app will be live! 🎉**












