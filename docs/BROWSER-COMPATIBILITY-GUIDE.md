# Browser Compatibility Guide

Quick reference for developers working with PresentGenius browser compatibility utilities.

## Quick Start

### Detect Browser
```typescript
import { detectBrowser } from '../utils/browser-detection';

const browser = detectBrowser();
console.log(browser.name);      // 'chrome' | 'firefox' | 'safari' | 'edge' | 'opera' | 'unknown'
console.log(browser.version);   // '120.0'
console.log(browser.isIOS);     // true/false
console.log(browser.iOSVersion); // '16.3' (if iOS)
console.log(browser.isMobile);  // true/false
```

### Check Features
```typescript
import { checkFeatureSupport } from '../utils/browser-detection';

const features = checkFeatureSupport();
if (!features.fullscreen) {
  console.warn('Fullscreen not supported');
}
```

### Fullscreen with Error Handling
```typescript
import { toggleFullscreen } from '../utils/fullscreen-api';

const handleFullscreen = async () => {
  const result = await toggleFullscreen();
  if (!result.success) {
    alert(result.message); // User-friendly message
  }
};
```

### Safe Iframe Access
```typescript
import { queryIFrameElements, waitForIFrameReady } from '../utils/iframe-helpers';

const iframe = document.querySelector('iframe');

// Wait for ready
const readyResult = await waitForIFrameReady(iframe, 5000);
if (!readyResult.success) {
  console.error(readyResult.message);
  return;
}

// Query elements
const slidesResult = queryIFrameElements(iframe, '.slide');
if (slidesResult.success) {
  console.log(`Found ${slidesResult.data.length} slides`);
}
```

### iOS Scroll Styles
```typescript
import { getScrollStyles } from '../utils/ios-scroll-fix';

// In component
<div style={getScrollStyles({
  enableMomentum: true,
  direction: 'vertical'
})}>
  Scrollable content
</div>

// Or apply to element
import { applyScrollStyles } from '../utils/ios-scroll-fix';
applyScrollStyles(element, { enableMomentum: true });
```

## Common Patterns

### Pattern 1: Feature Detection with Fallback
```typescript
import { checkFeatureSupport } from '../utils/browser-detection';

const MyComponent = () => {
  const features = checkFeatureSupport();

  return (
    <div>
      {features.intersectionObserver ? (
        <LazyLoadedContent />
      ) : (
        <StaticContent />
      )}
    </div>
  );
};
```

### Pattern 2: Error State Management
```typescript
const [error, setError] = useState<string | null>(null);

const handleAction = async () => {
  const result = await someAsyncOperation();

  if (!result.success) {
    setError(result.message);
    setTimeout(() => setError(null), 5000); // Auto-clear
    return;
  }

  // Success path
  setError(null);
};
```

### Pattern 3: Browser-Specific Styling
```typescript
import { detectBrowser } from '../utils/browser-detection';

const MyComponent = () => {
  const browser = detectBrowser();

  return (
    <div className={`
      base-styles
      ${browser.isIOS ? 'ios-specific-class' : ''}
      ${browser.name === 'safari' ? 'safari-specific-class' : ''}
    `}>
      Content
    </div>
  );
};
```

## API Reference

### browser-detection.ts

#### `detectBrowser(): BrowserInfo`
Returns detailed browser information.

**Returns:**
```typescript
{
  name: 'chrome' | 'firefox' | 'safari' | 'edge' | 'opera' | 'unknown',
  version: string,
  isIOS: boolean,
  iOSVersion?: string,
  isMobile: boolean
}
```

#### `checkFeatureSupport(): FeatureSupport`
Returns feature availability flags.

**Returns:**
```typescript
{
  fullscreen: boolean,
  fullscreenEnabled: boolean,
  modernScrolling: boolean,
  cssSmoothScrolling: boolean,
  intersectionObserver: boolean
}
```

### fullscreen-api.ts

#### `requestFullscreen(element?: HTMLElement): Promise<FullscreenResult>`
Requests fullscreen mode.

**Parameters:**
- `element` (optional): Element to make fullscreen. Defaults to `document.documentElement`

**Returns:**
```typescript
{
  success: boolean,
  error?: Error,
  message?: string
}
```

#### `exitFullscreen(): Promise<FullscreenResult>`
Exits fullscreen mode.

#### `toggleFullscreen(element?: HTMLElement): Promise<FullscreenResult>`
Toggles fullscreen state.

#### `onFullscreenChange(callback: (isFullscreen: boolean) => void): () => void`
Registers fullscreen change listener.

**Returns:** Cleanup function to remove listener

**Example:**
```typescript
useEffect(() => {
  const cleanup = onFullscreenChange((isFullscreen) => {
    console.log('Fullscreen:', isFullscreen);
  });
  return cleanup;
}, []);
```

### ios-scroll-fix.ts

#### `getScrollStyles(config?: ScrollConfig): ScrollStyles`
Returns CSS properties for scrolling.

**Parameters:**
```typescript
{
  enableMomentum?: boolean,      // Default: true
  enableSmoothScrolling?: boolean, // Default: true
  direction?: 'vertical' | 'horizontal' | 'both' // Default: 'vertical'
}
```

