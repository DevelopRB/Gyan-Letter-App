# How to Check Data in PostgreSQL

## Quick Methods to View Your Data

### Method 1: Using psql Command Line (Recommended)

#### Step 1: Connect to PostgreSQL
```bash
psql -U postgres -d gyan_letter_db
```
When prompted, enter your password: `1234`

#### Step 2: View All Records
```sql
-- Count total records
SELECT COUNT(*) FROM records;

-- View all records (limit to first 10)
SELECT id, data, created_at, updated_at FROM records LIMIT 10;

-- View all records with formatted JSON
SELECT id, data::text, created_at FROM records LIMIT 10;
```

#### Step 3: View Specific Fields from JSON Data
```sql
-- View specific fields from JSONB data
SELECT 
    id,
    data->>'name' as name,
    data->>'email' as email,
    data->>'address' as address,
    created_at
FROM records
LIMIT 10;
```

#### Step 4: Search Records
```sql
-- Search by field value
SELECT * FROM records 
WHERE data->>'name' ILIKE '%John%';

-- Search in all JSON fields
SELECT * FROM records 
WHERE data::text ILIKE '%search_term%';
```

#### Step 5: View Table Structure
```sql
-- View table structure
\d records

-- View all tables
\dt

-- View table with details
\d+ records
```

#### Step 6: Export Data
```sql
-- Export to CSV
\copy (SELECT id, data::text, created_at FROM records) TO 'C:/temp/export.csv' CSV HEADER;

-- Or use COPY command
COPY (SELECT id, data::text, created_at FROM records) TO 'C:/temp/export.csv' CSV HEADER;
```

#### Step 7: Exit psql
```sql
\q
```

---

### Method 2: Using pgAdmin (GUI Tool)

#### Step 1: Open pgAdmin
- Launch pgAdmin from Start Menu
- Connect to your PostgreSQL server (password: 1234)

#### Step 2: Navigate to Database
1. Expand **Servers** → **PostgreSQL** → **Databases**
2. Expand **gyan_letter_db**
3. Expand **Schemas** → **public** → **Tables**
4. Right-click on **records** table

#### Step 3: View Data
- **View/Edit Data** → **All Rows** - See all records
- **View/Edit Data** → **First 100 Rows** - See first 100 records
- **View/Edit Data** → **Filtered Rows** - Apply filters

#### Step 4: Query Tool
1. Right-click **records** → **Query Tool**
2. Enter SQL queries:
```sql
SELECT COUNT(*) FROM records;
SELECT * FROM records LIMIT 10;
SELECT id, data->>'name' as name FROM records;
```

---

### Method 3: Using SQL Queries (Most Useful)

#### Basic Queries

```sql
-- Total record count
SELECT COUNT(*) as total_records FROM records;

-- View first 10 records
SELECT id, data, created_at FROM records ORDER BY created_at DESC LIMIT 10;

-- View records created today
SELECT COUNT(*) FROM records 
WHERE DATE(created_at) = CURRENT_DATE;

-- View records by date range
SELECT COUNT(*) FROM records 
WHERE created_at BETWEEN '2025-12-01' AND '2025-12-31';

-- View all unique field names in JSON data
SELECT DISTINCT jsonb_object_keys(data) as field_name 
FROM records 
ORDER BY field_name;
```

#### Advanced Queries

```sql
-- Extract specific fields from JSON
SELECT 
    id,
    data->>'name' as name,
    data->>'email' as email,
    data->>'phone' as phone,
    created_at
FROM records
WHERE data->>'name' IS NOT NULL
ORDER BY created_at DESC
LIMIT 20;

-- Count records by a specific field value
SELECT 
    data->>'department' as department,
    COUNT(*) as count
FROM records
GROUP BY data->>'department'
ORDER BY count DESC;

-- Find records with missing fields
SELECT id, data 
FROM records 
WHERE data->>'email' IS NULL OR data->>'email' = '';

-- View largest JSON objects (by size)
SELECT 
    id,
    length(data::text) as json_size,
    created_at
FROM records
ORDER BY json_size DESC
LIMIT 10;
```

---

### Method 4: Check Import Logs

#### In Backend Server Console
When you import data, you'll see detailed logs like:
```
=== BULK IMPORT STARTED ===
📥 Received 4353 records to import
⏰ Start time: 2025-12-11T07:30:00.000Z
🔄 Starting database transaction...
📊 Processing 4353 records in batches...
  ✓ Processed 100/4353 records (2.3%)
  ✓ Processed 200/4353 records (4.6%)
  ...
✅ Successfully imported: 4353 records
⏱️  Total time: 12.45 seconds
📈 Average: 349.64 records/second
```

#### In Browser Console (F12)
You'll see:
```
=== FRONTEND: Starting Import ===
📊 Records to import: 4353
✅ Successfully imported: 4353 records
⏱️  Total time: 12.45 seconds
```

---

## Quick Reference Commands

### Connect to Database
```bash
psql -U postgres -d gyan_letter_db
```

### Most Useful Queries
```sql
-- Count records
SELECT COUNT(*) FROM records;

-- View recent records
SELECT id, data, created_at FROM records ORDER BY created_at DESC LIMIT 10;

-- View specific field
SELECT id, data->>'name' as name FROM records LIMIT 10;

-- Search
SELECT * FROM records WHERE data::text ILIKE '%search%';
```

### Exit psql
```sql
\q
```

---

## Troubleshooting

### Can't Connect?
- Make sure PostgreSQL is running
- Check password is correct (1234)
- Verify database exists: `psql -U postgres -l`

### Can't See Data?
- Check if import was successful (look at backend logs)
- Verify table exists: `\dt` in psql
- Check if records exist: `SELECT COUNT(*) FROM records;`

### JSON Data Looks Weird?
- Use `data::text` to see formatted JSON
- Use `data->>'field_name'` to extract specific fields
- Use `jsonb_pretty(data)` for pretty formatting

---

## Example: View Your Imported Data

```sql
-- Connect
psql -U postgres -d gyan_letter_db

-- Check total records
SELECT COUNT(*) FROM records;

-- View first 5 records with all fields
SELECT id, data, created_at FROM records LIMIT 5;

-- View specific fields (adjust field names based on your Excel columns)
SELECT 
    id,
    data->>'name' as name,
    data->>'email' as email,
    created_at
FROM records
LIMIT 10;

-- Exit
\q
```

---

**Tip:** Keep the backend server console open to see real-time import logs!















