# Upload Testing Guide

## ✅ What Works Now:
- Student creation WITHOUT documents ✅
- Lead creation WITHOUT documents ✅
- PDF files are uploadable via API ✅
- Upload permissions enabled ✅

## 🧪 Testing Steps:

### Test 1: Create Student WITHOUT Documents
1. Go to http://localhost:3000
2. Students → Add Student
3. Fill in:
   - Name: Test Student
   - Email: test@test.com
   - Phone: +44 1234567890
4. **Don't upload any documents**
5. Click Save
6. **Result:** Should work! ✅

### Test 2: Upload PDF to Existing Lead/Student
1. Click Edit on an existing lead/student
2. In the edit form, click "Upload Documents"
3. Select a PDF file
4. **Check console (F12) - you should see:**
   ```
   handleFileUpload called with files: [File object]
   Previous selectedFiles: []
   New selectedFiles: [File object]
   ```
5. Click Save
6. **Check console for:**
   ```
   ✅ Files uploaded successfully
   ✅ Documents associated
   ```

### Test 3: Create New Lead WITH PDF
1. Leads → Add Lead
2. Fill required fields
3. **Before saving**, click upload and select PDF
4. Check if file name appears in the form
5. Click Save
6. Check console for upload status

## 🔍 Common Issues:

### Issue: "Nothing happens when I select a file"
**Possible causes:**
- Browser blocking file access
- File input not configured correctly
- Check console for ANY errors when selecting file

### Issue: "File uploads but I get 403/401"
**Fix:** Logout and login again to get fresh token

### Issue: "File uploads but doesn't show in documents list"
**Cause:** Association might be failing
**Check:** Does the lead/student get created? Refresh page to see if documents appear

### Issue: "localhost refused to connect" when viewing
**Cause:** URL construction issue
**Check:** Console should show: "Loading PDF from: http://localhost:1337/uploads/..."

## 📊 Debug Checklist:

When you try to upload:
- [ ] Console shows "handleFileUpload called" when selecting file?
- [ ] File name appears in the form after selection?
- [ ] Console shows upload request when clicking Save?
- [ ] Any red error messages in console?
- [ ] Check Network tab (F12 → Network) for failed upload requests?

## 🎯 What to Share:

If upload still doesn't work:
1. Screenshot of console when selecting file
2. Screenshot of console when clicking Save
3. Network tab → Filter "upload" → Show failed request details
4. Error message you see (if any)

## ✅ Expected Working Flow:

1. **Select file** → Console: "handleFileUpload called"
2. **Click Save** → Console: "📤 Sending student data"
3. **Backend creates** → Console: "✅ Student created"
4. **Upload starts** → Console: "Uploading documents..."
5. **Upload complete** → Console: "✅ Files uploaded successfully"
6. **Association** → Console: "✅ Documents associated"
7. **Success!** → Alert: "Student added successfully!"

