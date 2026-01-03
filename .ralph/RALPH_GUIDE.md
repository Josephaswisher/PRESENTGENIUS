# Ralph Implementation Guide for PresentGenius

## Quick Reference

**Start Ralph**: `ralph --monitor`
**Check Status**: `ralph --status`
**Emergency Stop**: `Ctrl+C` or `ralph --circuit-status` then kill process
**View Logs**: `tail -f logs/ralph-*.log`
**Reset Circuit Breaker**: `ralph --reset-circuit`

---

## Common Pitfalls & Solutions

### 1. Browser Cache Issues
**Problem**: Changes not reflecting in browser, "PROVIDERS is not defined" errors
**Solution**:
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+F5 (Windows)
- Add cache busting to `vite.config.ts`:
  ```typescript
  export default defineConfig({
    build: {
      rollupOptions: {
        output: {
          entryFileNames: `[name].[hash].js`,
          chunkFileNames: `[name].[hash].js`,
          assetFileNames: `[name].[hash].[ext]`
        }
      }
    }
  })
  ```
- Check dev server is running: `lsof -ti:5173`

### 2. TypeScript Import Errors
**Problem**: "Cannot find module" or "Module not found"
**Solution**:
- Always use Read tool to check imports before modifying
- Use absolute imports from project root: `import X from '/components/X'`
- Check `tsconfig.json` paths configuration
- Verify file actually exists before importing
- Use correct file extension (.tsx for components, .ts for utils)

### 3. Zustand Store Updates Not Persisting
**Problem**: Settings change but don't save on reload
**Solution**:
- Check if store has persist middleware:
  ```typescript
  import { persist } from 'zustand/middleware';

  export const useSettingsStore = create(
    persist(
      (set) => ({ /* state */ }),
      { name: 'presentgenius-settings' }
    )
  );
  ```
- Verify localStorage is accessible (not in incognito/private mode)
- Check browser console for localStorage quota errors

### 4. Tailwind CSS Classes Not Applying
**Problem**: Styled components show no styling
**Solution**:
- Ensure classes are complete strings (no string interpolation):
  ```typescript
  // ❌ BAD
  className={`text-${color}-500`}

  // ✅ GOOD
  className={color === 'blue' ? 'text-blue-500' : 'text-gray-500'}
  ```
- Check `tailwind.config.js` content paths include all component files
- Restart dev server after Tailwind config changes
- Use Tailwind's safelist for dynamic classes

### 5. Supabase RLS (Row Level Security) Blocking Queries
**Problem**: Database queries return empty or "permission denied"
**Solution**:
- Check if user is authenticated: `const { data: { user } } = await supabase.auth.getUser()`
- Verify RLS policies in Supabase dashboard
- For development, temporarily disable RLS on table (re-enable for production!)
- Use service role key for server-side operations (never in client code)

### 6. React Hooks Errors
**Problem**: "Hooks can only be called inside function components"
**Solution**:
- Hooks must be at top level of component (not in loops/conditions)
- Component names must start with capital letter
- Don't call hooks from regular functions, only from components or custom hooks
- Check dependencies array for useEffect/useCallback

### 7. Export Functions Failing
**Problem**: PDF/PNG export produces blank image or crashes
**Solution**:
- Check iframe content is loaded before exporting
- Increase timeout for html2canvas: `await html2canvas(element, { timeout: 10000 })`
- Ensure no CORS issues with external images
- Test with simple HTML first, then complex
- Add error boundary around export function

---

## Implementation Patterns

### Pattern 1: Creating a New Component

```typescript
// 1. Create file with proper naming
// ✅ GOOD: /components/ToastContainer.tsx
// ❌ BAD: /components/toast.tsx or /components/toast-container.tsx

// 2. Use functional component with TypeScript
import React from 'react';

interface ToastContainerProps {
  maxToasts?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  maxToasts = 3,
  position = 'top-right'
}) => {
  // 3. Use proper hooks
  const [toasts, setToasts] = useState<Toast[]>([]);

  // 4. Return JSX with Tailwind classes
  return (
    <div className={`fixed ${positionClasses[position]} z-50 p-4 space-y-2`}>
      {toasts.map(toast => (
        <div key={toast.id} className="bg-zinc-800 rounded-lg p-4">
          {toast.message}
        </div>
      ))}
    </div>
  );
};

// 5. Export default or named export (prefer named)
export default ToastContainer;
```

### Pattern 2: Adding Zustand Store

