# UI Preview - Storage Management

## Settings Panel - Local Storage Section

### Location
Settings Icon (top right) → Settings Panel → "Local Storage" section

### Visual Layout

```
┌────────────────────────────────────────────────────────────┐
│ ⚙️  Settings                                          ✕    │
│ Configure your preferences                                 │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ ... (Appearance, Auto-Save, Content Settings) ...         │
│                                                            │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ LOCAL STORAGE                                        │ │
│ ├──────────────────────────────────────────────────────┤ │
│ │                                                      │ │
│ │  Presentations stored:               3              │ │
│ │  Storage used:                       142KB / 5MB    │ │
│ │                                                      │ │
│ │  Usage                                        2%    │ │
│ │  ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░       │ │
│ │  └─ Cyan (under 60%)                                │ │
│ │                                                      │ │
│ │  ─────────────────────────────────────────────────  │ │
│ │                                                      │ │
│ │  ┌──────────────────────────────────────────────┐  │ │
│ │  │  🗑️  Clear Local Storage                    │  │ │
│ │  └──────────────────────────────────────────────┘  │ │
│ │  └─ Red button, click to clear                     │ │
│ │                                                      │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                            │
│ ... (API Configuration) ...                               │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### State 1: Normal Usage (<60%)

```
Presentations stored:               12
Storage used:                       1.2MB / 5MB

Usage                                     24%
█████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
└─ Cyan progress bar
```

### State 2: Moderate Usage (60-80%)

```
Presentations stored:               45
Storage used:                       3.5MB / 5MB

Usage                                     70%
████████████████████████████░░░░░░░░░░░░░░
└─ Amber progress bar
```

### State 3: High Usage (>80%) - Shows Warning

```
Presentations stored:               82
Storage used:                       4.3MB / 5MB

Usage                                     86%
███████████████████████████████████░░░░░░░
└─ Red progress bar

┌──────────────────────────────────────────────┐
│ ⚠️ Storage is getting full. Consider        │
│ clearing old presentations or the app will  │
│ automatically remove oldest items.          │
└──────────────────────────────────────────────┘
└─ Amber warning box
```

## Clear Confirmation Flow

### Step 1: Initial State
```
┌──────────────────────────────────────────────┐
│  🗑️  Clear Local Storage                    │
└──────────────────────────────────────────────┘
```

### Step 2: After Click (Confirmation)
```
┌──────────────────────────────────────────────┐
│ ⚠️ This will delete all locally stored      │
│ presentations. This action cannot be undone. │
├──────────────────────────────────────────────┤
│  ┌──────────┐  ┌────────────────────────┐   │
│  │  Cancel  │  │  Clear Now             │   │
│  └──────────┘  └────────────────────────┘   │
│  └─ Gray      └─ Red (destructive)          │
└──────────────────────────────────────────────┘
```

### Step 3: After Confirm
```
→ clearHistory() called
→ window.location.reload()
→ Page refreshes
→ History is empty
```

## Console Output Examples

### Successful Load
```javascript
[App] Loaded 12 presentations from localStorage
[App] Storage: 12 items, 1234KB (24%)
```

### Migration
```javascript
[Storage] Migrated from old storage key
[App] Loaded 8 presentations from localStorage
```

### Quota Warning
```javascript
[Storage] Trimmed to 95 items (4012KB)
[App] Storage warning: Storage quota reached. Kept 95 most recent presentations.
```

### Save Error
```javascript
[App] Failed to save history: Storage quota exceeded. History cleared. Please reduce file sizes or clear browser data.
```

## Visual Design Tokens

### Colors

**Storage Indicator:**
- Green/Cyan: `bg-cyan-500` (0-60% usage)
- Amber: `bg-amber-500` (60-80% usage)
- Red: `bg-red-500` (80-100% usage)

**Clear Button:**
- Background: `bg-red-500/10` hover `bg-red-500/20`
- Text: `text-red-400`
- Border: `border-red-500/30`

**Warning Box:**
- Background: `bg-amber-500/10`
- Border: `border-amber-500/30`
- Text: `text-amber-400`

### Typography
- Section title: `text-sm font-semibold uppercase tracking-wider`
- Stats labels: `text-sm text-zinc-400`
- Stats values: `text-white font-medium`
- Warning text: `text-xs text-amber-400`

### Spacing
- Section spacing: `space-y-3`
- Inner padding: `p-4`
- Border radius: `rounded-xl`
- Progress bar height: `h-2`

## Accessibility

### Keyboard Navigation
- Tab through all interactive elements
- Enter/Space to activate buttons
- Clear confirmation can be canceled with Escape

### Screen Readers
- "Settings" dialog announced
- "Local Storage" section announced
- Button roles properly set
- Warning announced when shown

### Visual Indicators
- Color + text (not color alone)
- Progress bar has percentage label
- Clear button has icon + text
- Confirmation has explicit warning text

## Responsive Behavior

### Desktop (>768px)
- Full settings panel (2xl max width)
- All stats side-by-side
- Progress bar full width

### Mobile (<768px)
- Settings panel full screen
- Stats stack vertically
- Progress bar full width
- Buttons full width

## Animation/Transitions

### Settings Panel Open
- Fade in backdrop: `bg-black/60`
- Slide in panel: `transition-all`

### Progress Bar
- Smooth width changes: `transition-all`
- Color transitions on threshold changes

### Clear Confirmation
- Instant show (no animation)
- Buttons have hover states

## Integration Points

### App.tsx Integration
```typescript
// On mount
useEffect(() => {
  migrateOldStorage();
  const history = loadHistory();
  setHistory(history);

  const stats = getStorageStats();
  console.log(`Storage: ${stats.itemCount} items`);
}, []);

// On history change
useEffect(() => {
  const result = saveHistory(history);
  if (!result.success) {
    // Could show toast here
  }
}, [history]);
```

### SettingsPanel Integration
```typescript
// Load stats when panel opens
useEffect(() => {
  if (isOpen) {
    setStorageStats(getStorageStats());
  }
}, [isOpen]);

// Clear handler
const handleClearStorage = () => {
  clearHistory();
  setStorageStats(getStorageStats());
  setShowClearConfirm(false);
  window.location.reload();
};
```

## User Journey

1. **First Time User**
   - Storage: 0 items, 0KB
   - Generate presentations → Auto-saved
   - Refresh → Presentations still there

2. **Regular User**
   - Storage: 20-50 items
   - Occasional cleanup via clear button
   - Merges with Supabase data

3. **Power User**
   - Storage: 80+ items
   - Sees warning at 80%
   - Auto-trim kicks in at quota
   - May need to clear manually

## Error States

### localStorage Disabled
- No storage section shown (graceful degradation)
- Console warning logged
- History works in memory only

### Corrupted Data
- Automatically cleared
- User sees empty history
- Console shows error + recovery message

### Quota Exceeded
- Auto-trim activates
- Console shows trim message
- User sees warning in settings
- Oldest items removed automatically

## Success Metrics

✅ User can see how much storage is used
✅ User can clear storage with confirmation
✅ Visual feedback for storage levels
✅ Automatic quota management
✅ No data loss on refresh
✅ Clean, consistent UI
