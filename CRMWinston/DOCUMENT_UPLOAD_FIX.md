# Document Upload Fix for Leads Table

## Problem
Documents uploaded from the frontend for leads were not getting saved to the backend or appearing in the table.

## Root Causes Identified

1. **Missing Documents Field in Interface**: The `Lead` interface in `leadsService.ts` didn't include the `Documents` field
2. **Incomplete Document Association Flow**: When creating a new lead with documents, the code:
   - Created the lead
   - Uploaded documents
   - Associated documents with the lead
   - But did NOT fetch the updated lead data with populated Documents field before adding to state

## Changes Made

### 1. Frontend: `src/components/tables/LeadsTable.tsx`

**Updated `handleSaveNewLead` function:**
- Added logic to fetch the updated lead with populated Documents after association
- Properly transforms the document data to match the interface
- Ensures the lead added to state includes all document information

```typescript
// After associating documents, fetch the updated lead
const fetchUpdatedLeadResponse = await fetch(`http://localhost:1337/api/leads/${newLead.data.id}?populate=Documents`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

if (fetchUpdatedLeadResponse.ok) {
  const updatedLeadData = await fetchUpdatedLeadResponse.json();
  // Transform documents to match interface
  finalLeadData = {
    ...updatedLeadData.data,
    Documents: transformedDocuments
  };
}
```

### 2. Service Layer: `src/services/leadsService.ts`

**Added Document interfaces:**
```typescript
export interface DocumentAttributes {
  name: string;
  url: string;
  alternativeText?: string;
  caption?: string;
  width?: number;
  height?: number;
  formats?: any;
  hash?: string;
  ext?: string;
  mime?: string;
  size?: number;
  previewUrl?: string;
  provider?: string;
  provider_metadata?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface Document {
  id: number;
  attributes?: DocumentAttributes;
}
```

**Updated Lead interface:**
```typescript
export interface Lead {
  id: number;
  attributes: {
    // ... existing fields
    Documents?: {
      data: Document[];
    };
    // ... other fields
  };
}
```

**Added helper methods:**
- `uploadFiles(files: File[])`: Uploads files to Strapi
- `associateDocuments(leadId: number, documentIds: number[], leadData: UpdateLeadData)`: Associates documents with a lead

### 3. Backend: `src/api/lead/controllers/lead.ts`

**No changes needed** - The backend controller already properly populates Documents in all operations:
- `find()` - populates Documents
- `findOne()` - populates Documents  
- `create()` - populates Documents
- `update()` - populates Documents

## Testing the Fix

### 1. Test Creating a New Lead with Documents

1. Open the Leads page
2. Click "Add Lead"
3. Fill in the required fields (Name, Email, Phone)
4. Upload one or more documents using the file input
5. Click "Save"
6. **Expected Result**: 
   - Lead is created successfully
   - Documents appear in the Documents column immediately
   - Document count is displayed correctly
   - Clicking on documents opens them in the viewer

### 2. Test Uploading Documents to Existing Lead

1. Open the Leads page
2. Click "Edit" on an existing lead
3. Scroll to the Documents section
4. Upload new documents
5. Save the lead
6. **Expected Result**:
   - Documents are uploaded and associated
   - Both old and new documents appear in the table
   - Document viewer works for all documents

### 3. Test Document Display in Table

1. Check that the Documents column shows:
   - Document count (e.g., "3 files")
   - Preview/View button for each document
   - Proper file icons (PDF, Image, etc.)
2. Click on a document to open the viewer
3. **Expected Result**:
   - Document opens in modal viewer
   - For images: Shows preview
   - For PDFs/files: Shows download link
   - File metadata is displayed correctly

## API Endpoints Used

1. **Create Lead**: `POST /api/leads`
2. **Upload Files**: `POST /api/upload`
3. **Associate Documents**: `PUT /api/leads/:id` (with Documents array)
4. **Fetch Lead with Documents**: `GET /api/leads/:id?populate=Documents`

## Document Flow Diagram

```
User uploads document(s)
    ↓
Frontend: handleSaveNewLead()
    ↓
1. POST /api/leads (create lead)
    ↓
2. POST /api/upload (upload files)
    ↓
3. PUT /api/leads/:id (associate documents with lead)
    ↓
4. GET /api/leads/:id?populate=Documents (fetch updated lead)
    ↓
5. Transform document data to match interface
    ↓
6. Add lead with documents to state
    ↓
7. Display in table with document count and viewer
```

## Known Issues / Limitations

None currently identified. The fix addresses the complete document upload and display flow.

## Future Enhancements

1. Add document deletion functionality
2. Add document preview thumbnails in table
3. Add bulk document upload
4. Add document type filtering
5. Add document search functionality

## Verification Checklist

- [x] Documents upload successfully
- [x] Documents appear in table after creation
- [x] Document count displays correctly
- [x] Document viewer works
- [x] Multiple documents can be uploaded
- [x] Documents persist after page refresh
- [x] Backend properly populates Documents field
- [x] TypeScript interfaces include Documents field
- [x] No linter errors

## Commit

```bash
git commit -m "Fix: Document upload functionality in leads table

- Updated handleSaveNewLead to fetch updated lead data after document association
- Added Documents field to Lead interface in leadsService.ts
- Added uploadFiles and associateDocuments methods to LeadsService
- Backend controller already properly populates Documents in all operations
- Documents now properly display in the table after upload"
```

