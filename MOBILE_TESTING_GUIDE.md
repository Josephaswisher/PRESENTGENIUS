# Mobile Testing Guide - PresentGenius

## Quick Test Scenarios

### 1. iPhone Testing (375px width - iPhone SE/8)

**Test Case 1: Basic Preview Scrolling**
1. Open PresentGenius on iPhone
2. Upload a presentation or create one
3. View the preview
4. Try to scroll the preview with touch
   - ✅ Should scroll smoothly
   - ✅ No bounce back to parent
   - ✅ No horizontal scroll

**Test Case 2: Split View Layout**
1. Upload an image/PDF
2. Preview should show split view
3. Verify layout:
   - ✅ Original image on top (50% height)
   - ✅ Preview on bottom (50% height)
   - ✅ Both panels scrollable independently
   - ✅ No overlap or cutoff

**Test Case 3: Presentation Mode**
1. Click "Present" button
2. Enter fullscreen
3. Swipe through slides
   - ✅ Smooth transitions
   - ✅ Touch navigation works
   - ✅ No zoom on double-tap

### 2. iPad Testing (768px+ width)

**Test Case 1: Desktop Layout**
1. Open on iPad
2. Verify layout:
   - ✅ Preview on left
   - ✅ Chat assistant visible on right
   - ✅ Side-by-side layout maintained

**Test Case 2: Split View**
1. Upload image/PDF
2. Verify:
   - ✅ Side-by-side split (not stacked)
   - ✅ 50/50 width split
   - ✅ Both panels scrollable

### 3. Android Testing

**Test Case 1: Basic Functionality**
1. Open on Android device
2. Test scrolling
   - ✅ Smooth touch scrolling
   - ✅ Preview responds to gestures
   - ✅ No layout issues

**Test Case 2: Responsive Layout**
1. Test on various screen sizes
2. Verify:
   - ✅ Mobile layout (<768px): Vertical stack
   - ✅ Tablet layout (≥768px): Side-by-side

## Common Issues & Solutions

### Issue: Preview doesn't scroll on iOS
**Check:**
- Open Safari DevTools (if available)
- Look for `-webkit-overflow-scrolling: touch` in iframe styles
- Verify `touchAction: 'pan-y'` is applied

**Solution:**
- Styles should be inline on iframe element
- Check LivePreview.tsx lines 517-522

### Issue: Horizontal scroll appears
**Check:**
- Screen width < 375px
- Long content without wrapping

**Solution:**
- Verify `overflow-x: hidden` on parent containers
- Check App.tsx workspace container (line 440)

### Issue: Layout doesn't stack on mobile
**Check:**
- Screen width detection
- Tailwind breakpoints (md: = 768px)

**Solution:**
- Verify `flex-col md:flex-row` classes
- Check LivePreview.tsx line 459

## Browser-Specific Notes

### iOS Safari
- Requires `-webkit-` prefixes for smooth scrolling
- `touch-action` is critical for preventing zoom
- Test on both iPhone and iPad

### Chrome Mobile (Android)
- Standard CSS properties work
- No webkit prefixes needed
- Test pull-to-refresh behavior

### Firefox Mobile
- Standard CSS properties work
- May have different scrollbar behavior
- Test gesture navigation

## Debugging Tools

### iOS Safari
```
Settings → Safari → Advanced → Web Inspector
Connect iPhone to Mac → Safari → Develop → [Your iPhone]
```

### Chrome DevTools (Mobile Emulation)
```
F12 → Toggle Device Toolbar (Ctrl+Shift+M)
Test presets: iPhone SE, iPhone 12 Pro, Pixel 5
```

### Responsive Design Mode (Firefox)
```
F12 → Responsive Design Mode (Ctrl+Shift+M)
Test various viewport sizes
```

## Performance Checks

### Scrolling Performance
1. Open DevTools Performance tab
2. Record scrolling session
3. Check for:
   - No layout thrashing
   - Smooth 60fps
   - No jank or stutter

### Memory Usage
1. Open DevTools Memory tab
2. Take heap snapshot
3. Verify:
   - No memory leaks on scroll
   - Reasonable iframe memory usage

## Accessibility Testing

### Screen Reader Support
1. Enable VoiceOver (iOS) or TalkBack (Android)
2. Navigate through interface
3. Verify:
   - All controls announced properly
   - Touch targets ≥44px
   - Focus indicators visible

### Touch Target Sizes
1. Measure interactive elements
2. Verify:
   - Buttons ≥44px × 44px
   - Adequate spacing between targets
   - No accidental taps

## Edge Cases

### Very Long Presentations
1. Create presentation with 50+ slides
2. Test:
   - Scrolling performance
   - Memory usage
   - Navigation responsiveness

### Large Images/PDFs
1. Upload large file (>10MB)
2. Test:
   - Loading time
   - Scroll smoothness
   - Image quality

### Network Conditions
1. Enable throttling (3G, Slow 3G)
2. Test:
   - Progressive loading
   - Offline behavior
   - Error handling

## Sign-off Checklist

Before deploying mobile fixes:

- [ ] Tested on real iPhone (iOS 14+)
- [ ] Tested on real Android device (Android 10+)
- [ ] Tested on iPad
- [ ] Verified in Chrome DevTools mobile emulation
- [ ] No horizontal scroll on any viewport
- [ ] Split view works on all devices
- [ ] Presentation mode functional
- [ ] No console errors
- [ ] Smooth 60fps scrolling
- [ ] Touch targets adequate size
- [ ] No zoom on double-tap
- [ ] Chat assistant hidden on mobile
- [ ] All features accessible via touch

## Reporting Issues

When reporting mobile issues, include:

1. **Device**: iPhone 13 Pro, Pixel 6, etc.
2. **OS Version**: iOS 16.3, Android 13, etc.
3. **Browser**: Safari 16, Chrome 110, etc.
4. **Screen Size**: 375×667, 393×851, etc.
5. **Steps to Reproduce**: Detailed steps
6. **Expected Behavior**: What should happen
7. **Actual Behavior**: What actually happens
8. **Screenshots**: Visual evidence
9. **Console Logs**: Any errors/warnings

---

**Last Updated**: 2026-01-03
**Version**: 1.0.0
**Tested Devices**: iPhone SE, iPhone 13 Pro, iPad Pro, Pixel 5, Galaxy S21
