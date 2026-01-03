# PresentGenius - AI-Powered Medical Education Presentation Generator

## Project Overview

**PresentGenius** is a React + TypeScript web application that generates interactive HTML medical education presentations using AI. It supports multiple AI models through OpenRouter API and features real-time preview, refinement capabilities, and cloud storage via Supabase.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **AI Integration**: OpenRouter API (DeepSeek V3, Claude 4.5, GPT-4o, Gemini 2.0, GLM-4.7, MiniMax M2.1, Llama 3.3)
- **Storage**: Supabase (PostgreSQL) for cloud sync
- **State Management**: Zustand
- **Export**: HTML, PDF, PNG via html2canvas
- **UI Components**: HeadlessUI, Heroicons

## Current Features

### 1. AI Model Selection
- Dropdown selector with 15+ AI models
- Model metadata: name, icon, tier (fast/standard/premium)
- Default: DeepSeek V3 (cheapest quality option)

### 2. Content Generation
- Text prompt input with 500-character limit
- Image upload support (vision-capable models)
- Real-time progress tracking with 10+ granular stages
- Emoji indicators and model-aware feedback
- Retry logic with exponential backoff

### 3. Live Preview & Editing
- Sandboxed iframe preview
- Split-panel layout (preview + chat)
- AI-powered refinement via chat interface
- Undo/redo (50-entry history)
- Presentation mode (fullscreen)

### 4. Cloud Sync (Supabase)
- Auto-save presentations
- Prompt history tracking
- Database viewer component
- User authentication (optional)

### 5. Export Capabilities
- HTML (standalone with embedded CSS)
- PDF (via html2canvas + jsPDF)
- PNG (high-resolution screenshots)

### 6. Settings (Hidden)
- Zustand store exists but NO UI
- Theme, auto-save, learner level stored
- API keys in .env only

## Architecture

```
/services
  ├── openrouter.ts       # AI model integration & API calls
  ├── ai-provider.ts      # Unified provider interface
  ├── api-key-validation.ts  # API key validation & error handling
  ├── supabase.ts         # Database & auth
  ├── cache.ts            # Response caching
  └── knowledge.ts        # Adaptive prompts

/components
  ├── CenteredInput.tsx   # Main prompt input + model selector
  ├── LivePreview.tsx     # Iframe preview
  ├── ChatPanel.tsx       # AI refinement interface
  ├── GenerationProgress.tsx  # Progress indicator
  ├── CreationHistory.tsx # Sidebar with history
  ├── SupabaseDataViewer.tsx  # Cloud data viewer
  └── Header.tsx          # Top bar with actions

/App.tsx                  # Main orchestration
```

## Current Work: 10 Usability Upgrades (Planned)

See [@fix_plan.md](@fix_plan.md) for detailed task breakdown. High-level goals:

1. **Settings Panel** (P0) - Expose hidden Zustand settings
2. **Toast Notifications** (P0) - Replace alert() with modern toasts
3. **Keyboard Shortcuts** (P0) - Power-user productivity
4. **Command Palette** (P1) - Cmd+K fuzzy search
5. **Favorites System** (P1) - Star important presentations
6. **Accessibility** (P1) - WCAG 2.1 AA compliance
7. **Onboarding Flow** (P2) - 4-step tutorial
8. **Advanced Search** (P2) - Full-text + filters
9. **Bulk Operations** (P2) - Multi-select + batch actions
10. **Export Presets** (P2) - One-click export configs

## Development Guidelines

### Code Quality
- TypeScript strict mode enabled
- ESLint + Prettier configured
- Prefer functional components with hooks
- Use Tailwind utility classes (no custom CSS)
- Comprehensive error handling with user-friendly messages

### AI Integration Best Practices
- Always validate API keys before requests
- Provide granular progress feedback (10+ stages)
- Implement retry logic for transient errors
- Use emoji indicators for visual clarity
- Model-aware messages (show which AI is working)
- Cache responses when possible

### UI/UX Principles
- Mobile-first responsive design
- Dark theme (zinc-900 background)
- Smooth animations (150-300ms transitions)
- Loading states for all async operations
- Accessible keyboard navigation
- Clear error messages with actionable suggestions

### Security
- Never commit API keys (use .env)
- Validate user input (prevent XSS)
- Sanitize AI-generated HTML before rendering
- Use sandboxed iframes for preview
- Rate limiting on API calls

## API Keys & Configuration

