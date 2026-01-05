# Implementation Plan: 5 Presentation Mode Enhancements

## Overview
Implementing 5 professional enhancements to PresentationMode.tsx based on comprehensive codebase exploration.

## Architecture Context

### Current State (from exploration):
- **File**: `components/PresentationMode.tsx` (~2000 lines)
- **State Hooks**: 20+ useState hooks managing UI panels, settings, and features
- **Keyboard Shortcuts**: 26 shortcuts already mapped (Space, Arrow keys, F, P, D, G, etc.)
- **Z-Index Layers**:
  - z-40: Bottom control bar
  - z-30: Floating panels (drawing, notes)
  - z-[50-70]: Modal overlays (thumbnails z-50, timer z-60, bookmarks z-70)
  - z-[100]: Transient effects (laser pointer)
- **localStorage Pattern**: Settings stored in `presentgenius-presentation-settings`, bookmarks in `presentgenius-bookmarks-${id}`
- **Slide Storage**: Slides live in iframe DOM, queried via `body > section, [data-slide], .slide`

---

## Enhancement 1: Keyboard Shortcuts Overlay

### Goal
Press '?' to show a modal overlay with all 26+ keyboard shortcuts

### Implementation

**1.1 Add State Hook** (after line 155):
```typescript
const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
```

**1.2 Add Keyboard Handler** (in switch statement, line ~580):
```typescript
case '?':
  e.preventDefault();
  setShowKeyboardHelp(prev => !prev);
  break;
```

**1.3 Update Escape Handler** (line 453-460):
```typescript
case 'Escape':
  e.preventDefault();
  if (showKeyboardHelp) {
    setShowKeyboardHelp(false);
  } else if (showBookmarkManager) {
    // existing logic...
  }
  break;
```

**1.4 Add to Keyboard Handler Dependencies** (line 612-633):
```typescript
useEffect(() => {
  // existing code
}, [
  // existing deps,
  showKeyboardHelp, // ADD THIS
]);
```

**1.5 Create Shortcuts Data Structure** (before component return):
```typescript
const keyboardShortcuts = [
  { category: 'Navigation', shortcuts: [
    { key: '←/→ or Page Up/Down', action: 'Previous/Next slide' },
    { key: 'Space', action: 'Next (or reveal/scroll)' },
    { key: 'Home/End', action: 'Scroll to top/bottom' },
    { key: 'Ctrl+Home/End', action: 'First/Last slide' },
    { key: 'G', action: 'Thumbnail grid view' },
  ]},
  { category: 'Presentation', shortcuts: [
    { key: 'F', action: 'Toggle fullscreen' },
    { key: 'P', action: 'Auto-play mode' },
    { key: 'Esc', action: 'Exit presentation' },
  ]},
  { category: 'Tools', shortcuts: [
    { key: 'D', action: 'Toggle drawing mode' },
    { key: 'L', action: 'Laser pointer' },
    { key: 'B', action: 'Quick bookmark (star)' },
    { key: 'Shift+B', action: 'Bookmark manager' },
  ]},
  { category: 'View', shortcuts: [
    { key: 'N', action: 'Speaker notes panel' },
    { key: 'M', action: 'Notes editor' },
    { key: 'S', action: 'Split-screen mode' },
    { key: 'T', action: 'Timer settings' },
    { key: 'Q', action: 'QR code for sync' },
  ]},
  { category: 'Zoom', shortcuts: [
    { key: '+/=', action: 'Zoom in' },
    { key: '-/_', action: 'Zoom out' },
    { key: '0', action: 'Reset zoom' },
  ]},
  { category: 'Advanced', shortcuts: [
    { key: 'R', action: 'Progressive disclosure' },
    { key: 'V', action: 'Picture-in-Picture video' },
    { key: 'Shift+N', action: 'Mini-map navigation' },
  ]},
];
```