```typescript
// 1. Create store file
// /store/toast.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastStore {
  toasts: Toast[];
  addToast: (message: string, type: Toast['type']) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

export const useToastStore = create<ToastStore>()(
  // Use persist only if state should survive reload
  persist(
    (set) => ({
      toasts: [],
      addToast: (message, type) => set((state) => ({
        toasts: [...state.toasts, { id: Date.now().toString(), message, type }]
      })),
      removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter(t => t.id !== id)
      })),
      clearAll: () => set({ toasts: [] })
    }),
    {
      name: 'presentgenius-toasts',
      // Optional: only persist certain fields
      partialize: (state) => ({ toasts: state.toasts })
    }
  )
);
```

### Pattern 3: API Error Handling

```typescript
// Consistent error handling pattern

async function callAPI() {
  try {
    const response = await fetch(API_URL, { /* ... */ });

    if (!response.ok) {
      // Classify error
      const error = classifyError(response.status);

      // User-friendly message
      throw new Error(error.userMessage);
    }

    return await response.json();

  } catch (error: any) {
    // Log for debugging
    console.error('API call failed:', error);

    // Show user-friendly message
    if (error.message.includes('network')) {
      throw new Error('Connection failed. Please check your internet connection.');
    }

    // Rethrow with context
    throw new Error(`Failed to load data: ${error.message}`);
  }
}

// Helper function
function classifyError(status: number): { userMessage: string; retryable: boolean } {
  switch (status) {
    case 401:
      return { userMessage: 'Invalid API key. Please check your settings.', retryable: false };
    case 429:
      return { userMessage: 'Rate limit exceeded. Please wait a moment.', retryable: true };
    case 500:
      return { userMessage: 'Server error. Please try again.', retryable: true };
    default:
      return { userMessage: 'Request failed. Please try again.', retryable: false };
  }
}
```

### Pattern 4: Testing Changes

```typescript
// After making changes, always verify:

// 1. Check TypeScript compiles
// Terminal: Look for "✓ built in XXXms"

// 2. Check browser console for errors
// Browser DevTools: No red errors

// 3. Test user interaction
// Click buttons, submit forms, navigate

// 4. Test on mobile (responsive)
// DevTools: Toggle device toolbar, test 375px width

// 5. Test error states
// Trigger errors intentionally (invalid input, network fail)

// Example test checklist for ToastContainer:
// - [ ] Toast appears when triggered
// - [ ] Toast auto-dismisses after 4 seconds
// - [ ] Click to dismiss works
// - [ ] Max 3 toasts enforced
// - [ ] Positioning correct (top-right by default)
// - [ ] Works on mobile
// - [ ] No console errors
```

---

## File Organization Rules

### Where to Put New Files

**Components**: `/components/[ComponentName].tsx`
- General UI: `/components/ToastContainer.tsx`
- Auth-related: `/components/auth/UserMenu.tsx`
- Modals: `/components/SettingsPanel.tsx`

**Hooks**: `/hooks/use[HookName].ts`
- `/hooks/useToast.ts`
- `/hooks/useKeyboardShortcuts.ts`

**Stores**: `/store/[storeName].ts`
- `/store/toast.ts`
- `/store/settings.ts`

**Services**: `/services/[serviceName].ts`
- API: `/services/openrouter.ts`
- Database: `/services/supabase.ts`

**Utils**: `/lib/[utilName].ts`
- `/lib/export.ts`
- `/lib/storage.ts`

**Types**: Define types in same file OR `/types/[domain].ts`
- Prefer: Define interfaces in component file
- Shared types: `/types/api.ts`, `/types/models.ts`

### Naming Conventions

**Components**: PascalCase
- `ToastContainer.tsx`, `SettingsPanel.tsx`

**Hooks**: camelCase with "use" prefix
- `useToast.ts`, `useKeyboardShortcuts.ts`

**Functions**: camelCase
- `generatePresentation()`, `exportToPDF()`

**Constants**: UPPER_SNAKE_CASE
- `const MAX_TOASTS = 3`
- `const API_BASE_URL = '...'`

**Types/Interfaces**: PascalCase
- `interface ToastProps`, `type ModelId`

---

## Code Quality Checklist

Before marking a task complete, verify:

### TypeScript
- [ ] No `any` types (use proper types or `unknown`)
- [ ] All props have interfaces
- [ ] Functions have return types
- [ ] No TypeScript errors in terminal

### React
- [ ] No useState for derived state (use useMemo instead)
- [ ] useEffect has proper dependencies array
- [ ] Event handlers don't recreate on every render (use useCallback)
- [ ] Components are pure functions (no side effects in render)

### Styling
- [ ] Only Tailwind classes used (no inline styles or CSS modules)
- [ ] Mobile responsive (tested at 375px)
- [ ] Dark theme consistent (zinc palette)
- [ ] Hover/focus states defined
- [ ] Loading states shown for async operations