Required environment variables (`.env`):
```env
VITE_OPENROUTER_API_KEY=sk-or-v1-...
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=eyJ...

# Optional direct API access
VITE_ANTHROPIC_API_KEY=sk-ant-...
VITE_GEMINI_API_KEY=AIza...
VITE_ZHIPU_API_KEY=878cd...
VITE_MINIMAX_API_KEY=eyJh...
```

## Testing Strategy

Currently **no tests** - planned:
- Unit tests (Vitest): Zustand stores, utility functions
- Component tests (React Testing Library): UI interactions
- E2E tests (Playwright): Full generation workflow
- API mocking for AI providers

## Known Issues & Technical Debt

1. **Browser Cache** - Users need hard refresh (Cmd+Shift+R) after updates
2. **Settings UI Missing** - Zustand store exists but no panel to modify
3. **No Error Boundary** - Unhandled React errors crash entire app
4. **Export Quality** - PDF/PNG resolution limited by html2canvas
5. **Mobile Preview** - Iframe scrolling issues on iOS
6. **History Management** - No local storage persistence
7. **Accessibility** - WCAG AA compliance gaps (color contrast, ARIA labels)

## Performance Considerations

- **Bundle Size**: ~2.5MB (Tailwind CSS JIT, code splitting needed)
- **API Costs**: DeepSeek V3 default ($0.30/$1.20 per 1M tokens)
- **Cache Hit Rate**: ~40% (prompt caching)
- **Preview Latency**: 2-3s for first render
- **Supabase Quota**: Free tier (500MB storage, 2GB bandwidth)

## Deployment

- **Dev Server**: `npm run dev` (Vite HMR on port 5173)
- **Production Build**: `npm run build` (outputs to `/dist`)
- **Preview**: `npm run preview` (serve production build)
- **Host**: Vercel recommended (automatic deployments)

## Future Enhancements (Post-MVP)

- Collaborative editing (real-time)
- Presentation templates library
- Voice input (Web Speech API)
- Mobile app (React Native)
- Analytics dashboard
- Plugin system for custom AI models
- Advanced animations (Framer Motion)
- Slide deck format (multi-page presentations)

## Ralph-Specific Instructions

**CRITICAL**: Read `.ralph/RALPH_GUIDE.md` for comprehensive implementation patterns, debugging tips, and common pitfalls.

### Core Principles

