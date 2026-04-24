# Gyan Letter App

Gyan Letter App is a full-stack web app for managing database records and creating personalized letters/emails from those records.

## What It Does

- Manage records in PostgreSQL (create, update, search, delete, bulk import)
- Import Excel/CSV data and save it in JSON-based records
- Auto-generate sequential `Unique ID` values (format: `GB-01`, `GB-02`, ...)
- Build letter/email content with placeholders such as `{{Full Name}}`
- Protect the app behind login and JWT-based session verification
- Export a CRM template CSV from the backend

## Tech Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- Database: PostgreSQL
- Auth: JSON Web Token (`jsonwebtoken`)
- Data processing: `xlsx`

## Prerequisites

- Node.js 18+ recommended
- PostgreSQL 12+
- npm

## Setup

### 1) Install dependencies

```bash
npm install
```

### 2) Create database

```sql
CREATE DATABASE gyan_letter_db;
```

### 3) Configure environment

Create `.env` in the project root:

```env
# Database
DB_USER=postgres
DB_HOST=localhost
DB_NAME=gyan_letter_db
DB_PASSWORD=your_password
DB_PORT=5432

# Backend
PORT=5000
FRONTEND_URL=http://localhost:3000
JWT_SECRET=change-this-in-production

# Login credentials (optional overrides)
APP_USERNAME=admin
APP_PASSWORD=admin123

# Frontend (optional for deployed setups)
VITE_API_URL=
```

## Run Locally

### Option A: Start both services manually (recommended)

Terminal 1 (backend):

```bash
npm run server
```

Terminal 2 (frontend):

```bash
npm run dev -- --host 0.0.0.0 --port 3000
```

### Option B: Use the helper script

```bash
npm run start
```

This opens backend and frontend in separate PowerShell windows.

## Local URLs

- Frontend: `http://localhost:3000/`
- Backend: `http://localhost:5000/`
- Health check: `http://localhost:5000/api/health`

## Available Scripts

- `npm run dev` - Start Vite frontend
- `npm run build` - Build frontend for production
- `npm run preview` - Preview production frontend build
- `npm run server` - Start Express backend
- `npm run dev:server` - Start backend with Node watch mode
- `npm run setup` - Run setup script
- `npm run start` - Run PowerShell starter for both servers

## API Endpoints

### Auth

- `POST /api/auth/login` - Login with username/password
- `GET /api/auth/verify` - Verify JWT token

### Records

- `GET /api/records` - List records (supports `?search=...`)
- `GET /api/records/:id` - Get one record
- `POST /api/records` - Create record
- `POST /api/records/bulk` - Bulk import records
- `PUT /api/records/:id` - Update record
- `DELETE /api/records/:id` - Delete one record
- `DELETE /api/records` - Delete all records

### Utility

- `GET /api/health` - API/database health status
- `GET /api/template-download` - Download CRM template CSV

## Project Structure

```text
gyan-letter-app/
├── api/                       # Serverless handlers (deployment targets)
├── backend/
│   ├── db.js                  # PostgreSQL pool + schema initialization
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── records.js
│   └── services/
├── src/
│   ├── components/
│   ├── contexts/
│   ├── services/
│   ├── App.jsx
│   └── main.jsx
├── server.js                  # Main Express entrypoint
├── start.ps1                  # Windows helper script
└── package.json
```

## Authentication Notes

- Default login: `admin` / `admin123` (unless overridden via `.env`)
- Token is validated at `/api/auth/verify`
- For production, always set strong values for `JWT_SECRET` and credentials

## Troubleshooting

### Backend starts but frontend cannot fetch API

- Confirm backend is running on `http://localhost:5000`
- Confirm frontend is running on `http://localhost:3000`
- If needed, set `VITE_API_URL=http://localhost:5000` in `.env`

### PostgreSQL connection errors

- Ensure PostgreSQL service is running
- Recheck `DB_*` values in `.env`
- Verify database exists and user has access

### Port conflict

- Change `PORT` for backend in `.env`
- Start frontend on a different port if `3000` is occupied

## License

MIT