**1.6 Render Modal** (after line 1710, before laser pointer):
```typescript
{/* Keyboard Shortcuts Help - Press ? */}
{showKeyboardHelp && (
  <div className="absolute inset-0 bg-black/90 backdrop-blur-xl z-[55] flex items-center justify-center overflow-y-auto p-8">
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 max-w-4xl w-full border border-white/10 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <span className="text-4xl">⌨️</span>
          Keyboard Shortcuts
        </h2>
        <button
          onClick={() => setShowKeyboardHelp(false)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <XMarkIcon className="w-6 h-6 text-white/60 hover:text-white" />
        </button>
      </div>

      {/* Shortcuts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {keyboardShortcuts.map((category) => (
          <div key={category.category} className="space-y-3">
            <h3 className="text-cyan-400 font-semibold text-sm uppercase tracking-wider">
              {category.category}
            </h3>
            <div className="space-y-2">
              {category.shortcuts.map((shortcut, idx) => (
                <div key={idx} className="flex items-center justify-between gap-4 p-2 rounded-lg hover:bg-white/5">
                  <kbd className="px-3 py-1.5 bg-slate-700/50 rounded-lg text-white/90 font-mono text-sm border border-white/10 min-w-[120px] text-center">
                    {shortcut.key}
                  </kbd>
                  <span className="text-slate-300 text-sm flex-1">
                    {shortcut.action}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Tip */}
      <div className="mt-8 pt-6 border-t border-white/10 text-center">
        <p className="text-slate-400 text-sm">
          Press <kbd className="px-2 py-1 bg-slate-700 rounded text-xs">?</kbd> anytime to toggle this help
        </p>
      </div>
    </div>
  </div>
)}
```

**Estimated Time**: 30 minutes
**Files Modified**: `components/PresentationMode.tsx`

---

## Enhancement 2: Auto-save Presentation State

### Goal
Auto-save current slide, zoom levels, bookmarks, drawings, and settings to localStorage every 5 seconds

### Implementation

**2.1 Extend Settings Interface** (near localStorage constants):
```typescript
interface PresentationState {
  presentationId: string;
  currentSlide: number;
  slideZoomLevels: {[key: number]: number};
  bookmarks: any[];
  timestamp: number;
  transitionType: string;
  autoAdvanceInterval: number;
  // Drawing canvas as base64
  canvasDataURL?: string;
}
```

**2.2 Add Auto-save Effect** (after existing localStorage effects):
```typescript
// Auto-save presentation state every 5 seconds
useEffect(() => {
  const saveState = () => {
    try {
      const state: PresentationState = {
        presentationId: presentationId || 'default',
        currentSlide,
        slideZoomLevels,
        bookmarks: bookmarks || [],
        timestamp: Date.now(),
        transitionType,
        autoAdvanceInterval,
      };

      // Save canvas drawing if exists
      if (canvasRef.current) {
        try {
          state.canvasDataURL = canvasRef.current.toDataURL();
        } catch (e) {
          console.warn('Could not save canvas state:', e);
        }
      }

      const stateKey = `presentgenius-state-${presentationId || 'default'}`;
      localStorage.setItem(stateKey, JSON.stringify(state));
      console.log('[Auto-save] Presentation state saved');
    } catch (error) {
      console.error('[Auto-save] Failed to save state:', error);
    }
  };

  // Save every 5 seconds
  const interval = setInterval(saveState, 5000);

  // Also save on unmount
  return () => {
    clearInterval(interval);
    saveState();
  };
}, [currentSlide, slideZoomLevels, bookmarks, transitionType, autoAdvanceInterval, presentationId]);
```

**2.3 Add Restore Effect** (on component mount):
```typescript
// Restore presentation state on mount
useEffect(() => {
  const restoreState = () => {
    try {
      const stateKey = `presentgenius-state-${presentationId || 'default'}`;
      const savedState = localStorage.getItem(stateKey);

      if (savedState) {
        const state: PresentationState = JSON.parse(savedState);

        // Restore current slide (with bounds check)
        if (state.currentSlide >= 0 && state.currentSlide < totalSlides) {
          setCurrentSlide(state.currentSlide);
        }

        // Restore zoom levels
        if (state.slideZoomLevels) {
          setSlideZoomLevels(state.slideZoomLevels);
        }

        // Restore settings
        if (state.transitionType) {
          setTransitionType(state.transitionType);
        }
        if (state.autoAdvanceInterval) {
          setAutoAdvanceInterval(state.autoAdvanceInterval);
        }

        // Restore canvas drawings
        if (state.canvasDataURL && canvasRef.current) {
          const img = new Image();
          img.onload = () => {
            const ctx = canvasRef.current?.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
            }
          };
          img.src = state.canvasDataURL;
        }

        console.log('[Auto-restore] Restored from session:', new Date(state.timestamp));

        // Show toast notification
        // TODO: Add toast notification component
      }
    } catch (error) {
      console.error('[Auto-restore] Failed to restore state:', error);
    }
  };

  // Only restore once on mount
  restoreState();
}, [presentationId]); // Don't include other deps - only run once
```