1. **Read Before Writing** - ALWAYS use Read tool to understand existing code before modifying
2. **Test Every Change** - Verify in dev server (http://localhost:5173) after each modification
3. **Incremental Progress** - Make one small change, test, commit, repeat
4. **Ask When Uncertain** - If multiple approaches exist, ask for guidance
5. **Stop at 3 Errors** - After 3 consecutive errors on same task, alert human

### Priority Order (From @fix_plan.md)

**Phase 1 - Critical Bugs** (DO THESE FIRST):
1. Fix browser cache issue (Vite config, no more hard refresh)
2. Add React Error Boundary (app shouldn't crash to blank screen)
3. Expose Settings Panel (Zustand store exists, needs UI)
4. Test new models (GLM 4.7, MiniMax M2.1)
5. Fix export functions (PDF/PNG reliability)

**Phase 2 - Stability** (THEN DO THESE):
6. Fix mobile preview scrolling (iOS issues)
7. Replace alert() with toasts (better UX)
8. Improve error messages (user-friendly)
9. Add history persistence (localStorage)
10. Optimize bundle size (<1MB)

**Phase 3 - Nice-to-Have** (ONLY IF TIME):
- Favorites, search, onboarding

### Implementation Checklist (Per Task)

Before starting:
- [ ] Read @fix_plan.md task description
- [ ] Read all files mentioned in task with Read tool
- [ ] Understand current implementation
- [ ] Identify what needs to change

While implementing:
- [ ] Make ONE change at a time
- [ ] Check browser console after each change (no errors)
- [ ] Verify HMR updates correctly (no full page reload needed)
- [ ] Test on mobile width (375px in DevTools)
- [ ] Ensure dark theme consistent (zinc colors)

Before marking complete:
- [ ] TypeScript compiles (no red errors in terminal)
- [ ] Browser console clean (no errors)
- [ ] Feature works as described
- [ ] Mobile responsive verified
- [ ] Git commit with clear message
- [ ] Mark task complete in @fix_plan.md with [x]

### Common Pitfalls (SEE .ralph/RALPH_GUIDE.md)

1. **Browser Cache**: Always test with hard refresh first (Cmd+Shift+R)
2. **TypeScript Imports**: Use absolute paths, verify file exists before importing
3. **Zustand Persistence**: Ensure `persist` middleware configured correctly
4. **Tailwind Dynamic Classes**: Use complete class strings, no interpolation
5. **React Hooks**: Must be at top level, not in loops/conditions
6. **Supabase RLS**: Check user is authenticated before queries

### When to Ask for Human Review

⚠️ **ASK BEFORE** proceeding with:
- Database migrations (Supabase schema changes)
- Dependency updates (package.json modifications)
- Breaking changes (API signature changes)
- Security-sensitive code (auth, API keys, XSS prevention)
- Architecture decisions (multiple valid approaches)

🛑 **STOP AND REPORT** if:
- Same error occurs 3+ times in a row
- Build completely broken (TypeScript won't compile)
- Dev server crashes repeatedly
- Critical file missing that should exist
- Git conflicts occur

### Commit Guidelines

**Format**: `<type>: <description>`

**Types**:
- `feat`: New feature added
- `fix`: Bug fixed
- `refactor`: Code restructured (no behavior change)
- `style`: Formatting only
- `chore`: Build/tooling changes

**Example**:
```bash
git commit -m "fix: Browser cache issue causing stale component errors

- Add hash-based file naming to Vite build config
- Ensures browser fetches latest assets after deployment
- Fixes 'PROVIDERS is not defined' error
- Tested: Cmd+R refresh now works (no Cmd+Shift+R needed)"
```

### Testing Workflow

**Every change must be verified**:

1. **Dev Server Check**:
   - Open http://localhost:5173
   - Check browser console (should be clean)
   - Verify feature works as expected

2. **Mobile Check**:
   - DevTools > Toggle Device Toolbar
   - Test at 375px width (iPhone SE)
   - Ensure no horizontal scroll
   - Verify touch targets ≥44px

3. **Error Check**:
   - Intentionally trigger error (empty input, network fail)
   - Verify error message is user-friendly
   - Ensure app doesn't crash

4. **Build Check** (before committing):
   - Run `npm run build` in background
   - Ensure no TypeScript errors
   - Check bundle size if added dependencies

### Error Recovery Steps

**If something breaks**:

1. **Check Console**:
   ```bash
   # Browser DevTools Console
   # Look for red errors, stack traces
   ```

2. **Check Dev Server**:
   ```bash
   # Terminal where npm run dev is running
   # Look for TypeScript errors, warnings
   ```

3. **Verify Imports**:
   ```typescript
   // Use Read tool to check file exists
   // Verify export matches import
   // Check for typos in paths
   ```

4. **Hard Refresh Browser**:
   ```bash
   # Cmd+Shift+R (Mac)
   # Ctrl+Shift+F5 (Windows)
   ```

5. **Restart Dev Server**:
   ```bash
   # Ctrl+C to kill
   source ~/.zshrc && npm run dev
   ```

6. **Revert if Stuck**:
   ```bash
   git diff HEAD  # See what changed
   git checkout -- file.tsx  # Undo changes to specific file
   # Or: git reset --hard HEAD  # Undo all uncommitted changes
   ```

### Success Criteria

A task is **COMPLETE** when ALL of these are true:

- ✅ Feature implemented as described in @fix_plan.md
- ✅ TypeScript compiles without errors (`npm run build` succeeds)
- ✅ Browser console has zero errors
- ✅ Dev server HMR working (fast updates, no full reload)
- ✅ Mobile responsive (tested at 375px, no horizontal scroll)
- ✅ Dark theme consistent (uses zinc-800/900 bg, zinc-300 text)
- ✅ Error states handled with user-friendly messages
- ✅ Loading states shown for async operations
- ✅ Tested manually in browser (clicked buttons, verified behavior)
- ✅ Git commit made with descriptive message
- ✅ Task marked [x] in @fix_plan.md

### Helpful Resources

- **Implementation Guide**: `.ralph/RALPH_GUIDE.md` (comprehensive patterns & debugging)
- **Task List**: `@fix_plan.md` (what to work on)
- **Project Requirements**: `specs/project-requirements.md` (what the app should do)
- **Architecture**: `specs/technical-architecture.md` (how it's built)
- **Config**: `.ralph/config.json` (Ralph settings)

---

**Remember**: Functionality first, polish later. Focus on making core features work reliably before adding nice-to-have features.

## Resources

- **OpenRouter Docs**: https://openrouter.ai/docs
- **Supabase Docs**: https://supabase.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **React Docs**: https://react.dev
- **Vite Guide**: https://vitejs.dev/guide/

---

**Current Status**: Active development - implementing 10 usability upgrades
**Dev Server**: Running on http://localhost:5173
**Last Updated**: 2026-01-03
