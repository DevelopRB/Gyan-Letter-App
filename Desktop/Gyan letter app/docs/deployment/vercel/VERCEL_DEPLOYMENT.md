# 🚀 Vercel Deployment Guide

This guide will help you deploy your Gyan Letter App to Vercel so your team can use it.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com) (free tier is sufficient)
2. **GitHub Account**: Your code needs to be in a Git repository (GitHub recommended)
3. **Cloud PostgreSQL Database**: You'll need a cloud database (we'll use Neon, Supabase, or Railway)

---

## Step 1: Set Up Cloud PostgreSQL Database ⚠️ IMPORTANT

**You cannot use your local PostgreSQL database with Vercel!** Vercel serverless functions run in the cloud and cannot access `localhost`. You **must** set up a cloud PostgreSQL database.

📖 **See `CLOUD_DATABASE_SETUP.md` for detailed instructions on setting up a cloud database.**

Choose one of these cloud database providers:

### Option A: Neon (Recommended - Free Tier Available)
1. Go to [neon.tech](https://neon.tech)
2. Sign up and create a new project
3. Copy your connection string (it will look like: `postgresql://user:password@host/database?sslmode=require`)
4. Save this for later

### Option B: Supabase (Free Tier Available)
1. Go to [supabase.com](https://supabase.com)
2. Sign up and create a new project
3. Go to Settings → Database
4. Copy your connection string
5. Save this for later

### Option C: Railway (Free Tier Available)
1. Go to [railway.app](https://railway.app)
2. Sign up and create a new project
3. Add PostgreSQL service
4. Copy your connection string
5. Save this for later

---

## Step 2: Prepare Your Code for Git

1. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create `.gitignore`** (if not exists):
   ```
   node_modules/
   .env
   .env.local
   dist/
   .vercel
   *.log
   .DS_Store
   ```

3. **Push to GitHub**:
   - Create a new repository on GitHub
   - Push your code:
     ```bash
     git remote add origin https://github.com/yourusername/gyan-letter-app.git
     git branch -M main
     git push -u origin main
     ```

---

## Step 3: Update API Configuration

The frontend needs to know where the API is. We'll update it to work with Vercel.

### Update `src/services/api.js`:

The API base URL will be automatically set based on environment:
- Development: `http://localhost:5000`
- Production: Your Vercel URL (e.g., `https://your-app.vercel.app`)

---

## Step 4: Deploy to Vercel

### Method 1: Using Vercel CLI (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```
   - Follow the prompts
   - When asked about environment variables, skip for now (we'll add them in the dashboard)

4. **Add Environment Variables**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Select your project
   - Go to Settings → Environment Variables
   - Add these variables (use your Neon credentials):
     ```
     DB_HOST=ep-flat-bird-afkh2n4z-pooler.c-2.us-west-2.aws.neon.tech
     DB_USER=neondb_owner
     DB_PASSWORD=npg_1c6KUGfSRJvw
     DB_NAME=neondb
     DB_PORT=5432
     PORT=5000
     NODE_ENV=production
     ```
   - **Important**: Make sure to select "Production", "Preview", and "Development" for each variable
   - Click "Save" after adding each variable

5. **Redeploy**:
   ```bash
   vercel --prod
   ```

### Method 2: Using Vercel Dashboard (Easier)

1. **Go to Vercel Dashboard**:
   - Visit [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"
   - Select your GitHub repository

2. **Configure Project**:
   - Framework Preset: **Other** or **Vite**
   - Root Directory: `./` (leave as is - **IMPORTANT: Make sure this is set correctly**)
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
   
   **⚠️ Important**: If you see "package.json not found" error:
   - Make sure "Root Directory" is set to `./` (current directory)
   - Or leave it empty (defaults to root)
   - Do NOT set it to a subdirectory

3. **Add Environment Variables**:
   - Before deploying, click "Environment Variables"
   - Add all the variables from your `.env` file:
     ```
     DB_HOST=your-database-host
     DB_USER=your-database-user
     DB_PASSWORD=your-database-password
     DB_NAME=your-database-name
     DB_PORT=5432
     PORT=5000
     NODE_ENV=production
     ```

4. **Deploy**:
   - Click "Deploy"
   - Wait for deployment to complete

---

## Step 5: Update Server Configuration

We need to make sure the server works as a Vercel serverless function. The `vercel.json` file is already configured, but we need to ensure the server exports properly.

---

## Step 6: Test Your Deployment

1. **Visit your Vercel URL**: `https://your-app.vercel.app`
2. **Test the application**:
   - Try uploading an Excel file
   - Create a letter template
   - Generate PDFs

---

## Step 7: Share with Your Team

1. **Share the URL**: Give your team the Vercel deployment URL
2. **Set up team access** (optional):
   - Go to Project Settings → Team
   - Invite team members

---

## Troubleshooting

### Database Connection Issues

If you see database connection errors:

1. **Check Environment Variables**:
   - Make sure all DB_* variables are set correctly
   - Use the full connection string format if your provider requires it

2. **Check Database Access**:
   - Ensure your database allows connections from Vercel's IPs
   - Some providers require IP whitelisting (Vercel IPs change, so use 0.0.0.0/0 if allowed)

3. **SSL Connection**:
   - Most cloud databases require SSL
   - Add `?sslmode=require` to your connection string if needed

### Build Errors

1. **Check Build Logs**:
   - Go to Vercel Dashboard → Deployments
   - Click on failed deployment to see logs

2. **Common Issues**:
   - Missing dependencies: Check `package.json`
   - Build command errors: Verify `npm run build` works locally

### API Not Working

1. **Check API Routes**:
   - Visit `https://your-app.vercel.app/api/health`
   - Should return a health check response

2. **Check CORS**:
   - The server already has CORS enabled
   - If issues persist, check the CORS configuration

---

## Environment Variables Reference

Here's what you need to set in Vercel:

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | Database host | `ep-xxx.us-east-1.aws.neon.tech` |
| `DB_USER` | Database user | `neondb` |
| `DB_PASSWORD` | Database password | `your-password` |
| `DB_NAME` | Database name | `neondb` |
| `DB_PORT` | Database port | `5432` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `production` |

---

## Updating Your Deployment

Whenever you make changes:

1. **Commit and push to GitHub**:
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```

2. **Vercel will auto-deploy** (if connected to GitHub)
   - Or manually deploy: `vercel --prod`

---

## Cost

- **Vercel**: Free tier includes:
  - 100GB bandwidth/month
  - Unlimited deployments
  - Team collaboration
  
- **Database**: 
  - Neon: Free tier (0.5GB storage)
  - Supabase: Free tier (500MB database)
  - Railway: $5/month (after free trial)

---

## Need Help?

- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- Vercel Support: [vercel.com/support](https://vercel.com/support)

---

## Quick Checklist

- [ ] Cloud PostgreSQL database set up
- [ ] Code pushed to GitHub
- [ ] Vercel account created
- [ ] Project imported to Vercel
- [ ] Environment variables added
- [ ] Deployment successful
- [ ] Application tested
- [ ] Team access configured

---

**Congratulations! Your app is now live and accessible to your team! 🎉**

