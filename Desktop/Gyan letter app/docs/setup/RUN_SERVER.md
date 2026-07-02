# How to Run the Server

## The Problem
You were running `npm run server` from the wrong directory (`C:\Users\abhis>`).

## The Solution

### Step 1: Navigate to Project Directory
```powershell
cd "C:\Users\abhis\Desktop\Gyan letter app"
```

### Step 2: Run the Server
```powershell
npm run server
```

## What You Should See

**If successful:**
```
Environment variables loaded from .env
DB_USER: postgres
DB_NAME: gyan_letter_db
DB_PASSWORD: ***
Server running on http://localhost:5000
Database connection established
Database schema initialized successfully
```

**If password error:**
- Update `.env` file with correct password
- Then run `npm run server` again

## Quick Commands

**Start Backend:**
```powershell
cd "C:\Users\abhis\Desktop\Gyan letter app"
npm run server
```

**Start Frontend (in another terminal):**
```powershell
cd "C:\Users\abhis\Desktop\Gyan letter app"
npm run dev
```

**Or use the start script:**
```powershell
cd "C:\Users\abhis\Desktop\Gyan letter app"
.\start.ps1
```

## Test if Server is Running

Open in browser: http://localhost:5000/api/health

Should see: `{"status":"ok","database":"connected"}`















