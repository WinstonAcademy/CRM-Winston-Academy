# Document Upload Fix Guide

## ✅ What's Been Fixed

### 1. Student Creation Issue - FIXED! ✅
**Problem:** Empty date strings causing validation error  
**Solution:** Now sends `null` for empty dates instead of empty strings  
**Status:** Should work now!

### 2. Document Upload Configuration

**Current Setup:**
- ✅ Upload plugin enabled in `config/plugins.ts`
- ✅ File size limit: 100MB
- ✅ Provider: local storage
- ✅ Upload permissions auto-enabled in backend
- ✅ Authorization headers added to upload requests

**Supported File Types:**
The default Strapi upload plugin supports:
- ✅ **Images:** jpg, jpeg, png, gif, svg, webp, bmp, tiff
- ✅ **Documents:** pdf, doc, docx, txt, rtf, odt
- ✅ **Videos:** mp4, mov, avi, wmv, flv, mkv, webm
- ✅ **Audio:** mp3, wav, ogg, m4a
- ✅ **Archives:** zip, rar, tar, gz
- ✅ **Other:** csv, xls, xlsx, ppt, pptx

## 🔧 Try This Now:

### Test 1: Create Student Without Documents
1. Go to http://localhost:3000
2. Click "Add Student"
3. Fill in ONLY required fields:
   - Name: Test Student
   - Email: test@example.com
   - Phone: +44 1234567890
4. Leave dates and documents EMPTY
5. Click "Save"
6. **Should work now!** ✅

### Test 2: Create Student/Lead With Documents
1. Try adding a student or lead
2. Fill required fields
3. **Attach a small PDF file** (under 10MB)
4. Click "Save"
5. Check browser console for errors

## 🐛 If Upload Still Fails:

### Check These:

1. **Browser Console (F12 → Console):**
   - Look for upload-related errors
   - Share the error message

2. **Backend Logs:**
   - Look for upload errors in terminal
   - Should show detailed error messages now

3. **File Size:**
   - Keep files under 10MB for initial testing
   - Large files might timeout

4. **Network Tab (F12 → Network):**
   - Filter by "upload"
   - Click on the failed upload request
   - Check the Response tab
   - Share the error details

## Common Upload Issues & Fixes:

### Issue 1: "Failed to upload documents"
**Cause:** Upload permissions not enabled  
**Fix:** Go to Strapi Admin → Settings → Roles → Authenticated → Upload section → Enable all checkboxes

### Issue 2: "Failed to fetch updated lead with documents"
**Cause:** Document association failing  
**Fix:** Check if the lead/student was created (refresh the table) - upload might work but association fails

### Issue 3: "413 Payload Too Large"
**Cause:** File too large  
**Fix:** Current limit is 100MB, should be fine for most files

### Issue 4: File type not allowed
**Cause:** Some file types might be restricted  
**Fix:** We can configure allowed file types if needed

## 📝 What to Share:

If uploads still fail, please share:
1. **File type you're trying to upload** (PDF, image, etc.)
2. **File size**
3. **Error message from browser console**
4. **Network tab response** (F12 → Network → click failed request → Response)

## ✅ Quick Test Command:

To test upload directly:
```bash
# Get token
TOKEN=$(curl -s -X POST http://localhost:1337/api/auth/local -H "Content-Type: application/json" -d '{"identifier":"admin@winston.edu","password":"Admin123!"}' | python3 -c "import sys, json; print(json.load(sys.stdin).get('jwt', ''))" 2>/dev/null)

# Test upload with a small file
echo "Test content" > /tmp/test.txt
curl -X POST "http://localhost:1337/api/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@/tmp/test.txt"
```

## Next Steps:

1. ✅ Try creating a student WITHOUT documents first (should work now!)
2. ✅ Then try WITH a small PDF file
3. 📋 Share any error messages you see

