# Unique ID Feature Implementation

## Overview
Each record in the database now automatically gets assigned a unique ID in the format `GB-01`, `GB-02`, `GB-03`, etc. This ID is:
- Auto-generated when records are added (manual or Excel upload)
- Searchable in the search bar
- Displayed as the first column in the records table
- Sequential and unique across all records

## Implementation Details

### Backend Changes (`backend/routes/records.js`)

1. **`getNextUniqueId()` Function**:
   - Queries the database to find the highest existing ID
   - Increments the number and returns the next ID (e.g., if last is GB-05, returns GB-06)
   - Handles edge cases (no records, invalid formats)
   - Format: `GB-XX` where XX is zero-padded (01, 02, ..., 99, 100, etc.)

2. **POST `/records` (Single Record)**:
   - Automatically generates a Unique ID if not provided
   - Only generates if the field is missing or empty

3. **POST `/records/bulk` (Excel Import)**:
   - Gets the starting ID number before bulk import
   - Generates sequential IDs for all records in the batch
   - Ensures no ID conflicts during bulk operations

4. **GET `/records` (Search)**:
   - Enhanced search to prioritize Unique ID field
   - Searches both Unique ID and all other fields

### Frontend Changes (`src/components/DatabaseManager.jsx`)

1. **Field Display**:
   - `getFieldNames()` function updated to always show "Unique ID" as the first column
   - Table automatically displays Unique ID when records are loaded

2. **Search Functionality**:
   - Search prioritizes Unique ID matches
   - Users can search by typing part of the ID (e.g., "GB-01", "GB-0", "01")
   - Also searches all other fields as before

## Usage

### Adding Manual Records
1. Click "Add Record"
2. Fill in the form fields
3. Click "Save"
4. The record will automatically get a Unique ID (e.g., GB-01)

### Uploading Excel Files
1. Upload an Excel file
2. Preview the data
3. Click "Import All Records"
4. Each record will automatically get a sequential Unique ID (GB-01, GB-02, GB-03, etc.)

### Searching by Unique ID
1. Type the Unique ID (or part of it) in the search bar
2. Records matching the ID will be displayed
3. Example searches:
   - "GB-01" - finds exact match
   - "GB-0" - finds GB-01, GB-02, GB-03, etc.
   - "01" - finds any record with "01" in Unique ID

## Testing

### Test 1: Manual Record Addition
1. Start the server: `npm run server`
2. Start the frontend: `npm run dev`
3. Navigate to the database page
4. Click "Add Record"
5. Fill in at least one field
6. Click "Save"
7. Verify the record has a Unique ID (GB-01)

### Test 2: Excel Upload
1. Prepare an Excel file with multiple rows
2. Upload the file
3. Preview and import
4. Verify each record has sequential Unique IDs (GB-01, GB-02, GB-03, etc.)

### Test 3: Search by Unique ID
1. Use the search bar
2. Type "GB-01" or "GB-0"
3. Verify the correct records are displayed

### Test 4: Multiple Additions
1. Add a record manually (should get GB-01)
2. Add another record manually (should get GB-02)
3. Upload Excel with 3 records (should get GB-03, GB-04, GB-05)
4. Verify all IDs are sequential and unique

## Notes

- Unique IDs are generated automatically - users don't need to provide them
- If a record already has a Unique ID, it won't be overwritten
- IDs are sequential and continue from the highest existing ID
- The format is always `GB-XX` where XX is zero-padded
- Unique ID appears as the first column in the table for easy reference
