# Troubleshooting University Auto-fill Dropdown

## Issue
Dropdown doesn't appear when typing in "Organization Name" field.

## Debugging Steps

### 1. Check Browser Console
Open browser console (F12) and look for these logs when typing:
- `[Auto-fill] Searching for: <your text> Total records: <number>`
- `[Auto-fill] Found matches: <count> [array of names]`

### 2. Common Issues

#### Issue 1: No Records in Database
**Symptom**: Console shows `Total records: 0`
**Solution**: You need to have at least one record with "Organization Name" field in your database

#### Issue 2: No Matching Records
**Symptom**: Console shows `Found matches: 0 []`
**Solution**: 
- Make sure you have records with "Organization Name" field populated
- The search is case-insensitive and looks for partial matches
- Try typing a few characters that exist in your organization names

#### Issue 3: Records Not Loaded Yet
**Symptom**: Search function runs but finds nothing even though records exist
**Solution**: 
- Make sure records are loaded (check if you see records in the main table)
- Try refreshing the page
- Wait a moment after opening the "Add Record" form

#### Issue 4: Field Name Mismatch
**Symptom**: Records exist but search doesn't find them
**Solution**: 
- Verify that your records have the field "Organization Name" (exact spelling, case-sensitive)
- Check database records to confirm the field name matches

### 3. How to Test

1. **Check if you have records**:
   - Look at the main database table - do you see records?
   - Do those records have "Organization Name" field populated?

2. **Test the search**:
   - Open "Add Record" form
   - Type in "Organization Name" field (at least 2 characters)
   - Check browser console for debug messages
   - Dropdown should appear if matches are found

3. **Verify field name**:
   - Check one of your existing records
   - Confirm the field is named exactly "Organization Name"
   - Not "Organization", "Org Name", etc.

### 4. Expected Behavior

- Type 2+ characters in "Organization Name" field
- Dropdown appears showing matching organizations
- Click on a suggestion to auto-fill all fields
- Green checkmark confirms which organization was used

### 5. Console Debug Output

When working correctly, you should see:
```
[Auto-fill] Searching for: shahe Total records: 150
[Auto-fill] Found matches: 3 ["Shaheed University", "Shaheed College", "Shaheed Institute"]
```

If you see `Total records: 0`, you need to add records first.
If you see `Found matches: 0 []`, there are no matching organizations in your database.

