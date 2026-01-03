# Export Feature - User Guide

## Overview
PresentGenius now offers multiple export options with improved quality and reliability.

## Export Options

### 1. Download HTML
- **What it is**: Standalone HTML file you can open in any browser
- **Best for**: Sharing web-viewable versions, embedding in websites
- **File size**: Small (10-100 KB typically)
- **Quality**: Perfect (original HTML)
- **Speed**: Instant

**How to use:**
1. Click the download icon with dropdown arrow
2. Select "Download HTML"
3. File downloads immediately

---

### 2. Export as PDF
- **What it is**: High-quality PDF document
- **Best for**: Printing, formal sharing, archiving
- **File size**: Medium (100 KB - 5 MB depending on content)
- **Quality**: High (2.5x resolution scaling)
- **Speed**: 5-15 seconds

**How to use:**
1. Click the download icon with dropdown arrow
2. Select "Export as PDF"
3. **Wait for progress messages:**
   - "Preparing content for PDF export..."
   - "Rendering content to canvas..."
   - "Generating PDF file..."
4. PDF downloads when complete

**Tips:**
- Complex layouts may take longer
- Background colors/images are preserved
- Multi-page for long content

---

### 3. Export as PNG (NEW!)
- **What it is**: High-resolution image file
- **Best for**: Social media, presentations, thumbnails
- **File size**: Large (1-10 MB depending on content)
- **Quality**: Very High (3x resolution scaling)
- **Speed**: 5-15 seconds

**How to use:**
1. Click the download icon with dropdown arrow
2. Select "Export as PNG"
3. **Wait for progress messages:**
   - "Preparing content for PNG export..."
   - "Rendering high-resolution image..."
   - "Creating PNG file..."
4. PNG downloads when complete

**Tips:**
- Best quality export option
- Full-width, scrollable content captured
- Perfect for screenshots

---

### 4. Export JSON
- **What it is**: Machine-readable data format
- **Best for**: Backup, importing into other systems
- **File size**: Small to Medium
- **Quality**: Perfect (includes all metadata)
- **Speed**: Instant

**How to use:**
1. Click the download icon with dropdown arrow
2. Select "Export JSON"
3. File downloads immediately

**Includes:**
- HTML content
- Original image data
- Presentation name
- Timestamp
- Unique ID

---

### 5. Copy to Clipboard
- **What it is**: Copies HTML to your clipboard
- **Best for**: Quick pasting into email, CMS, etc.
- **Speed**: Instant

**How to use:**
1. Click the download icon with dropdown arrow
2. Select "Copy to Clipboard"
3. Paste anywhere with Ctrl+V / Cmd+V

---

## Understanding Export Progress

### Blue Progress Indicator
- **Spinning icon + blue background**
- Export is currently processing
- **Do not close the window**
- Typically takes 5-15 seconds

### Green Success Message
- Export completed successfully
- File has been downloaded
- Safe to close or start another export

### Red Error Message
- Export failed
- Error details shown in message
- Common fixes:
  - Try again (temporary glitch)
  - Simplify content if very complex
  - Check browser console for details
  - Contact support if persistent

---

## Troubleshooting

### "Export failed" Error
**Possible causes:**
- Very complex CSS/animations
- Extremely large presentation
- Browser memory limitations
- External images blocked by CORS

**Solutions:**
1. Try HTML export (always works)
2. Simplify complex elements
3. Try in different browser (Chrome recommended)
4. Reduce image sizes in presentation

### Long Export Times (>30 seconds)
**This might happen if:**
- Presentation is very long (many slides)
- Large images or videos embedded
- Complex animations/effects

**What to do:**
- Wait patiently (it's still processing)
- Check browser isn't frozen (spinning icon should animate)
- If stuck >60 seconds, refresh and try again

### PDF/PNG Quality Issues
**If export looks pixelated:**
- This is rare with new 2.5x/3x scaling
- Try PNG export for highest quality
- Check original HTML preview looks correct
- Some fonts may render differently

---

## Best Practices

### For Best Quality
1. **PNG export** for images and social media
2. **PDF export** for documents and printing
3. **HTML export** for web embedding

### For Speed
1. **HTML export** for instant downloads
2. **JSON export** for data backup
3. **Copy to Clipboard** for quick sharing

### For Reliability
1. **Always works**: HTML, JSON, Copy to Clipboard
2. **Usually works (90%+)**: PDF, PNG
3. If PDF/PNG fails, use HTML as backup

---

## Technical Details

### PDF Export
- **Technology**: html2canvas + jsPDF
- **Resolution**: 2.5x native (high DPI)
- **Page size**: US Letter (portrait)
- **Compression**: Enabled
- **Color**: Full RGB support
- **Fonts**: Embedded

### PNG Export
- **Technology**: html2canvas
- **Resolution**: 3x native (very high DPI)
- **Base width**: 1920px
- **Format**: PNG (lossless)
- **Quality**: Maximum (1.0)
- **Alpha**: Supported

### Browser Compatibility
- ✅ Chrome/Edge: Full support
- ✅ Firefox: Full support
- ✅ Safari: Full support
- ✅ Mobile browsers: HTML/JSON only (PDF/PNG may fail)

---

## FAQ

**Q: Why does PDF/PNG export take so long?**
A: We render your entire presentation at 2.5-3x resolution for maximum quality. This takes time but produces professional results.

**Q: Can I cancel an export?**
A: Not currently. If stuck, refresh the page and try again or use HTML export.

**Q: What's the file size limit?**
A: No hard limit, but very large presentations (>50 slides or >10MB images) may fail. Split into smaller sections if needed.

**Q: Do exports include animations?**
A: No. PDF/PNG are static snapshots. Use HTML export to preserve interactivity.

**Q: Why do some images not appear in PDF/PNG?**
A: Cross-origin (CORS) restrictions. If images are from external sites without CORS headers, they may be blocked by browser security.

**Q: Can I export presentations offline?**
A: HTML/JSON exports work offline. PDF/PNG require browser rendering which needs page to be loaded first.

---

## Support

If you encounter persistent export issues:
1. Check browser console (F12) for error details
2. Try HTML export as backup
3. Report issue with:
   - Browser version
   - Export type attempted
   - Error message shown
   - Presentation complexity (# of slides, image count)

**Remember**: HTML export always works as a reliable fallback!
