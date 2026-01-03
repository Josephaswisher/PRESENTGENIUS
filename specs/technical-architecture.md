# PresentGenius - Technical Architecture Specification

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Client)                         │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │ React App   │  │ Zustand      │  │ LocalStorage        │ │
│  │ (Vite HMR)  │←→│ State Store  │←→│ (Cache, Settings)   │ │
│  └─────────────┘  └──────────────┘  └─────────────────────┘ │
│         ↓                                                     │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Component Tree (App.tsx → CenteredInput, LivePreview,   │ │
│  │                ChatPanel, CreationHistory, Header)       │ │
│  └─────────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          ↓                             ↓
┌─────────────────────┐       ┌──────────────────────┐
│ OpenRouter API      │       │ Supabase Backend     │
│ (AI Models Gateway) │       │ (PostgreSQL + Auth)  │
│                     │       │                      │
│ • DeepSeek V3       │       │ • presentations      │
│ • Claude 4.5        │       │ • prompt_history     │
│ • GPT-4o            │       │ • user_settings      │
│ • Gemini 2.0        │       │ • auth.users         │
│ • GLM-4.7           │       └──────────────────────┘
│ • MiniMax M2.1      │
│ • Llama 3.3         │
└─────────────────────┘
```

## Frontend Architecture

### 1. Component Hierarchy

```
App.tsx (Root)
├── Header.tsx (Top bar with actions)
│   ├── UserMenu.tsx (Supabase auth)
│   └── ExportButtons (PDF, HTML, PNG)
├── CenteredInput.tsx (Prompt input + model selector)
│   └── ModelSelector (Dropdown with 15+ models)
├── LivePreview.tsx (Iframe sandbox)
│   └── PresentationMode.tsx (Fullscreen)
├── ChatPanel.tsx (AI refinement interface)
│   └── MessageBubble.tsx
├── CreationHistory.tsx (Sidebar with past work)
│   ├── HistoryItem.tsx
│   └── FavoritesPanel.tsx (Future)
├── GenerationProgress.tsx (Progress indicator)
├── SupabaseDataViewer.tsx (Cloud data browser)
└── SettingsPanel.tsx (Future - P0 task)
```

### 2. State Management (Zustand)

**Store**: `store/settings.ts`
```typescript
interface SettingsState {
  theme: 'dark' | 'light';
  autoSave: boolean;
  learnerLevel: 'medical-student' | 'resident' | 'attending' | 'fellow';
  notificationDuration: number;
  accessibility: {
    highContrast: boolean;
    reducedMotion: boolean;
    fontSize: 100 | 125 | 150;
  };
}
```

**Store**: `store/toast.ts` (Future)
```typescript
interface ToastState {
  toasts: Toast[];
  addToast: (message: string, type: ToastType) => void;
  dismissToast: (id: string) => void;
}
```

### 3. Service Layer

**AI Provider** (`services/ai-provider.ts`)
- Unified interface for all AI models
- Provider selection logic (always OpenRouter)
- Progress callback orchestration

**OpenRouter** (`services/openrouter.ts`)
- API request handling with retry logic
- Model definitions (OPENROUTER_MODELS constant)
- Error classification and user-friendly messages
- File upload handling for vision models

**API Key Validation** (`services/api-key-validation.ts`)
- Format checking (must start with "sk-")
- Error classification (network, auth, rate limit, etc.)
- Retry detection and delay calculation
- Setup instructions generator

**Supabase** (`services/supabase.ts`)
- Database queries (getPresentations, savePresentation)
- Authentication (signIn, signOut, getCurrentUser)
- Real-time subscriptions (future)
- Row-level security (RLS) enforcement

**Cache** (`services/cache.ts`)
- LocalStorage-based caching
- 1-hour TTL for prompt responses
- Cache key generation (hash prompt + provider)

**Knowledge** (`services/knowledge.ts`)
- Adaptive prompt context
- Medical education best practices
- Model-specific optimizations

## Data Models

### TypeScript Interfaces

**Creation** (Local state)
```typescript
interface Creation {
  id: string;                    // UUID
  name: string;                  // Auto-generated or user-provided
  html: string;                  // Generated presentation HTML
  originalImage?: string;        // Base64 image if uploaded
  timestamp: Date;               // Creation time
  activityId?: string;           // Activity type (case study, quiz, etc.)
  learnerLevel?: string;         // Target audience
  modelId?: OpenRouterModelId;   // AI model used
  isFavorite?: boolean;          // Future: starred status
}
```

**Presentation** (Supabase table)
```sql
CREATE TABLE presentations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  name VARCHAR(255) NOT NULL,
  html TEXT NOT NULL,
  original_image TEXT,
  activity_id VARCHAR(100),
  learner_level VARCHAR(100),
  model_id VARCHAR(100),
  is_favorite BOOLEAN DEFAULT FALSE,  -- Future: P1 task
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_presentations_user ON presentations(user_id, created_at DESC);
CREATE INDEX idx_presentations_favorite ON presentations(user_id, is_favorite, created_at DESC);
```

**PromptHistory** (Supabase table)
```sql
CREATE TABLE prompt_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  prompt TEXT NOT NULL,
  model_id VARCHAR(100),
  response_length INTEGER,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prompt_history_user ON prompt_history(user_id, created_at DESC);
