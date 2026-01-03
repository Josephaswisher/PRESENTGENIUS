# Mobile Layout Reference - PresentGenius

## Desktop Layout (≥768px)

```
┌─────────────────────────────────────────────────────────┐
│  Header (Present, Settings, Export)                    │
├─────────────────────────┬───────────────────────────────┤
│                         │                               │
│  Live Preview           │  Chat Assistant               │
│  ┌──────────┬─────────┐ │  ┌──────────────────────────┐ │
│  │ Original │ Preview │ │  │ Refine Presentation      │ │
│  │  Image   │  HTML   │ │  │                          │ │
│  │          │ Iframe  │ │  │ Messages                 │ │
│  │          │         │ │  │ ...                      │ │
│  │          │         │ │  │                          │ │
│  │          │         │ │  │ Input                    │ │
│  └──────────┴─────────┘ │  └──────────────────────────┘ │
│                         │                               │
└─────────────────────────┴───────────────────────────────┘
```

## Mobile Layout (<768px)

```
┌───────────────────────────┐
│  Header (Compact)         │
├───────────────────────────┤
│                           │
│  Live Preview             │
│  ┌───────────────────────┐│
│  │  Original Image       ││ ← 50% height
│  │  (Top Panel)          ││
│  │  Scrollable           ││
│  └───────────────────────┘│
│  ┌───────────────────────┐│
│  │  Preview HTML         ││ ← 50% height
│  │  (Bottom Panel)       ││
│  │  Iframe - Scrollable  ││
│  │  with webkit touch    ││
│  └───────────────────────┘│
│                           │
│  Chat Assistant HIDDEN    │
│                           │
└───────────────────────────┘
```

## Presentation Mode (All Devices)

```
┌───────────────────────────────────────┐
│  Fullscreen                           │
│  ┌─────────────────────────────────┐  │
│  │                                 │  │
│  │  Presentation Iframe            │  │
│  │  (Full viewport)                │  │
│  │  Touch-enabled scrolling        │  │
│  │  Swipe navigation               │  │
│  │                                 │  │
│  └─────────────────────────────────┘  │
│  [Controls - Auto-hide]               │
└───────────────────────────────────────┘
```

## Component Hierarchy

### Desktop Flow
```
App.tsx
├── Header
├── Workspace (flex-row)
│   ├── LivePreview (flex-1)
│   │   ├── Preview Header
│   │   ├── Content (flex-row)
│   │   │   ├── Original Image (50% width)
│   │   │   └── Preview Iframe (50% width)
│   │   └── Overlays
│   └── ChatPanel (w-[32rem], visible)
└── Modals
```

### Mobile Flow
```
App.tsx
├── Header
├── Workspace (flex-col) ← Changed
│   ├── LivePreview (flex-1)
│   │   ├── Preview Header
│   │   ├── Content (flex-col) ← Changed
│   │   │   ├── Original Image (50% height) ← Changed
│   │   │   └── Preview Iframe (50% height) ← Changed
│   │   │       └── WebkitOverflowScrolling: touch
│   │   └── Overlays
│   └── ChatPanel (hidden) ← Changed
└── Modals
```

## Scrolling Behavior

### Desktop
- **Original Image Panel**: Scroll within panel if image larger than container
- **Preview Iframe**: Standard browser scrolling
- **Chat Panel**: Scrollable message list

### Mobile (iOS)
- **Original Image Panel**:
  - `overflow-auto`
  - `-webkit-overflow-scrolling: touch` (momentum scrolling)
  - `overscroll-behavior: contain` (prevent parent bounce)

- **Preview Iframe**:
  - `WebkitOverflowScrolling: 'touch'` (smooth iOS scrolling)
  - `touchAction: 'pan-y'` (vertical-only touch gestures)
  - `overflowY: 'auto'` (vertical scroll)
  - `overflowX: 'hidden'` (prevent horizontal scroll)

