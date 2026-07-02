# Alternative Ways to Check Your Data

Since `psql` is not in your PATH, here are easier alternatives:

## Method 1: Use pgAdmin (Easiest - GUI)

### Steps:
1. **Open pgAdmin** from Start Menu
2. **Connect** to PostgreSQL server (password: 1234)
3. **Navigate**: 
   - Servers → PostgreSQL → Databases → gyan_letter_db
   - Schemas → public → Tables → records
4. **Right-click** on `records` table
5. **Select**: "View/Edit Data" → "All Rows"

### Query Tool in pgAdmin:
1. Right-click `records` → "Query Tool"
2. Enter SQL:
```sql
SELECT COUNT(*) FROM records;
SELECT * FROM records LIMIT 10;
SELECT id, data->>'name' as name FROM records LIMIT 10;
```

---

## Method 2: Use Backend API (Easiest - Browser)

### View All Records:
Open in browser: **http://localhost:5000/api/records**

This shows all records as JSON. You can:
- See total count
- View all data
- Copy JSON for analysis

### View Single Record:
**http://localhost:5000/api/records/1** (replace 1 with record ID)

### Health Check:
**http://localhost:5000/api/health**

---

## Method 3: Add PostgreSQL to PATH

### Find PostgreSQL:
1. Look in: `C:\Program Files\PostgreSQL\`
2. Find version folder (e.g., `15`, `16`)
3. Note the `bin` folder path

### Add to PATH:
1. Press `Win + X` → System → Advanced system settings
2. Click "Environment Variables"
3. Under "System variables", find "Path" → Edit
4. Click "New" → Add: `C:\Program Files\PostgreSQL\16\bin` (adjust version)
5. Click OK on all dialogs
6. Restart PowerShell

### Then use:
```bash
psql -U postgres -d gyan_letter_db
```

---

## Method 4: Use Full Path (Quick Fix)

Find PostgreSQL bin folder, then use full path:

```powershell
# Example (adjust version number):
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d gyan_letter_db
```

---

## Method 5: Check via Application UI

1. Go to: **http://localhost:3000**
2. Click **"Database"** in navigation
3. All imported records are displayed in the table
4. Use search/filter to find specific records

---

## Quick SQL Queries (if you get psql working)

```sql
-- Count records
SELECT COUNT(*) FROM records;

-- View first 10
SELECT id, data, created_at FROM records LIMIT 10;

-- View specific fields
SELECT id, data->>'name' as name, data->>'email' as email FROM records LIMIT 10;

-- Search
SELECT * FROM records WHERE data::text ILIKE '%search%';
```

---

## Recommended: Use pgAdmin or Browser API

**Easiest**: Use **http://localhost:5000/api/records** in browser
**Best for queries**: Use **pgAdmin** GUI tool