**2.4 Add Clear State on Exit** (in onClose handler):
```typescript
const handleClose = () => {
  // Ask user if they want to keep the saved state
  const keepState = confirm('Keep your presentation state for next time?');

  if (!keepState) {
    const stateKey = `presentgenius-state-${presentationId || 'default'}`;
    localStorage.removeItem(stateKey);
  }

  onClose();
};
```

**2.5 Add State Indicator** (in bottom control bar, after slide counter):
```typescript
{/* Auto-save Indicator */}
<div className="ml-3 pl-3 border-l border-white/20">
  <span className="text-[10px] text-green-400/60 flex items-center gap-1">
    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
    Auto-saved
  </span>
</div>
```

**Estimated Time**: 1 hour
**Files Modified**: `components/PresentationMode.tsx`

---

## Enhancement 3: Next Slide Preview (Picture-in-Picture)

### Goal
Show a small preview of the next slide in the corner (toggle with 'V' key - but V is taken, use 'X')

### Implementation

**3.1 Add State Hook**:
```typescript
const [showNextPreview, setShowNextPreview] = useState(false);
```

**3.2 Add Keyboard Handler** (case 'x'):
```typescript
case 'x':
case 'X':
  e.preventDefault();
  setShowNextPreview(prev => !prev);
  break;
```

**3.3 Helper Function to Get Next Slide HTML**:
```typescript
const getNextSlideHTML = useCallback(() => {
  if (!iframeRef.current || currentSlide >= totalSlides - 1) {
    return null;
  }

  const doc = iframeRef.current.contentDocument;
  if (!doc) return null;

  const slides = doc.querySelectorAll('body > section, [data-slide], .slide');
  const nextSlide = slides[currentSlide + 1];

  if (!nextSlide) return null;

  // Clone the slide to preserve original
  const clone = nextSlide.cloneNode(true) as HTMLElement;

  // Create mini HTML document
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body { margin: 0; overflow: hidden; }
          section {
            transform: scale(0.25);
            transform-origin: top left;
            width: 400%;
            height: 400%;
          }
        </style>
      </head>
      <body>${clone.outerHTML}</body>
    </html>
  `;
}, [currentSlide, totalSlides]);
```

**3.4 Render Preview Panel** (after drawing controls, before laser):
```typescript
{/* Next Slide Preview - Press X */}
{showNextPreview && currentSlide < totalSlides - 1 && (
  <div className="absolute bottom-24 right-4 z-35 group">
    {/* Preview Container */}
    <div className="bg-black/80 backdrop-blur-sm rounded-xl p-3 border border-white/20 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-white/50 font-mono uppercase tracking-wider">
          Next: Slide {currentSlide + 2}
        </span>
        <button
          onClick={() => setShowNextPreview(false)}
          className="p-1 hover:bg-white/10 rounded transition-colors"
        >
          <XMarkIcon className="w-3 h-3 text-white/40 hover:text-white/80" />
        </button>
      </div>

      {/* Preview iframe */}
      <div className="relative w-64 h-36 bg-white rounded overflow-hidden border border-white/10">
        <iframe
          srcDoc={getNextSlideHTML() || ''}
          className="w-full h-full pointer-events-none"
          sandbox="allow-same-origin"
          title="Next Slide Preview"
        />
      </div>

      {/* Keyboard hint */}
      <div className="mt-2 text-center">
        <span className="text-[10px] text-white/30">
          Press <kbd className="px-1 bg-slate-700 rounded text-[9px]">X</kbd> to toggle
        </span>
      </div>
    </div>
  </div>
)}
```

**3.5 Add Toggle Button** (in bottom control bar, right section):
```typescript
<button
  onClick={() => setShowNextPreview(!showNextPreview)}
  className={`p-2 rounded-lg transition-colors ${
    showNextPreview ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-white/60 hover:text-white'
  }`}
  title="Next Slide Preview (X)"