### Mobile (Android)
- **All Scrollable Elements**:
  - Standard CSS `overflow` properties work
  - No webkit prefixes needed
  - `touch-action: pan-y` for gesture control

## Responsive Breakpoints

| Breakpoint | Width    | Layout Type        | Chat Panel |
|------------|----------|-------------------|------------|
| Mobile     | < 768px  | Vertical Stack    | Hidden     |
| Tablet     | ≥ 768px  | Horizontal Split  | Visible    |
| Desktop    | ≥ 1024px | Horizontal Split  | Visible    |

## CSS Classes Applied

### Mobile-Specific
```css
/* Main Workspace */
flex flex-col md:flex-row    /* Stack on mobile, split on desktop */
overflow-hidden              /* Prevent overflow */

/* Live Preview Container */
md:border-r                  /* Border only on desktop */
overflow-hidden              /* Contain scrolling */

/* Chat Panel */
hidden md:flex               /* Hidden on mobile */

/* Preview Content Area */
flex-col md:flex-row         /* Vertical on mobile, horizontal on desktop */
overscroll-contain          /* Prevent bounce to parent */

/* Iframe */
border-0                     /* Remove default border */
```

### iOS-Specific Inline Styles
```jsx
style={{
  WebkitOverflowScrolling: 'touch',  // Momentum scrolling
  overflowY: 'auto',                  // Allow vertical scroll
  overflowX: 'hidden',                // Block horizontal scroll
  touchAction: 'pan-y'                // Vertical touch gestures only
}}
```

## Touch Zones (Presentation Mode)

```
┌───────────────────────────────────┐
│  ← Previous   │  Info  │  Next →  │
│   (1/3 width) │ (1/3)  │ (1/3)    │
│                                   │
│  Tap left to go back              │
│  Tap right to advance             │
│  Tap center for info/controls     │
│                                   │
└───────────────────────────────────┘
```

## Viewport Calculations

### Mobile Height
```css
height: 100vh;        /* Fallback */
height: 100dvh;       /* Dynamic viewport (accounts for browser chrome) */
```

### Safe Areas (iOS Notch/Home Indicator)
```css
padding-top: env(safe-area-inset-top, 0px);
padding-bottom: env(safe-area-inset-bottom, 0px);
```

## Performance Optimizations

### CSS Containment
- Use `overflow: hidden` on containers to create stacking contexts
- Prevents layout thrashing during scroll
- Improves paint performance

### Touch Optimization
- `touch-action: pan-y` limits gesture processing to vertical
- Reduces browser work on touch events
- Prevents zoom/pinch gestures

### Hardware Acceleration
- Iframe scrolling uses GPU on iOS with webkit prefix
- Smooth 60fps scrolling on most devices

## Known Limitations

### Mobile
- Chat assistant not available (hidden due to space constraints)
- Split view uses vertical stack (not side-by-side)
- Some buttons may be hidden or collapsed

### Desktop
- No changes to existing behavior
- All features remain available

## Migration Path

If you need to show chat on mobile in the future:

1. **Bottom Sheet Pattern**
   ```jsx
   // Add toggle button in header
   <button onClick={() => setShowMobileChat(true)}>
     Chat
   </button>

   // Render as overlay
   {showMobileChat && (
     <div className="fixed inset-x-0 bottom-0 h-2/3
                     bg-zinc-900 rounded-t-2xl shadow-2xl
                     animate-slide-in-bottom">
       <ChatPanel />
     </div>
   )}
   ```

2. **Tab Pattern**
   ```jsx
   <div className="md:hidden">
     <Tabs>
       <Tab>Preview</Tab>
       <Tab>Chat</Tab>
     </Tabs>
   </div>
   ```

---

**Diagram Legend:**
- `┌─┐└─┘` = Container boundaries
- `│` = Vertical divider
- `←` `→` = Touch zones
- `...` = Scrollable content

**Last Updated**: 2026-01-03
