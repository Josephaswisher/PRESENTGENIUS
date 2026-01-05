# CLAUDE.md - AI Assistant Guide for PresentGenius

## Project Overview

**PresentGenius** is an AI-powered presentation generation platform focused on medical education. It uses a multi-agent architecture to generate interactive, slide-based educational content from user prompts and uploaded files.

### Key Features
- AI-powered presentation generation with MiniMax M2.1
- Multi-agent parallel generation pipeline (Architect + Builder agents)
- Interactive slide types: quizzes, case studies, diagrams, decision trees
- Real-time streaming preview during generation
- Version control and auto-checkpoint for presentations
- Supabase cloud storage and Google Drive backup
- Mobile-responsive design with touch gestures

---

## Codebase Structure

```
PRESENTGENIUS/
├── App.tsx                    # Main application component
├── index.tsx                  # React entry point
├── index.html                 # HTML template
├── index.css                  # Global styles (Tailwind)
│
├── components/                # React components
│   ├── CanvasMode/            # Canvas-based editing modes
│   ├── FormatPicker/          # Presentation format selection
│   ├── LectureBuilder/        # Lecture configuration components
│   ├── SlideEditor/           # Rich slide editing interface
│   ├── ai/                    # AI enhancement panels
│   ├── auth/                  # Authentication components
│   ├── editor/                # Visual editor components
│   ├── materials/             # Companion materials
│   ├── mobile/                # Mobile-specific components
│   ├── polling/               # Audience polling
│   └── presenter/             # Presenter view components
│
├── services/                  # Business logic & API integrations
│   ├── providers/             # AI provider implementations
│   │   ├── base-provider.ts   # Base provider interface
│   │   └── minimax.ts         # MiniMax API integration
│   ├── ai-provider.ts         # Provider routing & config
│   ├── parallel-generation.ts # Multi-agent generation pipeline
│   ├── supabase.ts            # Database operations
│   ├── google-drive.ts        # Google Drive backup
│   ├── export.ts              # PDF/HTML export
│   ├── version-control.ts     # Presentation versioning
│   └── ...                    # Other service modules
│
├── hooks/                     # Custom React hooks
│   ├── useToast.ts            # Toast notifications
│   ├── useConfirm.ts          # Confirmation dialogs
│   ├── useAuth.ts             # Authentication state
│   ├── useMediaQuery.ts       # Responsive breakpoints
│   └── ...                    # Other hooks
│
├── stores/                    # Zustand state stores
│   ├── app.store.ts           # Global app state
│   ├── slide.store.ts         # Slide management
│   ├── toast.store.ts         # Toast notifications
│   └── dialog.store.ts        # Dialog state
│
├── lib/                       # Utility libraries
│   ├── storage.ts             # localStorage helpers
│   ├── retry.ts               # API retry logic
│   ├── env-validator.ts       # Environment validation
│   └── supabase/              # Supabase client & types
│
├── types/                     # TypeScript type definitions
│   ├── slides.ts              # Slide data structures
│   ├── lecture.ts             # Lecture types
│   └── creative-layouts.ts    # Layout configurations
│
├── utils/                     # Utility functions
│   ├── browser-detection.ts   # Browser compatibility
│   ├── presentation-styles.ts # Slide styling utilities
│   ├── iframe-helpers.ts      # Iframe management
│   └── fullscreen-api.ts      # Fullscreen controls
│
├── templates/                 # Slide & activity templates
│   ├── mini-games.ts          # Interactive game templates
│   ├── decision-tree.ts       # Decision tree templates
│   ├── drug-dosing.ts         # Medical dosing calculator
│   └── new-formats/           # Additional format templates
│
├── tests/                     # Test files (Vitest)
│   ├── setup.ts               # Test setup/mocks
│   └── *.test.ts              # Test modules
│
├── docs/                      # Documentation
├── public/                    # Static assets
├── supabase/                  # Supabase migrations
└── config/                    # App configuration
```

---

## Technology Stack

### Core Technologies
- **React 19** with TypeScript
- **Vite** for bundling and dev server
- **TailwindCSS** for styling
- **Zustand** for state management

### AI Integration
- **MiniMax M2.1** - Primary AI provider (200K context)
- Multi-agent pipeline: Architect Agent + Builder Agents

### Data & Storage
- **Supabase** - Cloud database and auth
- **localStorage** - Client-side persistence
- **Google Drive** - Optional backup

### Testing
- **Vitest** - Test runner
- **jsdom** - Browser environment simulation

### Key Dependencies
```json
{
  "react": "^19.2.0",
  "@tiptap/react": "^3.14.0",      // Rich text editor
  "zustand": "^5.0.9",              // State management
  "html2canvas": "^1.4.1",          // Screenshot generation
  "jspdf": "^3.0.4",                // PDF export
  "reveal.js": "^5.2.1",            // Presentation framework
  "@supabase/supabase-js": "^2.89.0" // Database client
}
```

---

## Development Workflow

### Setup
```bash
# Install dependencies
npm install

# Copy environment file and add API keys
cp .env.example .env.local

# Start development server
npm run dev
```

### Available Scripts
| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server on port 3000 |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:ui` | Open Vitest UI |

### Environment Variables
Required in `.env.local`:
```bash
# Required: At least one AI provider key
VITE_MINIMAX_API_KEY=eyJ...your_key

# Optional: Cloud storage
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## Architecture Patterns

### Multi-Agent Generation Pipeline
Located in `services/parallel-generation.ts`:
1. **Architect Agent** - Analyzes input, creates curriculum outline
2. **Builder Agents** - Parallel slide generation (1 to N slides)
3. **Assembler** - Stitches fragments into final HTML