**Returns:** Object with CSS properties ready for spreading

### iframe-helpers.ts

#### `getIFrameDocument(iframe: HTMLIFrameElement): IFrameResult<Document>`
Safely accesses iframe document.

#### `queryIFrameElements(iframe: HTMLIFrameElement, selector: string): IFrameResult<NodeListOf<Element>>`
Safely queries elements in iframe.

#### `waitForIFrameReady(iframe: HTMLIFrameElement, timeoutMs?: number): Promise<IFrameResult<Document>>`
Waits for iframe to load.

**Parameters:**
- `timeoutMs`: Timeout in milliseconds (default: 5000)

**IFrameResult Structure:**
```typescript
{
  success: boolean,
  data?: T,
  error?: Error,
  errorType?: 'csp' | 'cross-origin' | 'timeout' | 'not-ready' | 'unknown',
  message?: string
}
```

## Error Messages

All error messages are user-friendly and actionable:

### Fullscreen Errors
- ✅ "Fullscreen is not supported in your browser"
- ✅ "Fullscreen blocked. Please allow fullscreen in your browser settings."
- ✅ "Fullscreen blocked by permissions policy"
- ❌ "ERR_FULLSCREEN_NOT_ALLOWED" (Too technical)

### Iframe Errors
- ✅ "Could not load presentation content"
- ✅ "Cannot access iframe from different origin"
- ✅ "Content Security Policy blocks iframe access"
- ❌ "SecurityError: Blocked a frame with origin" (Too technical)

## Browser Support Matrix

| Browser | Version | Support Level | Notes |
|---------|---------|--------------|-------|
| Chrome | 80+ | Full | Recommended |
| Firefox | 70+ | Full | Recommended |
| Safari | 13+ | Full | Modern scrolling |
| Safari | 12 | Partial | Legacy scrolling |
| Edge | 80+ | Full | Chromium-based |
| iOS Safari | 13+ | Full | Modern APIs |
| iOS Safari | 12 | Partial | Webkit fallbacks |

## Troubleshooting

### Issue: Fullscreen not working
**Check:**
1. Is the browser supported? `checkFeatureSupport().fullscreen`
2. Is the action user-initiated? (click/keyboard event)
3. Check console for error messages
4. Try the error message for guidance

### Issue: Smooth scrolling not working on iOS
**Check:**
1. iOS version: `detectBrowser().iOSVersion`
2. If iOS < 13, smooth scrolling is limited
3. Momentum scrolling should still work

### Issue: Cannot access iframe content
**Check:**
1. Same origin? Cross-origin access is blocked
2. CSP headers? May block iframe access
3. Use `waitForIFrameReady()` before accessing
4. Check `errorType` in result for specific issue

### Issue: Browser warning not showing
**Check:**
1. LocalStorage: Check for `browser-warning-dismissed`
2. Clear it: `localStorage.removeItem('browser-warning-dismissed')`
3. Browser is actually outdated/unsupported
4. Refresh page

## Testing Tips

### Manual Testing
```typescript
// Force browser warning (dev only)
localStorage.removeItem('browser-warning-dismissed');
location.reload();

// Test fullscreen error path
const result = await requestFullscreen();
console.log(result);

// Test iframe error handling
const badIframe = document.createElement('iframe');
badIframe.src = 'https://different-origin.com';
const result = await waitForIFrameReady(badIframe, 1000);
console.log(result.errorType); // 'timeout' or 'cross-origin'
```

### Mock Browser Detection
```typescript
// In tests, mock navigator.userAgent
Object.defineProperty(navigator, 'userAgent', {
  value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X)',
  configurable: true
});

const browser = detectBrowser();
expect(browser.isIOS).toBe(true);
expect(browser.iOSVersion).toBe('12.0');
```

## Performance

All utilities are optimized for performance:
- **Browser detection**: Runs once per component mount
- **Event listeners**: Properly cleaned up
- **No dependencies**: Zero external packages
- **Tree-shakeable**: Only import what you use
- **Bundle size**: ~1.5 KB minified + gzipped

## Security

All utilities follow security best practices:
- **CSP-safe**: No eval or inline scripts
- **Cross-origin safe**: All access wrapped in try-catch
- **XSS-safe**: No DOM manipulation from external sources
- **Type-safe**: Full TypeScript coverage

## Migration from Old Code

### Before
```typescript
// ❌ Old way - no error handling
if (!document.fullscreenElement) {
  document.documentElement.requestFullscreen();
}

// ❌ Old way - deprecated
style={{ WebkitOverflowScrolling: 'touch' }}
```

### After
```typescript
// ✅ New way - with error handling
const result = await toggleFullscreen();
if (!result.success) {
  showError(result.message);
}

// ✅ New way - modern APIs
style={getScrollStyles({ enableMomentum: true })}
```

## Additional Resources

- [MDN: Fullscreen API](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API)
- [MDN: iframe](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe)
- [iOS Safari CSS Support](https://caniuse.com/?search=overflow-scrolling)
- [Browser Support Tables](https://caniuse.com/)

---

**Questions?** Check the full implementation guide at `docs/TRACK1-IMPLEMENTATION.md`
