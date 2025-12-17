# Logo Placement Instructions for Winston Academy CRM

## 📍 Where to Place Your Logo Files

### 1. **Frontend Logo (Sidebar & Header)**

Place your logo image files in:
```
/public/images/logo/
```

**Required Files:**
- `logo.svg` - Main logo for light mode (sidebar expanded, mobile header)
- `logo-dark.svg` - Logo for dark mode (sidebar expanded, mobile header)  
- `logo-icon.svg` - Small icon logo for collapsed sidebar (32x32px recommended)

**Recommended Sizes:**
- `logo.svg` and `logo-dark.svg`: 150px width × 40px height (or proportional)
- `logo-icon.svg`: 32px × 32px (square)

---

### 2. **Browser Tab Icon (Favicon)**

Place your favicon file in:
```
/public/images/favicon.ico
```

**File Format:**
- `.ico` format (16x16, 32x32, or 48x48px)
- Or you can use `.png` format (32x32px recommended)

**Alternative: For better browser support, also add:**
- `/public/images/logo/logo-icon.svg` (already referenced for Apple touch icon)

---

## 📝 File Structure

Your `/public/images/logo/` directory should look like:
```
public/
  images/
    logo/
      logo.svg          ← Main logo (light mode)
      logo-dark.svg     ← Main logo (dark mode)
      logo-icon.svg     ← Icon for collapsed sidebar
    favicon.ico         ← Browser tab icon
```

---

## ✅ What's Already Configured

The code is already set up to use these logo files:
- ✅ Sidebar logo (expanded): Uses `logo.svg` / `logo-dark.svg`
- ✅ Sidebar logo (collapsed): Uses `logo-icon.svg`
- ✅ Mobile header logo: Uses `logo.svg` / `logo-dark.svg`
- ✅ Browser tab icon: Uses `/images/favicon.ico`

---

## 🎨 Logo Specifications

Based on your Winston Academy logo (heraldic shield with horses):

**For `logo.svg` and `logo-dark.svg`:**
- Include the full logo with "WINSTON ACADEMY LTD." text
- Width: ~150-200px
- Height: ~40-60px (maintain aspect ratio)
- SVG format recommended for crisp display

**For `logo-icon.svg`:**
- Use just the shield with "W" or simplified version
- 32px × 32px square
- Should be recognizable at small sizes

**For `favicon.ico`:**
- Simplified version (shield icon or "W")
- 32×32px or 16×16px
- Works best with simple, bold designs

---

## 🔄 After Adding Files

1. Place your logo files in the directories above
2. Restart your Next.js development server:
   ```bash
   npm run dev
   ```
3. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R) to see changes
4. The logo should appear automatically in:
   - Sidebar (when expanded)
   - Sidebar icon (when collapsed)
   - Mobile header
   - Browser tab (favicon)

---

## 📱 Testing

- **Sidebar**: Expand/collapse sidebar to see both logo versions
- **Dark Mode**: Toggle dark mode to see `logo-dark.svg`
- **Mobile**: Resize browser to mobile view to see header logo
- **Browser Tab**: Check browser tab for favicon

---

## 🆘 Troubleshooting

If logo doesn't appear:
1. Check file names match exactly (case-sensitive)
2. Verify files are in `/public/images/logo/` directory
3. Clear browser cache and hard refresh
4. Check browser console for 404 errors
5. Ensure SVG files are valid (open in browser to test)
