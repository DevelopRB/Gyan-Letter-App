# Setup Guide

## Quick Start

### 1. Install PostgreSQL

If you don't have PostgreSQL installed:
- **Windows**: Download from https://www.postgresql.org/download/windows/
- **Mac**: `brew install postgresql` or download from https://www.postgresql.org/download/macosx/
- **Linux**: `sudo apt-get install postgresql` (Ubuntu/Debian)

### 2. Create Database

Open PostgreSQL command line or pgAdmin and run:

```sql
CREATE DATABASE gyan_letter_db;
```

### 3. Configure Environment

Create a `.env` file in the root directory:

```env
# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=gyan_letter_db
DB_PASSWORD=your_postgres_password
DB_PORT=5432

# Server Configuration
PORT=5000
```

**Important**: Replace `your_postgres_password` with your actual PostgreSQL password.

### 4. Install Dependencies

```bash
npm install
```

### 5. Start the Application

**Terminal 1 - Backend Server:**
```bash
npm run server
```

**Terminal 2 - Frontend Dev Server:**
```bash
npm run dev
```

### 6. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Troubleshooting

### Database Connection Error

If you see "Failed to connect to database":
1. Check if PostgreSQL is running
2. Verify database credentials in `.env`
3. Ensure database exists: `CREATE DATABASE gyan_letter_db;`
4. Check PostgreSQL is listening on the correct port (default: 5432)

### Port Already in Use

If port 5000 or 3000 is already in use:
- Change `PORT` in `.env` for backend
- Change port in `vite.config.js` for frontend

### Module Not Found Errors

Run:
```bash
npm install
```

## Database Schema

The application automatically creates the following table on first run:

```sql
CREATE TABLE records (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

The `data` column stores all record fields as JSON, allowing for flexible schema.















