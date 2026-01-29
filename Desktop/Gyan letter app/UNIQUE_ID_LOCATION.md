# Where is the Unique ID Located?

## Summary
The Unique ID feature has been implemented and will appear in the following locations:

## 1. **In the Records Table (Main View)**
   - **Location**: First column in the table
   - **Format**: `GB-01`, `GB-02`, `GB-03`, etc.
   - **When it appears**: 
     - Automatically generated when you add a new record (manual or Excel upload)
     - Only visible if records have been created AFTER the feature was implemented
     - Existing records created before this feature won't have Unique IDs unless you edit them

## 2. **In the Search Bar**
   - **Location**: Top search bar
   - **How to use**: Type part of the Unique ID (e.g., "GB-01", "GB-0", "01")
   - **Behavior**: Search prioritizes Unique ID matches

## 3. **Backend Generation**
   - **Location**: `backend/routes/records.js`
   - **Function**: `getNextUniqueId()`
   - **When it runs**: 
     - Automatically when creating a single record via POST `/api/records`
     - Automatically when bulk importing via POST `/api/records/bulk`

## 4. **In the Database**
   - **Field Name**: `Unique ID` (stored in the `data` JSONB column)
   - **Format**: `GB-XX` where XX is zero-padded (01, 02, ..., 99, 100, etc.)

## How to See Unique IDs

### Option 1: Add a New Record
1. Click "Add Record" button
2. Fill in the form
3. Click "Save"
4. The new record will have a Unique ID (e.g., GB-01)
5. It will appear as the **first column** in the table

### Option 2: Upload Excel File
1. Upload an Excel file
2. Import the records
3. Each record will get a sequential Unique ID
4. All IDs will appear in the table

### Option 3: Check Existing Records
- If you have existing records without Unique IDs, they won't show the field
- Only newly created records will have Unique IDs
- You can edit an existing record to trigger ID generation (if the field is empty)

## Code Locations

### Backend (`backend/routes/records.js`)
- Line 7-40: `getNextUniqueId()` function
- Line 98-99: Auto-generates ID for single record creation
- Line 167-169: Auto-generates sequential IDs for bulk import
- Line 53: Search prioritizes Unique ID field

### Frontend (`src/components/DatabaseManager.jsx`)
- Line 1220-1225: Ensures Unique ID appears as first column
- Line 185-188: Search prioritizes Unique ID matches
- Line 2723-2734: Table header displays all fields (Unique ID first)
- Line 2745-2755: Table cells display Unique ID values

## Testing

To verify Unique IDs are working:

1. **Start the server**: `npm run server`
2. **Start the frontend**: `npm run dev`
3. **Add a test record**:
   - Click "Add Record"
   - Fill in at least one field
   - Click "Save"
   - Check the table - you should see "GB-01" in the first column
4. **Add another record**:
   - Should get "GB-02"
5. **Search by ID**:
   - Type "GB-01" in search bar
   - Should find the first record

## Notes

- Unique IDs are **read-only** in the UI (generated automatically)
- If you manually edit a record and clear the Unique ID field, it will be regenerated on save
- IDs are sequential and continue from the highest existing ID
- Format is always `GB-XX` with zero-padding
