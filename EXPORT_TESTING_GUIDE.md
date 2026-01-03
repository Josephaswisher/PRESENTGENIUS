# Export Functionality - Testing Guide

## Quick Test Checklist

### 1. Export to HTML
**Expected Behavior:**
- Click "Export" dropdown → "Download HTML"
- Browser downloads file with `.html` extension
- Filename is sanitized (special chars replaced with underscores)
- File contains complete, valid HTML document

**Test Cases:**
- [ ] Normal filename exports correctly
- [ ] Special characters in name are sanitized
- [ ] Very long names are truncated to 100 chars
- [ ] Downloaded file opens in browser
- [ ] HTML structure is preserved
- [ ] CSS styles are included

---

### 2. Export to PDF
**Expected Behavior:**
- Click "Export" dropdown → "Print to PDF"
- New window opens with preview
- Browser's print dialog appears automatically
- User can select "Save as PDF"

**Test Cases:**
- [ ] Print window opens without blocking popups
- [ ] Print dialog appears automatically
- [ ] Window closes after 1 second if print is cancelled
- [ ] Colors are preserved in print preview
- [ ] Page margins are correct (0.5in)
- [ ] PDF saves with proper filename

**Troubleshooting:**
- If window doesn't open: Check popup blockers
- If print dialog doesn't appear: Check browser print settings
- If colors don't print: Ensure "Print backgrounds" is enabled

---

### 3. Export to JSON
**Expected Behavior:**
- Click "Export" dropdown → "Export JSON"
- Browser downloads `.json` file
- File contains:
  - `id`: Unique identifier (UUID or provided)
  - `name`: Creation name
  - `html`: Full HTML content
  - `originalImage`: Base64 or URL of original image
  - `timestamp`: ISO 8601 timestamp
  - `version`: "2.0"

**Test Cases:**
- [ ] JSON downloads with correct extension
- [ ] File is valid JSON (can be parsed)
- [ ] All metadata fields are present
- [ ] Special characters are escaped
- [ ] Unicode characters are preserved
- [ ] ID is consistent if same creation is exported twice

**Validate JSON:**
```bash
cat downloaded_file.json | python -m json.tool
```

---

### 4. Copy to Clipboard
**Expected Behavior:**
- Click "Export" dropdown → "Copy to Clipboard"
- Toast notification appears: "Copied to clipboard!"
- HTML code is copied to system clipboard
- Can paste anywhere (email, chat, code editor)

**Test Cases:**
- [ ] Toast message appears for 2 seconds
- [ ] Content is copied (paste in text editor to verify)
- [ ] Special characters are preserved
- [ ] Unicode characters work correctly
- [ ] Works in modern browsers (Chrome, Firefox, Safari)
- [ ] Works in older browsers (fallback to execCommand)
- [ ] Shows error message if clipboard access denied

**Test on Different Browsers:**
- Chrome: Uses Clipboard API
- Firefox: Uses Clipboard API
- Safari: Uses Clipboard API
- IE11: Falls back to execCommand

---

## Advanced Testing

### Test File Extensions
```bash
# HTML export should have .html extension
# JSON export should have _artifact.json extension
# PDF uses browser naming (can be customized in print dialog)
```

### Test Filename Sanitization
```
Input                  →  Output
"My Creation.html"     →  "my_creation.html"
"Test/File (1).html"   →  "test_file_1.html"
"Special!@#$.html"     →  "special.html"
"Very Long Name..."    →  "very_long_name.html" (truncated)
```

### Test MIME Types
Verify in browser Network tab:
- HTML: `text/html;charset=utf-8`
- JSON: `application/json;charset=utf-8`
- Download headers should include `Content-Disposition: attachment`

### Test with Special Content
- Unicode characters: "日本語テスト"
- HTML entities: "&nbsp;", "&copy;"
- Script tags: `<script>alert('test')</script>` (should be escaped)
- Large files: Test with +10MB HTML content

---

## Error Scenarios

### Popup Blocked for PDF Export
**What Happens:**
- Print window fails to open
- Error message: "Popup blocked: Please allow popups to export as PDF"

**How to Test:**
1. Enable popup blocker in browser
2. Try to export PDF
3. Should see error message
4. Allow popup and retry

---

### Clipboard Permission Denied
**What Happens:**
- Clipboard API blocked by browser
- Falls back to execCommand method
- If both fail: "Copy failed" message