```

## API Integration

### OpenRouter API

**Endpoint**: `https://openrouter.ai/api/v1/chat/completions`

**Request Format**:
```json
{
  "model": "deepseek/deepseek-chat",
  "messages": [
    {
      "role": "system",
      "content": "You are an expert medical educator..."
    },
    {
      "role": "user",
      "content": "Create a presentation about cardiac cycle"
    }
  ],
  "max_tokens": 16000,
  "temperature": 0.7
}
```

**Response Format**:
```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "<!DOCTYPE html>..."
      }
    }
  ],
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 3500
  }
}
```

**Error Handling**:
- 401 Unauthorized → Check API key
- 429 Rate Limit → Retry with exponential backoff (1s, 2s, 4s)
- 400 Bad Request → Invalid model ID or prompt
- 500 Server Error → Retry up to 3 times
- Timeout → 60-second limit, retry if transient

### Supabase API

**Authentication**:
```typescript
// Sign in with email
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});

// Sign in with Google OAuth
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google'
});
```

**Database Queries**:
```typescript
// Get user's presentations
const { data, error } = await supabase
  .from('presentations')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });

// Save new presentation
const { data, error } = await supabase
  .from('presentations')
  .insert({
    user_id: userId,
    name: 'Cardiac Cycle Presentation',
    html: generatedHtml,
    model_id: 'deepseek/deepseek-chat'
  });
```

## Performance Optimization

### 1. Code Splitting
```typescript
// Lazy load heavy components
const SupabaseDataViewer = lazy(() => import('./components/SupabaseDataViewer'));
const SettingsPanel = lazy(() => import('./components/SettingsPanel'));
const OnboardingFlow = lazy(() => import('./components/OnboardingFlow'));
```

### 2. Memoization
```typescript
// Expensive computations
const sortedHistory = useMemo(() => {
  return history.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}, [history]);

// Stable callbacks
const handleGenerate = useCallback((prompt: string) => {
  // ...generation logic
}, [/* dependencies */]);
```

### 3. Debouncing
```typescript
// Search input
const debouncedSearch = useDebouncedValue(searchQuery, 300);

useEffect(() => {
  // Run search with debouncedSearch
}, [debouncedSearch]);
```

### 4. Virtual Scrolling
```typescript
// For large history lists (future enhancement)
import { Virtuoso } from 'react-virtuoso';

<Virtuoso
  data={history}
  itemContent={(index, item) => <HistoryItem {...item} />}
/>
```

### 5. Image Optimization
```typescript
// Compress images before upload
import imageCompression from 'browser-image-compression';

const compressedFile = await imageCompression(file, {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920
});
```

## Security Architecture

