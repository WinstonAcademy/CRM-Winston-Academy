# Course Field Update Guide

## Backend Changes (Strapi)

### 1. Update Content Type
1. Go to Strapi Admin Panel (`http://localhost:1337/admin`)
2. Navigate to **Content-Type Builder**
3. Find the **"Lead"** content type
4. Edit the **"Courses"** field
5. Change from **Text** to **Enumeration**
6. Add these values:
   - `General English`
   - `Level 3 Business Management`
   - `Level 3 Law`
   - `Level 3 Health and Social Care`
   - `Level 3 Information Technology`

### 2. Save and Restart
1. Save the content type changes
2. Restart your Strapi server
3. The API will now enforce these course values

## Frontend Changes (Already Applied)

### 1. Updated Interfaces
- `LeadsService.ts` - Updated Lead and CreateLeadData interfaces
- `LeadsTable.tsx` - Updated Lead interface

### 2. Updated Course Options
- Both `courseOptions` arrays in LeadsTable have been updated
- Removed old tech courses
- Added new academic courses

### 3. Type Safety
- All course fields now use strict typing
- Only the 5 specified course values are allowed

## Remaining Issues to Fix

### 1. Type Mismatches
There are still some places in the code where `Courses` is being assigned as a string instead of the enum type. These need to be updated:

```typescript
// Change from:
Courses: ''

// To:
Courses: 'General English' // or one of the other valid values
```

### 2. Form Data Handling
Ensure all form submissions use the correct course values from the enum.

## Testing

1. **Backend**: Verify that only the 5 specified course values are accepted
2. **Frontend**: Test that course selection works in both add and edit forms
3. **API**: Ensure course filtering and searching works correctly

## Benefits

- **Data Consistency**: Only valid course values can be entered
- **Better UX**: Users can only select from predefined options
- **Type Safety**: TypeScript will catch invalid course assignments
- **Reporting**: Easier to generate reports by course type

