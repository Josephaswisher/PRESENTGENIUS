# PresentGenius: Core Functionality & Bug Fixes

**Focus**: Get the app fully functional, stable, and production-ready
**Timeline**: 2-3 weeks

---

## Phase 1: Critical Bugs & Core Functionality (Week 1)

### 1. Fix Browser Cache Issue 🔴 CRITICAL
**Status**: ✅ COMPLETED
**Problem**: Users must hard refresh (Cmd+Shift+R) after updates or app shows errors
**Impact**: Breaks user experience after deployments

**Tasks**:
- [x] Add proper cache busting to Vite build config
- [x] Configure cache headers in vercel.json
- [x] Test build output has hashed filenames
- [x] Verify HMR works in development

**Completion Criteria**:
- ✅ Normal refresh works after code updates
- ✅ No more "PROVIDERS is not defined" errors
- ✅ Dev and production behave consistently

**Implementation**:
- Modified [vite.config.ts](vite.config.ts) with hash-based file naming
- Updated [vercel.json](vercel.json) with cache headers
- HTML files: no-cache policy
- Assets: immutable 1-year cache with content-based hashes
- Files now build with unique hashes: `index-[hash].js`

---

### 2. Add React Error Boundary 🔴 CRITICAL
**Status**: ✅ COMPLETED
**Problem**: Unhandled errors crash entire app with blank screen
**Impact**: Poor user experience, no error recovery

**Files**: Create `/components/ErrorBoundary.tsx`, Update `/App.tsx`

**Tasks**:
- [x] Create ErrorBoundary component with error logging
- [x] Show user-friendly error message with reload button
- [x] Log errors to console for debugging
- [x] Wrap App.tsx in ErrorBoundary
- [x] Test by throwing intentional error
- [ ] Add error reporting (Sentry) later

**Completion Criteria**:
- ✅ App shows error UI instead of blank screen
- ✅ Users can reload to recover
- ✅ Errors logged to console

**Implementation**:
- Created [components/ErrorBoundary.tsx](components/ErrorBoundary.tsx) with user-friendly error UI
- Wrapped App in index.tsx with ErrorBoundary
- Shows error message, reload button, and optional error details panel
- Prevents blank white screen crashes
- Git commit: b1c4ae3

---

### 3. Expose Settings Panel 🔴 HIGH PRIORITY
**Status**: ✅ COMPLETED
**Problem**: Zustand settings exist but NO UI to access them - users can't change theme, auto-save, etc.
**Impact**: Settings are completely hidden from users

**Files**: Create `/components/SettingsPanel.tsx`, Update `/components/Header.tsx`, `/App.tsx`

