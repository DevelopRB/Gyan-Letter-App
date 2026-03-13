-- Database setup script for Gyan Letter App
-- Run this in PostgreSQL to create the database

-- Create database (run this as postgres superuser)
CREATE DATABASE gyan_letter_db;

-- Connect to the database and run the following:
\c gyan_letter_db

-- The application will automatically create the tables on first run
-- But you can also create them manually if needed:

CREATE TABLE IF NOT EXISTS records (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_records_data_gin ON records USING GIN (data);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_records_updated_at ON records;
CREATE TRIGGER update_records_updated_at
BEFORE UPDATE ON records
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();