### Accessibility
- [ ] Buttons have accessible names (not just icons)
- [ ] Form inputs have labels
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Focus visible on interactive elements
- [ ] Color contrast meets WCAG AA (4.5:1 for text)

### Performance
- [ ] Heavy computations memoized (useMemo)
- [ ] Stable callbacks (useCallback)
- [ ] Lazy load non-critical components
- [ ] No unnecessary re-renders

### Error Handling
- [ ] All async operations have try/catch
- [ ] User-friendly error messages
- [ ] Errors logged to console for debugging
- [ ] Fallback UI for error states

---

## Testing Workflow

### 1. Unit Test (Manual)
```typescript
// Test individual function
const result = formatDate(new Date('2025-01-01'));
console.assert(result === 'Jan 1, 2025', 'Date formatting failed');
```

### 2. Component Test (Browser)
```typescript
// After adding ToastContainer:
// 1. Open browser DevTools Console
// 2. Import and test:
import { useToastStore } from './store/toast';
const { addToast } = useToastStore.getState();
addToast('Test message', 'success');
// 3. Verify toast appears in UI
```

### 3. Integration Test (User Flow)
```typescript
// Test complete flow:
// 1. Open app
// 2. Enter prompt
// 3. Select model
// 4. Click generate
// 5. Verify progress shown
// 6. Verify result in preview
// 7. Try refine via chat
// 8. Export as PDF
// 9. Verify PDF downloads
```

### 4. Error Test (Negative Cases)
```typescript
// Intentionally trigger errors:
// 1. Enter empty prompt → expect error message
// 2. Disconnect internet → expect network error
// 3. Use invalid API key → expect auth error
// 4. Spam generate button → expect rate limit
```

### 5. Mobile Test (Responsive)
```typescript
// DevTools > Toggle Device Toolbar
// Test at these widths:
// - 375px (iPhone SE)
// - 390px (iPhone 12)
// - 768px (iPad)
// Verify:
// - No horizontal scroll
// - Text readable
// - Buttons tappable (min 44px)
// - Inputs usable
```

---

## Debugging Tips

### React DevTools
```bash
# Install browser extension
# Chrome: https://chrome.google.com/webstore (search "React Developer Tools")
# Firefox: https://addons.mozilla.org (search "React Developer Tools")

# Usage:
# 1. Open DevTools > Components tab
# 2. Select component in tree
# 3. View props, state, hooks in right panel
# 4. Click "bug" icon to log component to console
```

### Vite HMR Not Working
```typescript
// Check if dev server running:
lsof -ti:5173

// Restart dev server:
# Ctrl+C (kill)
source ~/.zshrc && npm run dev

// If still broken, hard refresh browser:
# Cmd+Shift+R (Mac)
# Ctrl+Shift+F5 (Windows)
```

### Zustand State Not Updating
```typescript
// Debug in browser console:
import { useSettingsStore } from './store/settings';

// View current state:
console.log(useSettingsStore.getState());

// Subscribe to changes:
useSettingsStore.subscribe((state) => {
  console.log('State changed:', state);
});

// Manually trigger update:
useSettingsStore.setState({ theme: 'dark' });
```

### Supabase Queries Failing
```typescript
// Enable detailed logging:
const { data, error } = await supabase
  .from('presentations')
  .select('*')
  .eq('user_id', userId);

if (error) {
  console.error('Supabase error:', {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code
  });
}

// Check auth status:
const { data: { user } } = await supabase.auth.getUser();
console.log('Authenticated user:', user);

// Verify table exists:
// Supabase Dashboard > Table Editor > Check "presentations" table
```

---

## Performance Optimization

### Bundle Size Analysis
```bash
# Build and analyze
npm run build

# Check bundle size
ls -lh dist/assets/*.js

# Target: Main bundle < 500KB
# If too large:
# 1. Enable code splitting
# 2. Lazy load heavy components
# 3. Remove unused dependencies
# 4. Optimize Tailwind purge
```

### Lighthouse Audit
```bash
# Chrome DevTools > Lighthouse tab
# Run audit on:
# - Performance
# - Accessibility
# - Best Practices
# - SEO

# Target scores:
# Performance: 90+
# Accessibility: 95+
# Best Practices: 95+
# SEO: 90+
```

### React Profiler
```typescript
// Wrap component in Profiler
import { Profiler } from 'react';

function onRenderCallback(
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number
) {
  console.log(`${id} ${phase} took ${actualDuration}ms`);
}

<Profiler id="ToastContainer" onRender={onRenderCallback}>
  <ToastContainer />
</Profiler>

// Look for:
// - Slow renders (>16ms)
// - Unnecessary re-renders
// - Components rendering too often
```

---

## Git Workflow for Ralph