### 1. API Key Protection
- **Storage**: Environment variables only (`.env`)
- **Never exposed**: Not in git, logs, or client-side code
- **Validation**: Format checking before use
- **Rotation**: Support key updates without app rebuild

### 2. Input Sanitization
```typescript
// DOMPurify for HTML sanitization
import DOMPurify from 'dompurify';

const sanitizedHtml = DOMPurify.sanitize(aiGeneratedHtml, {
  ALLOWED_TAGS: ['html', 'head', 'body', 'div', 'span', 'p', 'h1', 'h2', 'h3', ...],
  ALLOWED_ATTR: ['class', 'id', 'style', 'src', 'href', ...]
});
```

### 3. Iframe Sandboxing
```tsx
<iframe
  sandbox="allow-scripts allow-same-origin"
  srcDoc={sanitizedHtml}
  className="w-full h-full"
/>
```

### 4. Content Security Policy
```html
<meta http-equiv="Content-Security-Policy"
  content="
    default-src 'self';
    script-src 'self' 'unsafe-inline' cdn.tailwindcss.com;
    style-src 'self' 'unsafe-inline' cdn.tailwindcss.com;
    img-src 'self' data: https:;
    connect-src 'self' https://openrouter.ai https://*.supabase.co;
  "
>
```

### 5. Rate Limiting (Future)
```typescript
// Client-side rate limiting
const rateLimiter = new RateLimiter({
  maxRequests: 10,
  perMilliseconds: 60000 // 10 requests per minute
});

if (!rateLimiter.tryRemoveTokens(1)) {
  throw new Error('Rate limit exceeded. Please wait before generating again.');
}
```

## Deployment Architecture

### Vercel (Recommended)

**Configuration** (`vercel.json`):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": {
    "VITE_OPENROUTER_API_KEY": "@openrouter-api-key",
    "VITE_SUPABASE_URL": "@supabase-url",
    "VITE_SUPABASE_ANON_KEY": "@supabase-anon-key"
  },
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

**Build Process**:
1. `npm install` - Install dependencies
2. `npm run build` - Vite production build
3. Output to `/dist` - Static files
4. Deploy to Vercel CDN

**Environment Variables**:
- Stored in Vercel dashboard
- Encrypted at rest
- Injected at build time

### Alternative: Netlify

**Configuration** (`netlify.toml`):
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Monitoring & Observability

### 1. Error Tracking
```typescript
// Sentry integration (future)
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 0.1
});
```

### 2. Analytics
```typescript
// Google Analytics (future)
import ReactGA from 'react-ga4';

ReactGA.initialize(import.meta.env.VITE_GA_MEASUREMENT_ID);

// Track events
ReactGA.event({
  category: 'Generation',
  action: 'Created Presentation',
  label: modelId
});
```

### 3. Performance Monitoring
```typescript
// Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);  // Cumulative Layout Shift
getFID(console.log);  // First Input Delay
getFCP(console.log);  // First Contentful Paint
getLCP(console.log);  // Largest Contentful Paint
getTTFB(console.log); // Time to First Byte
```

## Scalability Considerations

### Current Limits (Free Tier)
- **Supabase**: 500MB storage, 2GB bandwidth/month
- **Vercel**: 100GB bandwidth/month
- **OpenRouter**: Pay-per-use, no hard limits

### Growth Strategy
1. **Phase 1 (0-100 users)**: Free tiers sufficient
2. **Phase 2 (100-1000 users)**: Upgrade Supabase to Pro ($25/mo)
3. **Phase 3 (1000+ users)**: Add caching layer (Redis), CDN for assets

### Database Optimization
```sql
-- Partitioning (future)
CREATE TABLE presentations_2026_01 PARTITION OF presentations
FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- Archiving old data
CREATE TABLE presentations_archive AS
SELECT * FROM presentations WHERE created_at < NOW() - INTERVAL '1 year';
```

---

**Document Version**: 1.0
**Last Updated**: 2026-01-03
**Owner**: Development Team
**Status**: Active Development
