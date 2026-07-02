# Troubleshooting Import Error

## Common Issues and Solutions

### 1. Backend Server Not Running
**Symptom:** "Failed to import records" error

**Solution:**
- Make sure the backend server is running
- Check terminal for: `npm run server`
- Should see: "Server running on http://localhost:5000"
- Should see: "Database schema initialized successfully"

### 2. Database Connection Error
**Symptom:** Backend can't connect to PostgreSQL

**Solution:**
- Check PostgreSQL is running
- Verify `.env` file has correct password
- Test connection: `psql -U postgres -d gyan_letter_db`
- Check database exists: `psql -U postgres -l`

### 3. CORS Error
**Symptom:** Network error in browser console

**Solution:**
- Backend should have CORS enabled (already configured)
- Check browser console for CORS errors
- Make sure frontend is accessing `http://localhost:3000`

### 4. Data Format Error
**Symptom:** "Invalid records format" error

**Solution:**
- Check browser console for the actual error
- Verify Excel file has data
- Make sure preview shows records before importing

## Debug Steps

1. **Check Backend Logs:**
   - Look at the terminal running `npm run server`
   - Check for error messages

2. **Check Browser Console:**
   - Press F12 in browser
   - Go to Console tab
   - Look for error messages when importing

3. **Test API Directly:**
   - Open: http://localhost:5000/api/health
   - Should see: `{"status":"ok","database":"connected"}`

4. **Check Network Tab:**
   - Press F12 → Network tab
   - Try importing again
   - Click on the `/api/records/bulk` request
   - Check the response for error details

## Quick Fixes

### Restart Everything:
```bash
# Stop both servers (Ctrl+C)
# Then restart:
npm run server  # Terminal 1
npm run dev     # Terminal 2
```

### Check Database:
```sql
-- Connect to PostgreSQL
psql -U postgres -d gyan_letter_db

-- Check if table exists
\dt

-- Check records
SELECT COUNT(*) FROM records;
```

### Clear Browser Cache:
- Press Ctrl+Shift+Delete
- Clear cache and reload page