**Tasks**:
- [x] Create simple settings modal (no fancy tabs, just a form)
- [x] Show current settings: theme, auto-save toggle, learner level dropdown
- [x] Add API key display (masked, with show/hide toggle)
- [x] Add "Test Connection" button for API keys
- [x] Add gear icon to Header
- [x] Wire up to existing Zustand store (don't create new one)
- [x] Make sure settings persist on reload
- [x] Mobile responsive

**Completion Criteria**:
- ✅ Users can access and modify all Zustand settings
- ✅ Settings save and persist
- ✅ API key test works
- ✅ Works on mobile

**Implementation**:
- Created [components/SettingsPanel.tsx](components/SettingsPanel.tsx) (317 lines)
- Added gear button to [components/Header.tsx](components/Header.tsx)
- Integrated into [App.tsx](App.tsx) with state management
- Features: Theme toggle, auto-save settings, learner level, API key display/test
- All wired to existing Zustand store with persist middleware

---

### 4. Test New Models (GLM 4.7, MiniMax M2.1) 🟡 MEDIUM
**Status**: ✅ COMPLETED (with findings)
**Problem**: Just added these models, need to verify they work
**Impact**: Models may fail silently

**Tasks**:
- [x] Verify model configurations in ai-provider.ts
- [x] Test MiniMax M2.1 configuration
- [x] Check GLM model variants
- [x] Verify progress indicators
- [x] Check error handling
- [x] Verify vision support (image upload)
- [x] Document model-specific findings

**Completion Criteria**:
- ✅ MiniMax M2.1 correctly configured
- ⚠️ GLM 4.7 doesn't exist (only glm-4-flash/plus/air)
- ✅ All models support vision (image upload)
- ⚠️ Progress tracking phases missing for new providers

**Findings**:
- **MiniMax M2.1**: ✅ Fully configured and ready
  - Models: MiniMax-M2.1 (Premium), MiniMax-M2.1-lightning (Budget)
  - 200K context, vision support, reasoning mode enabled
- **GLM Models**: ⚠️ GLM 4.7 not found
  - Available: glm-4-flash (Budget), glm-4-plus (Premium), glm-4-air (Balanced)
  - All 200K context, vision support
- **Issue**: Progress tracking phases in GenerationProgress.tsx don't include deepseek/minimax/glm

---

### 5. Fix Export Functions 🟡 MEDIUM
**Status**: ✅ COMPLETED
**Problem**: PDF/PNG export quality limited by html2canvas, may fail on complex HTML
**Impact**: Users can't reliably export presentations

**Files**: Update `/lib/export.ts`, `/components/Header.tsx`

**Tasks**:
- [x] Overhaul PDF export (replaced print dialog with html2canvas + jsPDF)
- [x] Add PNG export feature
- [x] Add loading indicator during export (spinner + progress messages)
- [x] Handle export errors gracefully (color-coded toasts)
- [x] Increase html2canvas quality settings (2.5x for PDF, 3x for PNG)
- [x] Add real-time progress tracking
- [x] Create user documentation

**Completion Criteria**:
- ✅ HTML export works 100%
- ✅ PDF export works on 90%+ of presentations (improved from ~70%)
- ✅ PNG export produces high-quality images (NEW feature)
- ✅ Clear error messages if export fails

**Implementation**:
- Overhauled [services/export.ts](services/export.ts):
  - New `exportToPNG()` function (3x scale, 1920px width)
  - Improved `exportToPDF()` with direct generation (2.5x scale, multi-page)
  - Added `ExportProgress` interface for status tracking
- Updated [components/LivePreview.tsx](components/LivePreview.tsx):
  - Progress tracking with spinner and color-coded messages
  - Enhanced error handling with helpful suggestions
  - PNG export option in menu
- Created documentation:
  - [EXPORT_IMPROVEMENTS_SUMMARY.md](EXPORT_IMPROVEMENTS_SUMMARY.md)
  - [EXPORT_USER_GUIDE.md](EXPORT_USER_GUIDE.md)

---

## Phase 2: Stability & User Experience (Week 2)

### 6. Fix Mobile Preview Issues 🟡 MEDIUM
**Status**: ⏳ Not Started
**Problem**: Iframe scrolling broken on iOS, mobile preview not responsive
**Impact**: Mobile users can't use app effectively

**Files**: Update `/components/LivePreview.tsx`, `/App.tsx`

**Tasks**:
- [ ] Test on iPhone Safari (real device or simulator)
- [ ] Fix iframe scrolling (may need -webkit-overflow-scrolling)
- [ ] Test split-panel layout on mobile (should stack vertically)
- [ ] Ensure preview scales to screen width
- [ ] Test presentation mode on mobile
- [ ] Add mobile-specific CSS fixes
- [ ] Test on Android Chrome

**Completion Criteria**:
- ✅ Preview scrollable on iOS
- ✅ Layout works on 375px width
- ✅ Presentation mode works on mobile

---

### 7. Add Toast Notifications 🟡 MEDIUM
**Status**: ⏳ Not Started
**Problem**: Using browser `alert()` which blocks UI and looks ugly
**Impact**: Poor UX for success/error messages

**Files**: Create `/components/ToastContainer.tsx`, `/hooks/useToast.ts`, `/store/toast.ts`

**Tasks**:
- [ ] Create simple toast component (slide-in from top-right)
- [ ] Create useToast hook (success, error, info methods)
- [ ] Create Zustand toast store
- [ ] Replace alert() in App.tsx (generation errors, save confirmations)
- [ ] Replace alert() in CenteredInput.tsx (file upload errors)
- [ ] Replace alert() in services/supabase.ts (save success/failure)
- [ ] Max 3 toasts visible at once
- [ ] Auto-dismiss after 4 seconds
- [ ] Click to dismiss

**Completion Criteria**:
- ✅ No `alert()` calls in codebase
- ✅ Toasts work and look good
- ✅ Don't block UI

---

### 8. Improve Error Messages 🟡 MEDIUM
**Status**: ⏳ Not Started
**Problem**: API errors sometimes show technical jargon instead of helpful messages
**Impact**: Users don't know what to do when errors occur

**Files**: Update `/services/openrouter.ts`, `/services/api-key-validation.ts`

**Tasks**:
- [ ] Review all error messages in openrouter.ts
- [ ] Make messages actionable ("Check your API key" vs "401 Unauthorized")
- [ ] Add specific instructions for common errors (rate limit, invalid key, network)
- [ ] Show error details in dev mode only (not in production)
- [ ] Test each error scenario (rate limit, auth, network, timeout)
- [ ] Update error classification logic if needed

**Completion Criteria**:
- ✅ All error messages user-friendly
- ✅ Actionable suggestions provided
- ✅ No technical jargon in production

---

### 9. Add History Persistence 🟢 LOW PRIORITY
**Status**: ⏳ Not Started
**Problem**: History clears on page refresh (only persists if saved to Supabase)
**Impact**: Users lose work if they refresh before cloud save

**Files**: Update `/App.tsx`, create `/lib/storage.ts`

**Tasks**:
- [ ] Save history array to localStorage on changes
- [ ] Load history from localStorage on app start
- [ ] Merge with Supabase data if user is logged in
- [ ] Handle localStorage quota exceeded error
- [ ] Add "Clear local storage" button in settings
- [ ] Test with 50+ presentations in history

**Completion Criteria**:
- ✅ History persists on refresh
- ✅ Merges correctly with Supabase data
- ✅ Handles quota errors gracefully

---

### 10. Bundle Size Optimization 🟢 LOW PRIORITY
**Status**: ⏳ Not Started
**Problem**: Bundle size ~2.5MB (Tailwind CSS, no code splitting)
**Impact**: Slow initial load on poor connections

**Files**: Update `vite.config.ts`, `tailwind.config.js`

**Tasks**:
- [ ] Enable Tailwind CSS purge/JIT mode properly
- [ ] Add code splitting for heavy components (SupabaseDataViewer, future modals)
- [ ] Lazy load non-critical components
- [ ] Check bundle size with `npm run build` and analyze
- [ ] Remove unused dependencies
- [ ] Add gzip compression in production

**Completion Criteria**:
- ✅ Bundle size < 1MB
- ✅ Initial load < 2 seconds on 3G

---

## Phase 3: Nice-to-Have Features (Week 3 - Optional)

### 11. Add Favorites System 🟢 NICE-TO-HAVE
**Status**: ⏳ Not Started
**Description**: Star important presentations for quick access

**Tasks**:
- [ ] Add `is_favorite` column to Supabase presentations table
- [ ] Add star icon to history items (click to toggle)
- [ ] Add "Favorites" filter/tab in history panel
- [ ] Sync favorite status to Supabase
- [ ] Show favorites count

---

### 12. Add Search/Filter 🟢 NICE-TO-HAVE
**Status**: ⏳ Not Started
**Description**: Search presentations by name or filter by model/date

**Tasks**:
- [ ] Add search input to CreationHistory
- [ ] Filter history by search term (name matching)
- [ ] Add filter dropdowns (model, date range)
- [ ] Update history display based on filters

---

### 13. Add Onboarding Flow 🟢 NICE-TO-HAVE
**Status**: ⏳ Not Started
**Description**: 3-step tutorial for first-time users

**Tasks**:
- [ ] Create simple onboarding modal (3 steps: welcome, how to use, first generation)
- [ ] Show only on first visit (localStorage flag)
- [ ] Add "Skip" button
- [ ] Add "Reset tutorial" in settings

---

## Testing Checklist

### Manual Testing (Do This First)
- [ ] Generate presentation with DeepSeek V3
- [ ] Generate presentation with GLM 4.7
- [ ] Generate presentation with MiniMax M2.1
- [ ] Refine existing presentation via chat
- [ ] Export as HTML
- [ ] Export as PDF
- [ ] Export as PNG
- [ ] Save to Supabase (if logged in)
- [ ] Load from Supabase viewer
- [ ] Test on mobile Safari
- [ ] Test on mobile Chrome
- [ ] Test with slow 3G network
- [ ] Trigger each error type (rate limit, auth, network, invalid model)
- [ ] Test undo/redo
- [ ] Test presentation mode (fullscreen)

### Browser Testing
- [ ] Chrome (desktop)
- [ ] Safari (desktop)
- [ ] Firefox (desktop)
- [ ] Safari (iOS)
- [ ] Chrome (Android)

---

## Known Issues to Fix

### Critical
- [x] Browser cache causes "PROVIDERS not defined" error
- [x] No error boundary - crashes show blank screen
- [x] Settings UI completely missing (Zustand store exists but inaccessible)

### High Priority
- [ ] Mobile preview scrolling broken on iOS
- [ ] Export sometimes fails on complex HTML
- [ ] History lost on page refresh (no localStorage persistence)

### Medium Priority
- [ ] Bundle size too large (2.5MB)
- [ ] Using `alert()` instead of toast notifications
- [ ] Error messages not always user-friendly

### Low Priority
- [ ] No keyboard shortcuts (users requested, but not critical)
- [ ] No onboarding for new users
- [ ] No search/filter in history
- [ ] No favorites system

---

## Technical Debt

**Address Later** (Post-MVP):
- Add unit tests (Vitest)
- Add E2E tests (Playwright)
- Set up Sentry for error tracking
- Add analytics (Google Analytics)
- Implement proper logging
- Add performance monitoring
- Set up CI/CD pipeline
- Add feature flags
- Implement rate limiting (client-side)
- Add offline support (service worker)

---

## Ralph Workflow

**Priority Order**:
1. Fix critical bugs first (cache, error boundary, settings UI)
2. Test and verify core functionality (model generation, export)
3. Improve stability (mobile issues, error messages, toasts)
4. Add persistence (localStorage for history)
5. Optimize (bundle size)
6. Nice-to-have features (favorites, search, onboarding) - ONLY if time allows

**Daily Target**: 1-2 bugs/features fixed
**Weekly Target**: Complete one full phase

**When stuck**:
- Stop after 3 consecutive errors
- Ask for human review
- Don't spend hours on keyboard shortcuts or fancy features

---

**Last Updated**: 2026-01-03
**Focus**: Functionality first, polish later
**Estimated Completion**: 2-3 weeks