>
  <EyeIcon className="w-4 h-4" />
</button>
```

**Estimated Time**: 45 minutes
**Files Modified**: `components/PresentationMode.tsx`

---

## Enhancement 4: Enhanced Grid View with Slide Previews

### Goal
Improve existing thumbnail grid (G key) to show actual slide previews instead of just numbers

### Current State
Lines 1675-1710: Grid shows slide numbers centered, not actual content

### Implementation

**4.1 Helper Function to Get Slide Preview HTML**:
```typescript
const getSlidePreviewHTML = useCallback((slideIndex: number) => {
  if (!iframeRef.current) return null;

  const doc = iframeRef.current.contentDocument;
  if (!doc) return null;

  const slides = doc.querySelectorAll('body > section, [data-slide], .slide');
  const slide = slides[slideIndex];

  if (!slide) return null;

  const clone = slide.cloneNode(true) as HTMLElement;

  // Create scaled-down preview
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body {
            margin: 0;
            overflow: hidden;
            background: white;
          }
          section {
            transform: scale(0.15);
            transform-origin: top left;
            width: 666%;
            height: 666%;
          }
        </style>
      </head>
      <body>${clone.outerHTML}</body>
    </html>
  `;
}, []);
```

**4.2 Update Thumbnail Rendering** (replace lines 1685-1709):
```typescript
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
  {Array.from({ length: totalSlides }, (_, i) => (
    <button
      key={i}
      onClick={() => {
        setCurrentSlide(i);
        setShowThumbnails(false);
      }}
      className={`
        group relative aspect-video rounded-lg overflow-hidden transition-all
        ${i === currentSlide
          ? 'ring-4 ring-cyan-400 scale-105 shadow-xl shadow-cyan-400/20'
          : 'ring-1 ring-white/10 hover:ring-2 hover:ring-white/30 hover:scale-102'
        }
      `}
    >
      {/* Slide Preview iframe */}
      <div className="w-full h-full bg-white">
        <iframe
          srcDoc={getSlidePreviewHTML(i) || ''}
          className="w-full h-full pointer-events-none"
          sandbox="allow-same-origin"
          title={`Slide ${i + 1} Preview`}
        />
      </div>

      {/* Overlay with slide number */}
      <div className={`
        absolute inset-0 flex items-center justify-center
        bg-gradient-to-t from-black/60 via-transparent to-transparent
        opacity-0 group-hover:opacity-100 transition-opacity
      `}>
        <span className="absolute bottom-2 left-2 text-xs font-mono text-white bg-black/50 px-2 py-1 rounded">
          {i + 1}
        </span>
      </div>

      {/* Current slide indicator */}
      {i === currentSlide && (
        <div className="absolute top-2 right-2">
          <div className="bg-cyan-400 text-black text-xs font-bold px-2 py-1 rounded-full">
            Current
          </div>
        </div>
      )}

      {/* Bookmark indicator */}
      {hasBookmark(i) && (
        <div className="absolute top-2 left-2">
          <span className="text-yellow-400 text-lg">⭐</span>
        </div>
      )}
    </button>
  ))}
</div>
```

**Estimated Time**: 1.5 hours
**Files Modified**: `components/PresentationMode.tsx`

---

## Enhancement 5: Presenter View (Dual Screen)

### Goal
Open a separate window showing: current slide, next slide preview, speaker notes, and timer

### Implementation

**5.1 Add State**:
```typescript
const [presenterWindow, setPresenterWindow] = useState<Window | null>(null);
```

**5.2 Add Keyboard Handler** (Shift+P):
```typescript
case 'P':
  if (e.shiftKey) {
    e.preventDefault();
    openPresenterView();
  } else {
    // Existing play toggle
    e.preventDefault();
    setIsPlaying(!isPlaying);
  }
  break;
```

**5.3 Presenter View Opening Function**:
```typescript
const openPresenterView = useCallback(() => {
  // Close existing window if open
  if (presenterWindow && !presenterWindow.closed) {
    presenterWindow.close();
  }

  // Open new window
  const width = 1280;
  const height = 800;
  const left = window.screen.width - width;
  const top = 0;

  const newWindow = window.open(
    '',
    'presenter-view',
    `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
  );

  if (!newWindow) {
    alert('Please allow popups to use Presenter View');
    return;
  }

  setPresenterWindow(newWindow);

  // Build presenter view HTML
  const presenterHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Presenter View - Slide ${currentSlide + 1}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body { margin: 0; background: #0f172a; font-family: system-ui; }
        </style>
      </head>
      <body class="p-4">
        <div class="grid grid-cols-2 gap-4 h-screen">
          <!-- Left Column: Current & Next Slides -->
          <div class="space-y-4">
            <!-- Current Slide -->
            <div class="bg-slate-800 rounded-xl p-4 h-[60%]">
              <h3 class="text-white text-sm font-semibold mb-2 flex items-center justify-between">
                <span>Current Slide ${currentSlide + 1}</span>
                <span class="text-cyan-400 text-xs">LIVE</span>
              </h3>
              <iframe
                id="current-slide"
                class="w-full h-[calc(100%-2rem)] bg-white rounded"
                sandbox="allow-same-origin"
              ></iframe>
            </div>

            <!-- Next Slide Preview -->
            <div class="bg-slate-800 rounded-xl p-4 h-[35%]">
              <h3 class="text-white/60 text-sm font-semibold mb-2">
                Next: Slide ${currentSlide + 2}
              </h3>
              <iframe
                id="next-slide"
                class="w-full h-[calc(100%-2rem)] bg-white rounded opacity-75"
                sandbox="allow-same-origin"
              ></iframe>
            </div>
          </div>

          <!-- Right Column: Timer & Notes -->
          <div class="space-y-4">
            <!-- Timer -->
            <div class="bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl p-6 text-center">
              <div id="timer" class="text-7xl font-mono font-bold text-white mb-2">
                00:00:00
              </div>
              <div class="text-cyan-100 text-sm">Elapsed Time</div>
            </div>

            <!-- Speaker Notes -->
            <div class="bg-slate-800 rounded-xl p-4 flex-1 overflow-auto">
              <h3 class="text-white text-sm font-semibold mb-3">Speaker Notes</h3>
              <div id="speaker-notes" class="text-slate-300 text-sm leading-relaxed">
                ${speakerNotes[currentSlide] || '<em class="text-slate-500">No notes for this slide</em>'}
              </div>
            </div>

            <!-- Progress -->
            <div class="bg-slate-800 rounded-xl p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-white/60 text-xs">Progress</span>
                <span class="text-white text-sm font-mono">
                  ${currentSlide + 1} / ${totalSlides}
                </span>
              </div>
              <div class="w-full bg-slate-700 rounded-full h-2">
                <div
                  class="bg-cyan-400 h-2 rounded-full transition-all"
                  style="width: ${((currentSlide + 1) / totalSlides) * 100}%"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <script>
          // Listen for updates from main window
          window.addEventListener('message', (event) => {
            if (event.data.type === 'slide-update') {
              const { currentSlide, nextSlide, notes, elapsed } = event.data;

              // Update iframes
              document.getElementById('current-slide').srcdoc = currentSlide;
              document.getElementById('next-slide').srcdoc = nextSlide;

              // Update notes
              document.getElementById('speaker-notes').innerHTML = notes ||
                '<em class="text-slate-500">No notes for this slide</em>';

              // Update timer
              const hours = Math.floor(elapsed / 3600);
              const minutes = Math.floor((elapsed % 3600) / 60);
              const seconds = elapsed % 60;
              document.getElementById('timer').textContent =
                \`\${String(hours).padStart(2, '0')}:\${String(minutes).padStart(2, '0')}:\${String(seconds).padStart(2, '0')}\`;
            }
          });
        </script>
      </body>
    </html>
  `;

  newWindow.document.write(presenterHTML);
  newWindow.document.close();

  // Send initial state
  sendPresenterUpdate(newWindow);
}, [currentSlide, totalSlides, speakerNotes, presenterWindow]);
```

**5.4 Sync Function**:
```typescript
const sendPresenterUpdate = useCallback((window: Window) => {
  if (!window || window.closed) return;

  const currentSlideHTML = getSlidePreviewHTML(currentSlide);
  const nextSlideHTML = getSlidePreviewHTML(currentSlide + 1);

  window.postMessage({
    type: 'slide-update',
    currentSlide: currentSlideHTML,
    nextSlide: nextSlideHTML,
    notes: speakerNotes[currentSlide] || '',
    elapsed: elapsedTime,
  }, '*');
}, [currentSlide, speakerNotes, elapsedTime]);

// Sync on slide change
useEffect(() => {
  if (presenterWindow && !presenterWindow.closed) {
    sendPresenterUpdate(presenterWindow);
  }
}, [currentSlide, elapsedTime, presenterWindow, sendPresenterUpdate]);
```

**5.5 Add Button to Control Bar**:
```typescript
<button
  onClick={openPresenterView}
  className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
  title="Presenter View (Shift+P)"
>
  <ComputerDesktopIcon className="w-4 h-4" />
</button>
```

**Estimated Time**: 3-4 hours
**Files Modified**: `components/PresentationMode.tsx`

---

## Testing Plan

### Enhancement 1: Keyboard Shortcuts
- [ ] Press '?' - help modal appears
- [ ] Press '?' again - modal closes
- [ ] Press Escape - modal closes
- [ ] All shortcuts listed and accurate
- [ ] Modal scrollable on small screens

### Enhancement 2: Auto-save
- [ ] State saves every 5 seconds
- [ ] Current slide restored on reload
- [ ] Zoom levels persist
- [ ] Bookmarks persist
- [ ] Canvas drawings persist
- [ ] Green "Auto-saved" indicator visible
- [ ] Prompt on exit asks to keep state

### Enhancement 3: Next Slide Preview
- [ ] Press 'X' - preview appears bottom-right
- [ ] Shows correct next slide
- [ ] Last slide hides preview
- [ ] Preview updates on navigation
- [ ] Button in control bar toggles it
- [ ] No performance lag with preview active

### Enhancement 4: Enhanced Grid
- [ ] Press 'G' - grid shows actual slide previews
- [ ] Current slide highlighted with cyan ring
- [ ] Bookmarked slides show star icon
- [ ] Click slide navigates and closes grid
- [ ] Responsive grid (2-5 columns based on screen)
- [ ] Slide previews render correctly

### Enhancement 5: Presenter View
- [ ] Press Shift+P - new window opens
- [ ] Current slide shows in left panel
- [ ] Next slide preview shows below
- [ ] Timer counts elapsed time
- [ ] Speaker notes display for current slide
- [ ] Progress bar shows completion %
- [ ] Window syncs on slide navigation
- [ ] Window syncs timer updates
- [ ] Multiple screens work correctly

---

## Implementation Order

1. **Keyboard Shortcuts Overlay** (30 min) ⭐ Quick win
2. **Auto-save State** (1 hour) ⭐ Critical reliability
3. **Next Slide Preview** (45 min) ⭐ Easy professional feature
4. **Enhanced Grid View** (1.5 hours) ⭐ Major UX improvement
5. **Presenter View** (3-4 hours) ⭐ Advanced professional feature

**Total Estimated Time**: 6.5-7.5 hours

---

## Files to Modify

- `components/PresentationMode.tsx` - All 5 enhancements

## New Dependencies

None required - all features use existing libraries and patterns.

---

## Success Criteria

- [ ] All 5 enhancements implemented and tested
- [ ] No keyboard shortcut conflicts
- [ ] No z-index layer conflicts
- [ ] localStorage usage optimized (no excessive writes)
- [ ] No performance degradation
- [ ] All features accessible via keyboard
- [ ] UI consistent with existing design language
- [ ] Mobile-responsive where applicable
