# Authentication Debugging Guide

## Current Issue
Authentication is not working on the deployed site: https://gyan-letter-app-1.onrender.com/

## Steps to Debug

### 1. Check Browser Console
Open the deployed site and press F12, then check the Console tab for:
- `[Auth Service] API Base URL:` - Should show the backend URL
- `[Auth Service] VITE_API_URL env:` - Should show the environment variable value
- `[AuthContext] Checking authentication` - Shows if token exists
- Any error messages

### 2. Check Network Tab
1. Open F12 → Network tab
2. Refresh the page
3. Look for requests to `/api/auth/verify`
4. Check:
   - Is the request being made?
   - What's the response status?
   - What's the response body?

### 3. Verify Environment Variables
In Render Dashboard for the **Frontend Static Site**:
- Go to Environment Variables
- Check if `VITE_API_URL` is set
- Value should be: `https://gyan-letter-app.onrender.com` (your backend URL)
- **Important**: This must be set BEFORE building, or rebuild after setting it

### 4. Test Backend Directly
Try accessing these URLs directly in your browser:
- `https://gyan-letter-app.onrender.com/api/auth/verify` (should return 401 without token)
- `https://gyan-letter-app.onrender.com/api/health` (should return status)

### 5. Clear Browser Storage
If you have an old token:
1. Open F12 → Application/Storage tab
2. Find Local Storage → your site URL
3. Delete `authToken`
4. Refresh the page

Or run in console:
```javascript
localStorage.removeItem('authToken')
location.reload()
```

### 6. Test Login
1. Go to `/login` page
2. Enter credentials: `admin` / `admin123`
3. Check Network tab for `/api/auth/login` request
4. Check if token is received
5. Check if redirect happens

## Common Issues

### Issue 1: VITE_API_URL Not Set
**Symptom**: Console shows `VITE_API_URL env: not set`
**Solution**: Set `VITE_API_URL` in Render frontend environment variables and rebuild

### Issue 2: CORS Error
**Symptom**: Network tab shows CORS error
**Solution**: Check backend CORS configuration in `server.js`

### Issue 3: Backend Not Accessible
**Symptom**: Network error or connection refused
**Solution**: Verify backend is running and accessible at the URL

### Issue 4: Old Token in Storage
**Symptom**: Page loads without login but shows errors
**Solution**: Clear localStorage as described above

## Expected Behavior

1. **First Visit (No Token)**:
   - Should redirect to `/login`
   - Should NOT show any protected content

2. **After Login**:
   - Should receive token
   - Should redirect to `/database`
   - Should show protected content

3. **On Refresh (With Valid Token)**:
   - Should verify token
   - If valid: Show content
   - If invalid: Clear token and redirect to `/login`

4. **On Refresh (With Invalid Token)**:
   - Should clear token
   - Should redirect to `/login`

## Current Credentials
- **Username**: `admin`
- **Password**: `admin123`

