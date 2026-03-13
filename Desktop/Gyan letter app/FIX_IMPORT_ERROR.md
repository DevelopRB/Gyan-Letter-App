# Fix for Import Error

## Problem
The error `ERR_CONNECTION_REFUSED` on port 5000 means the **backend server is not running**.

## Solution

### Step 1: Start Backend Server
I've opened a new PowerShell window with the backend server starting.

**OR manually:**
```bash
npm run server
```

You should see:
```
Server running on http://localhost:5000
Database connection established
Database schema initialized successfully
```

### Step 2: Verify Backend is Running
Open in browser: http://localhost:5000/api/health

You should see:
```json
{"status":"ok","database":"connected","timestamp":"..."}
```

### Step 3: Try Importing Again
1. Go back to your application: http://localhost:3000
2. Navigate to Database section
3. Upload your Excel file
4. Click "Import All Records"

## Important Notes

- **Keep the backend server running** - Don't close the terminal window running `npm run server`
- **Frontend and Backend must both run** - You need TWO terminals:
  - Terminal 1: `npm run server` (Backend - port 5000)
  - Terminal 2: `npm run dev` (Frontend - port 3000)

## Quick Start Both Servers

Run this command to start both:
```powershell
.\start.ps1
```

Or manually:
```bash
# Terminal 1
npm run server

# Terminal 2  
npm run dev
```

## If Still Not Working

1. Check backend terminal for errors
2. Verify PostgreSQL is running
3. Check `.env` file has correct password
4. Verify database `gyan_letter_db` exists