### Commit Message Format
```bash
# Format: <type>: <description>

# Types:
# feat: New feature
# fix: Bug fix
# refactor: Code restructure (no behavior change)
# style: Formatting, missing semicolons
# test: Adding tests
# docs: Documentation only
# chore: Build process, tooling

# Examples:
git commit -m "feat: Add toast notification system"
git commit -m "fix: Browser cache issue causing stale PROVIDERS error"
git commit -m "refactor: Extract error handling to separate utility"
```

### Before Committing
```bash
# 1. Check what changed
git status
git diff

# 2. Stage specific files (don't use git add .)
git add components/ToastContainer.tsx
git add hooks/useToast.ts
git add store/toast.ts

# 3. Review staged changes
git diff --staged

# 4. Commit with descriptive message
git commit -m "feat: Add toast notification system

- Create ToastContainer component
- Add useToast hook for easy access
- Create Zustand store for state management
- Replace all alert() calls with toasts
- Auto-dismiss after 4 seconds
- Max 3 toasts visible at once"

# 5. Push (if working on branch)
git push origin ralph/toast-notifications
```

### When to Ask for Human Review
- Database migrations (Supabase schema changes)
- Dependency updates (package.json changes)
- Breaking changes (API changes, props changes)
- Security-related code (auth, API keys, sanitization)
- Performance-critical code (large refactors)
- If stuck for 3+ consecutive errors on same task

---

## Ralph's Decision-Making Framework

### When to Proceed Autonomously
✅ **YES** - Proceed if:
- Task is well-defined in @fix_plan.md
- Solution is straightforward (add component, fix bug)
- No breaking changes
- Can be tested in dev server
- Reversible with git revert

### When to Ask for Guidance
⚠️ **ASK** - Get human input if:
- Multiple valid approaches (which to choose?)
- Unclear requirements (what exactly is needed?)
- Performance tradeoffs (optimize for speed or readability?)
- Architecture decision (where should this logic live?)
- Breaking change required (will affect other code)

### When to Stop and Report
🛑 **STOP** - Alert human if:
- 3+ consecutive errors on same task
- Critical file missing (can't find component)
- Build completely broken (TypeScript errors)
- Database migration needed (schema change)
- Dependency conflict (npm install fails)
- Security concern (potential vulnerability)

---

## Emergency Procedures

### If Ralph Gets Stuck in Loop
```bash
# 1. Check circuit breaker status
ralph --circuit-status

# 2. If OPEN, review recent logs
tail -50 logs/ralph-latest.log

# 3. Reset circuit breaker
ralph --reset-circuit

# 4. Fix underlying issue (check @fix_plan.md)

# 5. Resume with conservative limits
ralph --monitor --calls 20 --timeout 10
```

### If Dev Server Crashes
```bash
# 1. Check what's using port 5173
lsof -ti:5173

# 2. Kill existing process
kill $(lsof -ti:5173)

# 3. Restart server
source ~/.zshrc && npm run dev

# 4. Verify in browser
open http://localhost:5173
```

### If Git Conflicts Occur
```bash
# Ralph should never force push, but if conflicts:

# 1. Stash Ralph's changes
git stash

# 2. Pull latest
git pull origin main

# 3. Re-apply Ralph's changes
git stash pop

# 4. Resolve conflicts manually
# (Edit files, remove conflict markers)

# 5. Stage resolved files
git add .

# 6. Commit merge
git commit -m "merge: Resolve conflicts from Ralph changes"
```

### If Build Breaks
```bash
# 1. Check TypeScript errors
npm run build

# 2. If errors, review recent changes
git diff HEAD~1

# 3. Revert if necessary
git revert HEAD

# 4. Fix incrementally
# - Comment out new code
# - Build to verify base works
# - Uncomment and fix line by line

# 5. Test locally before committing
npm run dev
# Open browser, verify works
```

---

## Success Metrics

Ralph's progress is measured by:

### Code Quality
- ✅ Zero TypeScript errors
- ✅ Zero console errors in browser
- ✅ HMR updates working (no full page reloads)
- ✅ Mobile responsive (tested at 375px)
- ✅ All imports resolve correctly

### Functionality
- ✅ Feature works as described in @fix_plan.md
- ✅ No regressions (existing features still work)
- ✅ Error states handled gracefully
- ✅ Loading states shown for async ops

### User Experience
- ✅ UI feels fast (no janky animations)
- ✅ Error messages are user-friendly
- ✅ Mobile layout doesn't break
- ✅ Dark theme consistent

### Process
- ✅ Commits are atomic (one logical change)
- ✅ Commit messages are descriptive
- ✅ Tests manually verified in browser
- ✅ Task marked complete in @fix_plan.md

---

**Last Updated**: 2026-01-03
**Version**: 1.0
**For Ralph Version**: 2.0+
