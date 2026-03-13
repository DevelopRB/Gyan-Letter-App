# 🚀 How to Start the Project

## Prerequisites

Before starting, make sure you have:
- ✅ **Node.js** installed (v16 or higher)
- ✅ **PostgreSQL** installed and running
- ✅ **npm** or **yarn** package manager

---

## Step-by-Step Instructions

### Step 1: Install Dependencies

Open PowerShell or Terminal in the project directory and run:

```bash
npm install
```

This will install all required packages (React, Express, PostgreSQL driver, etc.)

---

### Step 2: Configure Database

#### 2.1: Create PostgreSQL Database

Open PostgreSQL (using pgAdmin or psql) and create the database:

**Using psql:**
```bash
psql -U postgres
```

Then run:
```sql
CREATE DATABASE gyan_letter_db;
\q
```

**OR** use pgAdmin:
- Right-click on "Databases" → "Create" → "Database"
- Name: `gyan_letter_db`
- Click "Save"

#### 2.2: Configure .env File

The `.env` file should already exist in the project root. Open it and verify these settings:

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=gyan_letter_db
DB_PASSWORD=1234
DB_PORT=5432
PORT=5000
```

**⚠️ IMPORTANT:** Make sure `DB_PASSWORD` matches your PostgreSQL password!

---

### Step 3: Start the Servers

You need to run **TWO servers** simultaneously:

#### Option A: Automatic Start (Windows - Recommended)

Run this command in PowerShell:

```powershell
.\start.ps1
```

This will automatically open two separate PowerShell windows:
- One for the backend server (port 5000)
- One for the frontend server (port 5173)

#### Option B: Manual Start (Two Terminals)

**Terminal 1 - Backend Server:**
```bash
npm run server
```

You should see:
```
Server running on http://localhost:5000
✓ Database connection established
✓ Database schema initialized successfully
```

**Terminal 2 - Frontend Server:**
```bash
npm run dev
```

You should see:
```
VITE v5.x.x ready in xxx ms
➜ Local: http://localhost:5173/
```

---

### Step 4: Access the Application

Once both servers are running:

1. **Open your browser** and go to:
   - **Frontend**: `http://localhost:5173` (or the URL shown in the Vite output)
   - **Backend API**: `http://localhost:5000/api/health` (to verify backend is running)

2. **Verify Backend is Working:**
   - Visit: `http://localhost:5000/api/health`
   - You should see: `{"status":"ok","database":"connected","timestamp":"..."}`

3. **Start Using the App:**
   - Navigate to the Database section to upload Excel files
   - Use the Letter Editor to create personalized letters/emails

---

## Quick Reference

### Available Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install all dependencies |
| `npm run dev` | Start frontend development server |
| `npm run server` | Start backend server |
| `npm start` | Start both servers (Windows) |
| `npm run build` | Build for production |

### Server URLs

- **Frontend**: `http://localhost:5173` (Vite default port)
- **Backend**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/api/health`

---

## Troubleshooting

### ❌ "Connection Failed" Error

**Problem:** Frontend can't connect to backend

**Solutions:**
1. Make sure backend server is running (check Terminal 1)
2. Verify backend shows: `Server running on http://localhost:5000`
3. Check if port 5000 is available: `netstat -ano | findstr ":5000"`
4. Restart both servers

---

### ❌ Database Connection Error

**Problem:** Backend can't connect to PostgreSQL

**Solutions:**
1. **Check PostgreSQL is running:**
   - Windows: Open Services → Find "PostgreSQL" → Ensure it's "Running"
   - Or check: `Get-Service -Name "*postgresql*"`

2. **Verify .env file:**
   - Check `DB_PASSWORD` matches your PostgreSQL password
   - Verify `DB_NAME=gyan_letter_db` exists

3. **Test database connection:**
   ```bash
   psql -U postgres -d gyan_letter_db
   ```
   If this fails, check your PostgreSQL credentials

---

### ❌ Port Already in Use

**Problem:** Port 5000 or 5173 is already in use

**Solutions:**
1. **Find and kill the process:**
   ```powershell
   # Find process using port 5000
   netstat -ano | findstr ":5000"
   # Kill the process (replace PID with actual process ID)
   taskkill /PID <PID> /F
   ```

2. **OR change the port in .env:**
   ```env
   PORT=5001  # Change to any available port
   ```
   Then update `vite.config.js` proxy to match

---

### ❌ Module Not Found Errors

**Problem:** Missing dependencies

**Solution:**
```bash
npm install
```

---

### ❌ "Cannot find module" Error

**Problem:** Node modules not installed or corrupted

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

---

## Important Notes

1. **Keep Both Servers Running:** Don't close the terminal windows while using the app
2. **Database Auto-Creation:** Tables are created automatically on first run - no manual SQL needed
3. **Hot Reload:** Frontend changes update automatically (no need to refresh)
4. **Backend Restart:** If you change backend code, restart the backend server

---

## Next Steps After Starting

1. ✅ **Upload Data:** Go to Database section → Upload Excel file
2. ✅ **Preview Data:** Check uploaded records in the preview table
3. ✅ **Create Letters:** Use Letter Editor to create personalized letters
4. ✅ **Manage Categories:** Add/rename categories for organizing data
5. ✅ **Save Drafts:** Use draft feature to save letter templates

---

## Need More Help?

- See `QUICK_START.md` for condensed version
- See `TROUBLESHOOTING.md` for detailed error solutions
- See `SETUP.md` for complete setup guide

---

**🎉 You're all set! Happy coding!**














