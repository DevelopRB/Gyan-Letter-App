# ☁️ Cloud PostgreSQL Database Setup Guide

Since Vercel serverless functions cannot access your local PostgreSQL database, you need to set up a cloud database. This guide will help you choose and set up a cloud PostgreSQL service.

## Why Cloud Database?

- **Vercel serverless functions** run in the cloud and cannot access `localhost`
- Your **local PostgreSQL** is only accessible from your computer
- **Cloud databases** are accessible from anywhere on the internet

---

## Recommended Options (All have Free Tiers)

### Option 1: Neon (Recommended - Easiest Setup) ⭐

**Free Tier:**
- 0.5GB storage
- Unlimited projects
- Auto-scaling
- Branching (like Git for databases)

**Setup Steps:**

1. **Sign Up**: Go to [neon.tech](https://neon.tech) and sign up (free)

2. **Create Project**:
   - Click "Create Project"
   - Name: `gyan-letter-app`
   - Region: Choose closest to you (e.g., `US East`)
   - PostgreSQL version: `15` or `16` (recommended)
   - Click "Create Project"

3. **Get Connection String**:
   - After project creation, you'll see a connection string like:
     ```
     postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
     ```
   - Copy this connection string

4. **Extract Credentials**:
   From the connection string: `postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require`
   - `USER` = Database user
   - `PASSWORD` = Database password
   - `HOST` = Database host (e.g., `ep-xxx.us-east-1.aws.neon.tech`)
   - `DATABASE` = Database name (usually `neondb`)

5. **Use in Vercel**:
   - Add these as environment variables in Vercel:
     ```
     DB_HOST=ep-xxx.us-east-1.aws.neon.tech
     DB_USER=your-username
     DB_PASSWORD=your-password
     DB_NAME=neondb
     DB_PORT=5432
     ```

---

### Option 2: Supabase (Great for Teams)

**Free Tier:**
- 500MB database
- 2GB bandwidth
- Unlimited API requests

**Setup Steps:**

1. **Sign Up**: Go to [supabase.com](https://supabase.com) and sign up

2. **Create Project**:
   - Click "New Project"
   - Name: `gyan-letter-app`
   - Database Password: Create a strong password (save it!)
   - Region: Choose closest to you
   - Click "Create new project"

3. **Get Connection String**:
   - Go to Settings → Database
   - Scroll to "Connection string"
   - Copy the "URI" connection string
   - Format: `postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`

4. **Extract Credentials**:
   - `HOST` = `db.xxx.supabase.co`
   - `USER` = `postgres`
   - `PASSWORD` = The password you created
   - `DATABASE` = `postgres`
   - `PORT` = `5432`

---

### Option 3: Railway (Simple & Fast)

**Free Tier:**
- $5 credit/month (enough for small projects)
- Easy setup

**Setup Steps:**

1. **Sign Up**: Go to [railway.app](https://railway.app) and sign up

2. **Create Project**:
   - Click "New Project"
   - Select "Provision PostgreSQL"
   - Wait for database to be created

3. **Get Connection String**:
   - Click on the PostgreSQL service
   - Go to "Variables" tab
   - Copy the `DATABASE_URL` connection string

4. **Extract Credentials**:
   - Parse the connection string to get individual values
   - Or use the connection string directly in your code

---

## Migrating Data from Local to Cloud

If you have existing data in your local PostgreSQL, here's how to migrate it:

### Method 1: Using pg_dump (Recommended)

1. **Export from Local Database**:
   ```bash
   pg_dump -h localhost -U postgres -d gyan_letter_db > backup.sql
   ```
   (Enter your local PostgreSQL password when prompted)

2. **Import to Cloud Database**:
   ```bash
   psql -h YOUR_CLOUD_HOST -U YOUR_CLOUD_USER -d YOUR_CLOUD_DB -f backup.sql
   ```
   Or use the connection string:
   ```bash
   psql "postgresql://user:password@host/database?sslmode=require" < backup.sql
   ```

### Method 2: Using pgAdmin

1. **Export from Local**:
   - Open pgAdmin
   - Right-click your database → Backup
   - Save as `.backup` file

2. **Import to Cloud**:
   - Connect to cloud database in pgAdmin
   - Right-click database → Restore
   - Select your `.backup` file

### Method 3: Export/Import via Application

1. **Export from Local**:
   - Use your application's export feature
   - Export data as Excel/CSV

2. **Import to Cloud**:
   - Deploy application with cloud database
   - Use the import feature to upload data

---

## Quick Setup Script

After setting up your cloud database, update your `.env` file locally to test:

```env
# Cloud Database (for Vercel deployment)
DB_HOST=your-cloud-host
DB_USER=your-cloud-user
DB_PASSWORD=your-cloud-password
DB_NAME=your-cloud-database
DB_PORT=5432

# Local Database (for local development - keep this)
# DB_HOST=localhost
# DB_USER=postgres
# DB_PASSWORD=1234
# DB_NAME=gyan_letter_db
# DB_PORT=5432
```

**Note**: You can keep both - use local for development and cloud for production!

---

## Testing Cloud Database Connection

Test your cloud database connection locally:

```bash
# Using psql
psql "postgresql://user:password@host/database?sslmode=require"

# Or test with Node.js
node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: 'postgresql://user:password@host/database?sslmode=require' }); pool.query('SELECT NOW()').then(r => console.log('Connected!', r.rows[0])).catch(e => console.error('Error:', e));"
```

---

## Security Best Practices

1. **Never commit credentials** to Git
2. **Use environment variables** in Vercel
3. **Enable SSL** (most cloud providers require it)
4. **Use strong passwords**
5. **Restrict IP access** if possible (though Vercel IPs change)

---

## Cost Comparison

| Service | Free Tier | Paid Plans |
|---------|-----------|------------|
| **Neon** | 0.5GB storage | $19/month for 10GB |
| **Supabase** | 500MB database | $25/month for 8GB |
| **Railway** | $5 credit/month | Pay-as-you-go |

For most projects, the **free tier is sufficient** to start!

---

## Need Help?

- **Neon Docs**: [neon.tech/docs](https://neon.tech/docs)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Railway Docs**: [docs.railway.app](https://docs.railway.app)

---

## Next Steps

1. ✅ Choose a cloud database provider
2. ✅ Set up your cloud database
3. ✅ Get connection credentials
4. ✅ Test connection locally (optional)
5. ✅ Add credentials to Vercel environment variables
6. ✅ Deploy to Vercel
7. ✅ Migrate data from local to cloud (if needed)

**Once your cloud database is set up, you can deploy to Vercel!** 🚀














