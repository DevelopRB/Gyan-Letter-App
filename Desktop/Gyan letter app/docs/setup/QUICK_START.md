# Quick Start Guide

## Step 1: Create .env File

Create a file named `.env` in the root directory with this content:

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=gyan_letter_db
DB_PASSWORD=postgres
DB_PORT=5432
PORT=5000
```

**Important**: Change `DB_PASSWORD=postgres` to your actual PostgreSQL password!

## Step 2: Create PostgreSQL Database

Open PowerShell or Command Prompt and run:

```bash
psql -U postgres
```

Then in the PostgreSQL prompt, run:
```sql
CREATE DATABASE gyan_letter_db;
\q
```

Or use pgAdmin to create the database manually.

## Step 3: Start the Application

**Option A - Use the start script (Windows):**
```powershell
.\start.ps1
```

**Option B - Manual start (Two terminals):**

Terminal 1 (Backend):
```bash
npm run server
```

Terminal 2 (Frontend):
```bash
npm run dev
```

## Step 4: Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api/health

## Troubleshooting

### Database Connection Error
- Make sure PostgreSQL is running
- Check your password in `.env` file
- Verify database exists: `psql -U postgres -l` (should see gyan_letter_db)

### Port Already in Use
- Change PORT in `.env` for backend
- Kill the process using the port

### Module Errors
Run: `npm install`