**How to Test:**
1. In browser console: `navigator.permissions.query({ name: 'clipboard-write' })`
2. Check result
3. Try copying to clipboard

---

### Browser Without Modern APIs
**What Happens:**
- Modern Clipboard API not available
- Falls back to execCommand (textarea copy)
- Should still work on IE11 and older browsers

**Test Fallback:**
1. Open browser DevTools
2. Override navigator.clipboard to undefined
3. Try copying to clipboard
4. Should still work via textarea method

---

## Performance Testing

### File Size Impact
Test with creations of different sizes:
- Small: < 100KB (typical)
- Medium: 1MB (complex presentation)
- Large: 10MB (edge case)

Measure:
- Time to trigger download
- Memory usage during export
- Browser responsiveness

### Resource Cleanup
Verify in DevTools Memory tab:
- No blob URLs leaking
- DOM elements properly removed
- No memory increase after export

---

## Mobile Testing

### iOS Safari
- [ ] HTML export works
- [ ] PDF print dialog works
- [ ] Clipboard works (may show system prompt)
- [ ] File extensions correct

### Android Chrome
- [ ] HTML export works
- [ ] PDF print dialog works
- [ ] Clipboard works
- [ ] Downloads appear in Downloads folder

---

## Accessibility Testing

### Screen Reader
- Export buttons have proper labels
- Error messages are announced
- Toast notifications are conveyed

### Keyboard Navigation
- Export dropdown accessible via Tab key
- All buttons clickable via Enter
- No keyboard traps

---

## Browser Compatibility Matrix

| Feature | Chrome | Firefox | Safari | IE11 | Edge |
|---------|--------|---------|--------|------|------|
| HTML    | ✓      | ✓       | ✓      | ✓    | ✓    |
| PDF     | ✓      | ✓       | ✓      | ✓    | ✓    |
| JSON    | ✓      | ✓       | ✓      | ✓    | ✓    |
| Clipboard API | ✓ | ✓ | ✓ | ✗ | ✓ |
| Clipboard Fallback | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## Debug Mode

### Enable Console Logging
All export functions log to console:
```javascript
// In browser console
localStorage.debug = '*'
```

Check for messages:
- "Failed to copy to clipboard via Clipboard API"
- "Fallback copy to clipboard failed"
- "Failed to export HTML"
- "Failed to export PDF"
- "Failed to export JSON"

### Inspect Downloads
```bash
# Check downloaded files
ls -la ~/Downloads/ | grep -E "\.(html|json|pdf)$"

# Validate JSON
python -m json.tool ~/Downloads/*.json

# Check HTML structure
head -20 ~/Downloads/*.html
```

---

## Regression Testing

### Before Each Release
1. Test all 4 export formats
2. Test on primary browsers (Chrome, Firefox, Safari)
3. Test error scenarios (popup blocked, clipboard denied)
4. Test with different file sizes
5. Run automated test suite:
   ```bash
   npm test -- tests/export.test.ts
   ```

### After Updates
1. Verify no new errors in console
2. Verify downloads still work
3. Verify clipboard still works
4. Check no memory leaks

---

## Common Issues & Solutions

### Issue: Download doesn't appear
**Cause:** Browser catching link click too fast
**Solution:** Already fixed with 100ms delay - if still issues, increase timeout

### Issue: PDF doesn't print content
**Cause:** Popup window blocked or CSS not applied
**Solution:** Check popup blockers, verify print styles in DevTools

### Issue: Clipboard empty after paste
**Cause:** Permissions denied or fallback not working
**Solution:** Check browser permissions, test fallback method

### Issue: Special characters corrupted
**Cause:** Encoding issue in base64
**Solution:** Already fixed with TextEncoder - verify in Network tab

---

## Test Results Template

```
Date: 2026-01-03
Browser: Chrome 126.0
OS: macOS 14.2

Export to HTML:     ✓ PASS
Export to PDF:      ✓ PASS
Export to JSON:     ✓ PASS
Copy to Clipboard:  ✓ PASS

Error Handling:     ✓ PASS
Mobile Testing:     ✓ PASS
Performance:        ✓ PASS
Accessibility:      ✓ PASS

Notes: All tests passing
```

---

*Last Updated: 2026-01-03*
*Version: 2.0 (Export Testing Guide)*
