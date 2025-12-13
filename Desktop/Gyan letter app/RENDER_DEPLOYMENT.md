# 🚀 Deploy to Render

Complete guide to deploy your Gyan Letter App to Render.

## Overview

You'll need to deploy:
1. **Backend** - Web Service (Node.js/Express)
2. **Frontend** - Static Site (React/Vite build)
3. **Database** - Already using Neon PostgreSQL (cloud database)

## Prerequisites

- Render account: https://render.com (sign up if needed)
- GitHub repository: `DevelopRB/Gyan-Letter-App`
- Neon PostgreSQL database (already set up)

---

## Step 1: Deploy Backend (Web Service)

### 1.1 Create New Web Service

1. Go to: https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account if not already connected
4. Select repository: **DevelopRB/Gyan-Letter-App**

### 1.2 Configure Backend Service

**Basic Settings:**
- **Name**: `gyan-letter-app-backend` (or any name you prefer)
- **Region**: Choose closest to you (e.g., `Oregon (US West)`)
- **Branch**: `main`
- **Root Directory**: Leave **EMPTY** (or set to `./`)

**Build & Deploy:**
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`

**Environment Variables:**
Click **"Add Environment Variable"** and add these 7 variables:

```
DB_HOST=ep-flat-bird-afkh2n4z-pooler.c-2.us-west-2.aws.neon.tech
DB_USER=neondb_owner
DB_PASSWORD=npg_1c6KUGfSRJvw
DB_NAME=neondb
DB_PORT=5432
NODE_ENV=production
PORT=10000
```

**Important Notes:**
- Render automatically sets `PORT` environment variable
- Your `server.js` should use `process.env.PORT || 5000`
- Render provides a port, so use `PORT=10000` as fallback or let Render set it

### 1.3 Deploy Backend

1. Click **"Create Web Service"**
2. Wait for deployment to complete
3. Note the URL: `https://gyan-letter-app-backend.onrender.com` (or similar)

---

## Step 2: Deploy Frontend (Static Site)

### 2.1 Create New Static Site

1. Go to: https://dashboard.render.com
2. Click **"New +"** → **"Static Site"**
3. Select repository: **DevelopRB/Gyan-Letter-App**

### 2.2 Configure Frontend

**Basic Settings:**
- **Name**: `gyan-letter-app` (or any name)
- **Branch**: `main`
- **Root Directory**: Leave **EMPTY**

**Build Settings:**
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`

**Environment Variables:**
Add this variable to point to your backend:

```
VITE_API_URL=https://gyan-letter-app-backend.onrender.com
```

**Important**: Replace `gyan-letter-app-backend` with your actual backend service name!

### 2.3 Deploy Frontend

1. Click **"Create Static Site"**
2. Wait for build and deployment
3. Your app will be available at: `https://gyan-letter-app.onrender.com`

---

## Step 3: Update Frontend API Configuration

The frontend needs to know where the backend is. Update `src/services/api.js`:

```javascript
const getApiBaseUrl = () => {
  // In production, use environment variable or Render backend URL
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL || 'https://your-backend-name.onrender.com/api'
  }
  // In development, use localhost
  return import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
}
```

This should already be configured, but verify it uses `VITE_API_URL`.

---

## Step 4: Update Backend CORS

Make sure your backend allows requests from your frontend domain. Update `server.js`:

```javascript
app.use(cors({
  origin: [
    'https://gyan-letter-app.onrender.com',
    'http://localhost:3000' // for local development
  ],
  credentials: true
}))
```

---

## Step 5: Verify Deployment

### Backend Health Check:
Visit: `https://your-backend-name.onrender.com/api/health`
Should return: `{"status":"ok","database":"connected",...}`

### Frontend:
Visit: `https://your-app-name.onrender.com`
Should load your React app

### Test API from Frontend:
- Try uploading an Excel file
- Check if data is saved to database
- Verify all features work

---

## Environment Variables Summary

### Backend (Web Service):
```
DB_HOST=ep-flat-bird-afkh2n4z-pooler.c-2.us-west-2.aws.neon.tech
DB_USER=neondb_owner
DB_PASSWORD=npg_1c6KUGfSRJvw
DB_NAME=neondb
DB_PORT=5432
NODE_ENV=production
PORT=10000
```

### Frontend (Static Site):
```
VITE_API_URL=https://your-backend-name.onrender.com
```

---

## Troubleshooting

### Backend Issues:

**Build Fails:**
- Check build logs in Render dashboard
- Verify `package.json` has all dependencies
- Check Node.js version compatibility

**Database Connection Fails:**
- Verify environment variables are set correctly
- Check Neon database is accessible
- Verify SSL connection settings in `backend/db.js`

**Port Issues:**
- Render sets `PORT` automatically
- Make sure `server.js` uses `process.env.PORT || 5000`

### Frontend Issues:

**Build Fails:**
- Check build logs
- Verify `npm run build` works locally
- Check for missing dependencies

**API Calls Fail:**
- Verify `VITE_API_URL` is set correctly
- Check CORS settings in backend
- Verify backend URL is correct

**404 Errors:**
- Check `Publish Directory` is set to `dist`
- Verify build created `dist` folder
- Check for routing issues

---

## Render vs Vercel

**Render Advantages:**
- ✅ Simpler deployment process
- ✅ Better for Node.js backends
- ✅ Free tier available
- ✅ Automatic SSL certificates
- ✅ Easy environment variable management

**Render Free Tier:**
- Web services spin down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds
- Static sites are always on

---

## Next Steps

1. ✅ Deploy backend
2. ✅ Deploy frontend
3. ✅ Test all features
4. ✅ Set up custom domain (optional)
5. ✅ Configure auto-deploy from GitHub (enabled by default)

---

**Your app will be live on Render! 🎉**