### State Management
- Global state via Zustand stores in `stores/`
- Component-local state with `useState`
- Custom hooks for reusable logic in `hooks/`

### Provider Pattern
AI providers extend `BaseProvider` interface:
```typescript
interface BaseProvider {
  generate(prompt: string, files: FileInput[], options: GenerationOptions, onProgress?: ProgressCallback): Promise<string>;
}
```

### Error Handling
- Centralized in `services/error-handler.ts`
- Provides formatted user-friendly messages
- Includes retry logic via `lib/retry.ts`

---

## Code Conventions

### File Naming
- Components: `PascalCase.tsx` (e.g., `LivePreview.tsx`)
- Services: `kebab-case.ts` (e.g., `parallel-generation.ts`)
- Hooks: `useCamelCase.ts` (e.g., `useToast.ts`)
- Tests: `*.test.ts` (e.g., `export.test.ts`)

### Component Structure
```tsx
// 1. Imports
import React, { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast';

// 2. Types/Interfaces
interface ComponentProps {
  title: string;
  onAction: () => void;
}

// 3. Component
const MyComponent: React.FC<ComponentProps> = ({ title, onAction }) => {
  // Hooks first
  const { showError } = useToast();
  const [state, setState] = useState(false);

  // Effects
  useEffect(() => { /* ... */ }, []);

  // Handlers
  const handleClick = () => { /* ... */ };

  // Render
  return <div>{/* JSX */}</div>;
};

export default MyComponent;
```

### Styling Conventions
- Use TailwindCSS utility classes
- Dark mode: `bg-zinc-950`, `text-zinc-50`
- Accent colors: `cyan-500`, `purple-600`
- Custom theme in `tailwind.config.js`

### TypeScript
- Strict mode enabled
- Path alias: `@/*` maps to project root
- Types in `types/` directory for shared types

---

## Key Files Reference

### Entry Points
- `App.tsx:32` - Main application component
- `index.tsx` - React DOM render
- `index.html` - HTML shell

### Core Services
- `services/parallel-generation.ts` - Multi-agent generation
- `services/ai-provider.ts` - Provider configuration
- `services/providers/minimax.ts` - MiniMax implementation

### State Management
- `stores/app.store.ts` - Global application state
- `stores/slide.store.ts` - Slide data management
- `stores/toast.store.ts` - Notification state

### UI Components
- `components/LivePreview.tsx` - Main preview component
- `components/CenteredInput.tsx` - Prompt input UI
- `components/ChatPanel.tsx` - Refinement chat interface

---

## Testing Guidelines

### Test Structure
```typescript
import { describe, it, expect, vi } from 'vitest';

describe('ServiceName', () => {
  it('should do something', () => {
    // Arrange
    // Act
    // Assert
    expect(result).toBe(expected);
  });
});
```

### Running Tests
```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:ui          # Visual UI
```

### Test Files Location
Tests are in `tests/` directory, mirroring source structure:
- `tests/export.test.ts` - Tests for `services/export.ts`
- `tests/storage.test.ts` - Tests for `lib/storage.ts`

---

## Common Development Tasks

### Adding a New Component
1. Create file in `components/NewComponent.tsx`
2. Export from component or add to lazy loading in `LazyComponents.tsx`
3. Import where needed

### Adding a New Service
1. Create file in `services/my-service.ts`
2. Export functions or class
3. Add tests in `tests/my-service.test.ts`

### Adding a New Hook
1. Create file in `hooks/useMyHook.ts`
2. Export from `hooks/index.ts`
3. Use in components

### Modifying Slide Templates
Templates are in `templates/`:
- `mini-games.ts` - Interactive games
- `decision-tree.ts` - Clinical decision trees
- `drug-dosing.ts` - Dosing calculators

### Database Schema Changes
1. Modify `supabase-schema.sql`
2. Run migrations in Supabase dashboard
3. Update types in `lib/supabase/types.ts`

---

## Debugging Tips

### Console Logging
The codebase uses prefixed logging:
```javascript
console.log('[App] Loading presentations...');
console.log('[Supabase] Query result:', data);
```

### Common Issues

**API Key Issues:**
- Check `.env.local` has correct keys
- Verify key format (MiniMax keys start with `eyJ`)
- Restart dev server after env changes

**Build Errors:**
- Run `npm install` to update dependencies
- Check TypeScript errors with IDE
- Verify import paths use `@/` alias

**Streaming Issues:**
- Check `VITE_ALLOW_IFRAME_SCRIPTS` env variable
- Verify sandbox attributes in iframe

---

## Important Notes for AI Assistants

### Do Not Modify
- Environment files (`.env.local`) - contains secrets
- `package-lock.json` - auto-generated
- `supabase-schema.sql` - requires migration process

### Before Making Changes
1. Read the relevant files first
2. Understand the existing patterns
3. Run tests after changes: `npm test`
4. Check for TypeScript errors

### Code Quality Checklist
- [ ] TypeScript types are correct
- [ ] No console.log left in production code (use debug prefix)
- [ ] Error handling for async operations
- [ ] Mobile responsiveness considered
- [ ] Accessibility attributes included

### Commit Message Format
```
type: short description

- Detail 1
- Detail 2
```
Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`

---

## Documentation References

Additional documentation in `/docs`:
- `ERROR_HANDLING.md` - Error handling patterns
- `TESTING_GUIDE.md` - Testing best practices
- `STORAGE_IMPLEMENTATION.md` - Storage architecture
- `FAL_IMAGE_GENERATION.md` - Image generation service

---

*Last updated: January 2026*
