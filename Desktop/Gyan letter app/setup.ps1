# PowerShell script to set up the Gyan Letter App
# Run this script to check prerequisites and set up the database

Write-Host "=== Gyan Letter App Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js $nodeVersion is installed" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js is not installed. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check if PostgreSQL is installed
Write-Host "Checking PostgreSQL..." -ForegroundColor Yellow
try {
    $psqlVersion = psql --version
    Write-Host "✓ PostgreSQL is installed" -ForegroundColor Green
} catch {
    Write-Host "✗ PostgreSQL is not installed or not in PATH" -ForegroundColor Red
    Write-Host "  Please install PostgreSQL from https://www.postgresql.org/download/" -ForegroundColor Yellow
    Write-Host "  Or ensure psql is in your PATH" -ForegroundColor Yellow
}

# Check if .env file exists
Write-Host "Checking .env file..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "✓ .env file exists" -ForegroundColor Green
} else {
    Write-Host "✗ .env file not found. Creating default .env file..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env" -ErrorAction SilentlyContinue
    if (Test-Path ".env") {
        Write-Host "✓ .env file created. Please update it with your database credentials." -ForegroundColor Green
    } else {
        Write-Host "  Please create a .env file manually." -ForegroundColor Yellow
    }
}

# Install dependencies
Write-Host ""
Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Make sure PostgreSQL is running" -ForegroundColor White
Write-Host "2. Create the database by running: psql -U postgres -f setup-database.sql" -ForegroundColor White
Write-Host "   Or manually: CREATE DATABASE gyan_letter_db;" -ForegroundColor White
Write-Host "3. Update .env file with your PostgreSQL password" -ForegroundColor White
Write-Host "4. Start the backend: npm run server" -ForegroundColor White
Write-Host "5. Start the frontend: npm run dev" -ForegroundColor White
Write-Host ""















