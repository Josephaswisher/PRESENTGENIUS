# PresentGenius Rebuild Prompt

Build a medical education presentation generator using React + TypeScript + Vite with the following architecture:

## Core Architecture

**Principle: Artifact = Container**
- Each slide is a complete HTML artifact in an isolated iframe container
- Generate 4-50+ slides based on content complexity
- Use MiniMax M2.1 API for all AI generation
- Stream results in real-time as slides are built

## Tech Stack

```json
{
  "framework": "React 19 + TypeScript",
  "build": "Vite",
  "ai": "MiniMax M2.1 (abab7.5s-chat-241218)",
  "styling": "Tailwind CSS",
  "isolation": "iframe sandboxing",
  "database": "Supabase (storage + caching)"
}
```

## Generation Pipeline (Multi-Agent Parallel)

### Phase 1: Architect Agent
```typescript
// Analyzes prompt → determines optimal slide count (4-50+)
// Returns: { slideCount: number, topics: string[] }
```

### Phase 2: Parallel Builders (N agents)
```typescript
// Each builder generates 1 slide as complete HTML artifact
// Builder N receives: { slideNumber, topic, context }
// Builder N returns: base64-encoded HTML with embedded Tailwind
```

### Phase 3: Assembler Agent
```typescript
// Strings containers together with navigation
// Wraps each slide HTML in iframe container
// Adds slide controls (prev/next/grid)
```

## File Structure

```
src/
├── App.tsx                          # Main UI: prompt input + preview
├── components/
│   ├── PresentationMode.tsx        # Fullscreen viewer with navigation
│   ├── LivePreview.tsx             # Real-time streaming preview
│   └── CreationHistory.tsx         # Load saved presentations
└── services/
    ├── minimax.ts                   # MiniMax API client
    ├── parallel-generation.ts       # Multi-agent pipeline
    ├── supabase.ts                  # Supabase client
    └── storage.ts                   # Save/load presentations
```

## Supabase Integration

### Database Schema (Minimal)

```sql
-- Presentations table
CREATE TABLE presentations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  prompt TEXT NOT NULL,
  html TEXT NOT NULL,
  slide_count INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  thumbnail TEXT -- Base64 preview image
);

-- Index for fast lookups
CREATE INDEX idx_presentations_created ON presentations(created_at DESC);

-- Cache table (optional - for faster regeneration)
CREATE TABLE generation_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_hash TEXT UNIQUE NOT NULL,
  architect_plan JSONB,
  slides JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
);

CREATE INDEX idx_cache_hash ON generation_cache(prompt_hash);
CREATE INDEX idx_cache_expires ON generation_cache(expires_at);
```

### Storage Service (services/storage.ts)

```typescript
import { supabase } from './supabase';

interface Presentation {
  id?: string;
  prompt: string;
  html: string;
  slide_count: number;
  thumbnail?: string;
  metadata?: Record<string, any>;
}

// Save presentation
export async function savePresentation(data: Presentation): Promise<string> {
  const { data: result, error } = await supabase
    .from('presentations')
    .insert([{
      prompt: data.prompt,
      html: data.html,
      slide_count: data.slide_count,
      thumbnail: data.thumbnail,
      metadata: data.metadata || {}
    }])
    .select('id')
    .single();

  if (error) throw error;
  return result.id;
}

// Load presentation by ID
export async function loadPresentation(id: string): Promise<Presentation> {
  const { data, error } = await supabase
    .from('presentations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

// Get recent presentations
export async function getRecentPresentations(limit = 10): Promise<Presentation[]> {
  const { data, error } = await supabase
    .from('presentations')
    .select('id, prompt, slide_count, thumbnail, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// Cache architect plan (optional - speeds up similar prompts)
export async function cacheArchitectPlan(
  prompt: string,
  plan: any,
  slides: any[]
): Promise<void> {
  const promptHash = await hashPrompt(prompt);

  await supabase
    .from('generation_cache')
    .upsert([{
      prompt_hash: promptHash,
      architect_plan: plan,
      slides: slides
    }]);
}

// Get cached plan
export async function getCachedPlan(prompt: string): Promise<any | null> {
  const promptHash = await hashPrompt(prompt);

  const { data } = await supabase
    .from('generation_cache')
    .select('architect_plan, slides')
    .eq('prompt_hash', promptHash)
    .gt('expires_at', new Date().toISOString())
    .single();

  return data;
}

// Simple hash function
async function hashPrompt(prompt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(prompt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

### Supabase Client (services/supabase.ts)

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### Updated App.tsx with Supabase

```typescript
import { useState, useEffect } from 'react';
import { generatePresentation } from './services/parallel-generation';
import { savePresentation, getRecentPresentations } from './services/storage';
import PresentationMode from './components/PresentationMode';
import CreationHistory from './components/CreationHistory';

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [html, setHtml] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [recentPresentations, setRecentPresentations] = useState([]);

  // Load recent presentations on mount
  useEffect(() => {
    getRecentPresentations(10).then(setRecentPresentations);
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(0);

    const result = await generatePresentation(
      prompt,
      (phase, percent, partial) => {
        setProgress(percent);
        if (partial) setHtml(partial); // Live preview
      }
    );

    // Save to Supabase
    const presentationId = await savePresentation({
      prompt,
      html: result,
      slide_count: countSlides(result),
      thumbnail: generateThumbnail(result)
    });

    setHtml(result);
    setIsGenerating(false);

    // Refresh history
    getRecentPresentations(10).then(setRecentPresentations);

    // Update URL with shareable ID
    window.history.pushState({}, '', `?id=${presentationId}`);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* History sidebar */}
      <CreationHistory
        presentations={recentPresentations}
        onSelect={(p) => setHtml(p.html)}
      />

      {/* Main content */}
      <div className="p-8">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your medical presentation..."
          className="w-full h-32 p-4 rounded-lg"
        />
        <button onClick={handleGenerate}>
          {isGenerating ? `Generating... ${progress}%` : 'Generate'}
        </button>
      </div>

      {html && <PresentationMode html={html} />}
    </div>
  );
}
```

## Key Features (Keep Simple)

### Must Have
1. **Prompt → Presentation**: Single input generates full deck
2. **Live Streaming**: Show slides as they're generated (SSE)
3. **Iframe Isolation**: Each slide in separate container
4. **Navigation**: Prev/Next/Grid view/Fullscreen
5. **Keyboard Shortcuts**: Arrows, Space, F for fullscreen, G for grid
6. **Supabase Storage**: Auto-save presentations + history sidebar
7. **Shareable URLs**: Each presentation gets unique URL (e.g., ?id=abc123)
8. **Smart Caching**: Cache architect plans to speed up similar prompts

### Skip (For Now)
- Drawing tools
- Speaker notes editing
- Bookmarks
- Timer/auto-play
- Presenter view
- Refinement/chat

## MiniMax Integration

```typescript
// services/minimax.ts
interface MiniMaxConfig {
  apiKey: string;
  model: 'abab7.5s-chat-241218';
  baseURL: 'https://api.minimax.chat/v1';
}

// Generate with streaming
async function* streamGeneration(prompt: string): AsyncGenerator<string> {
  const response = await fetch('/v1/text/chatcompletion_v2', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'abab7.5s-chat-241218',
      messages: [{ role: 'user', content: prompt }],
      stream: true
    })
  });

  // Parse SSE stream
  for await (const chunk of parseSSE(response)) {
    yield chunk.choices[0].delta.content;
  }
}
```

## Parallel Generation Algorithm

```typescript
async function generatePresentation(prompt: string): Promise<string> {
  // PHASE 1: Architect determines structure
  const plan = await architect({
    prompt,
    task: 'Analyze and determine optimal slide count (4-50+) and topics'
  });

  // PHASE 2: Parallel builders (each generates 1 slide)
  const slidePromises = plan.topics.map((topic, index) =>
    builder({
      slideNumber: index + 1,
      totalSlides: plan.slideCount,
      topic,
      context: prompt
    })
  );

  const slides = await Promise.all(slidePromises);

  // PHASE 3: Assembler strings containers together
  return assembler({
    slides, // Array of HTML strings
    navigation: true
  });
}
```

## Container Format (Each Slide)

```typescript
// Each slide is wrapped in iframe with base64-encoded HTML
function wrapInContainer(slideHTML: string, index: number): string {
  const encoded = btoa(slideHTML);

  return `
    <div class="slide-container" data-slide="${index}">
      <iframe
        srcdoc="${slideHTML}"
        sandbox="allow-same-origin allow-scripts"
        class="w-full h-screen"
        title="Slide ${index + 1}"
      />
    </div>
  `;
}
```

## Slide Template (Generated by Builder)

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      margin: 0;
      padding: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  </style>
</head>
<body class="bg-gradient-to-br from-blue-50 to-indigo-100">
  <section class="w-full h-full p-16">
    <!-- Slide content here -->
    <h1 class="text-6xl font-bold text-gray-800 mb-8">Title</h1>
    <div class="text-2xl text-gray-700 space-y-6">
      <!-- Content -->
    </div>
  </section>
</body>
</html>
```

## App.tsx (Main Component)

```typescript
import { useState } from 'react';
import { generatePresentation } from './services/parallel-generation';
import PresentationMode from './components/PresentationMode';
import LivePreview from './components/LivePreview';

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [html, setHtml] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [streamingHtml, setStreamingHtml] = useState('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(0);

    const result = await generatePresentation(
      prompt,
      (phase, percent, partial) => {
        setProgress(percent);
        if (partial) setStreamingHtml(partial);
      }
    );

    setHtml(result);
    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Input Section */}
      <div className="p-8">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your medical presentation..."
          className="w-full h-32 p-4 rounded-lg"
        />
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="mt-4 px-8 py-3 bg-blue-600 text-white rounded-lg"
        >
          {isGenerating ? `Generating... ${progress}%` : 'Generate'}
        </button>
      </div>

      {/* Live Preview */}
      {streamingHtml && (
        <LivePreview html={streamingHtml} />
      )}

      {/* Final Presentation */}
      {html && !isGenerating && (
        <PresentationMode html={html} />
      )}
    </div>
  );
}
```

## Navigation Controls (Built into Assembled Output)

```typescript
function addNavigationControls(): string {
  return `
    <div id="nav-controls" class="fixed bottom-4 left-1/2 transform -translate-x-1/2
                                   bg-black/80 text-white px-6 py-3 rounded-full
                                   flex gap-4 items-center z-50">
      <button onclick="prevSlide()">←</button>
      <span id="slide-counter">1 / 10</span>
      <button onclick="nextSlide()">→</button>
      <button onclick="toggleGrid()">⊞</button>
      <button onclick="toggleFullscreen()">⛶</button>
    </div>

    <script>
      let currentSlide = 0;
      const slides = document.querySelectorAll('.slide-container');
      const totalSlides = slides.length;

      function showSlide(n) {
        slides.forEach((s, i) => {
          s.style.display = i === n ? 'block' : 'none';
        });
        document.getElementById('slide-counter').textContent =
          \`\${n + 1} / \${totalSlides}\`;
      }

      function nextSlide() {
        currentSlide = (currentSlide + 1) % totalSlides;
        showSlide(currentSlide);
      }

      function prevSlide() {
        currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
        showSlide(currentSlide);
      }

      // Keyboard shortcuts
      document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') nextSlide();
        if (e.key === 'ArrowLeft') prevSlide();
        if (e.key === 'f') toggleFullscreen();
        if (e.key === 'g') toggleGrid();
      });

      showSlide(0);
    </script>
  `;
}
```

## API Requirements

### Environment Variables
```bash
# MiniMax AI
VITE_MINIMAX_API_KEY=your_minimax_key
VITE_MINIMAX_GROUP_ID=your_group_id

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Supabase Setup
```bash
# 1. Run migration to create tables
npm run supabase:setup

# 2. Or manually in Supabase SQL editor:
# Copy schema from "Database Schema (Minimal)" section above
```

### Rate Limits
- Architect: 1 call per generation
- Builders: N parallel calls (N = slide count)
- Assembler: Client-side (no API call)

## Success Criteria

1. ✅ User enters prompt → gets 4-50 slides
2. ✅ Each slide is isolated iframe container
3. ✅ Real-time streaming shows progress
4. ✅ Navigation works (prev/next/grid/fullscreen)
5. ✅ All generation uses MiniMax M2.1
6. ✅ Presentations auto-saved to Supabase
7. ✅ History sidebar shows recent presentations
8. ✅ Shareable URLs work (?id=abc123)
9. ✅ Clean codebase (<1500 lines total)

## What NOT to Include

- ❌ Multiple AI providers (just MiniMax)
- ❌ Drawing tools
- ❌ Speaker notes editing
- ❌ Bookmarks/timers
- ❌ Presenter view
- ❌ Refinement chat
- ❌ Export features (initially)

## Prompt for Claude Code

"Build a medical presentation generator using this exact architecture:

1. **Single input** → MiniMax parallel pipeline → **containerized slides**
2. **3-phase generation**: Architect (plan) → Builders (parallel slides) → Assembler (string containers)
3. **Iframe isolation**: Each slide is complete HTML in isolated container
4. **Tailwind styling**: Embedded in each slide via CDN
5. **Simple navigation**: Prev/Next/Grid/Fullscreen with keyboard shortcuts
6. **Live streaming**: Show slides as they're generated
7. **Supabase storage**: Auto-save presentations + history sidebar + shareable URLs
8. **Smart caching**: Cache architect plans in Supabase for faster similar prompts

Use MiniMax M2.1 API (abab7.5s-chat-241218) for all AI calls. Store everything in Supabase (presentations table + generation_cache table). Keep it simple - no drawing tools, no refinement chat, no extra features. Just clean generation and storage.

Files to build:
- services/minimax.ts (MiniMax API client with streaming)
- services/parallel-generation.ts (3-phase pipeline with caching)
- services/supabase.ts (Supabase client setup)
- services/storage.ts (save/load presentations, caching)
- App.tsx (prompt input + history sidebar + display)
- components/PresentationMode.tsx (viewer with navigation)
- components/CreationHistory.tsx (recent presentations sidebar)

Environment setup:
- VITE_MINIMAX_API_KEY
- VITE_MINIMAX_GROUP_ID
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

Database schema (run in Supabase SQL editor):
See 'Database Schema (Minimal)' section in REBUILD_PROMPT.md"

---

## Migration from Current Codebase

### Reuse from Existing App
- ✅ **Supabase setup**: Already configured with credentials in `.env`
- ✅ **Database tables**: `creations` table can be renamed to `presentations`
- ✅ **MiniMax provider**: `services/minimax.ts` already working
- ✅ **Parallel generation**: `services/parallel-generation.ts` has the 3-phase pipeline
- ✅ **Tailwind config**: Already set up correctly

### Keep & Simplify
- ✅ `services/minimax.ts` (MiniMax provider - keep as is)
- ✅ `services/parallel-generation.ts` (3-phase pipeline - add caching)
- ✅ Tailwind config (keep)
- ✅ Supabase setup (reuse existing tables or create new minimal schema)

### Simplify/Rebuild
- 🔄 `App.tsx` - strip to basics (prompt input only)
- 🔄 `PresentationMode.tsx` - keep navigation, remove tools
- 🔄 Remove: drawing, bookmarks, timer, notes editor, refinement

### Delete
- ❌ All provider files except minimax.ts
- ❌ services/ai-provider.ts (consolidate to minimax only)
- ❌ Drawing components
- ❌ Bookmark manager
- ❌ Notes editor
- ❌ Timer components

---

## Quick Start: Rebuild with Supabase

### Option 1: Reuse Existing Supabase Project

```bash
# 1. Check your current Supabase setup
cat .env | grep SUPABASE

# 2. In Supabase dashboard, add this minimal schema:
# - Go to SQL Editor
# - Copy "Database Schema (Minimal)" from above
# - Run to create presentations + generation_cache tables

# 3. Start rebuild in new branch
git checkout -b rebuild-clean
```

### Option 2: Fresh Supabase Project

```bash
# 1. Create new Supabase project at https://supabase.com
# 2. Get credentials: Settings → API
# 3. Update .env:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# 4. Run SQL schema from "Database Schema (Minimal)" section
# 5. Start rebuild
```

### What You Get with Supabase

✅ **Auto-save**: Every presentation automatically saved
✅ **History**: Sidebar showing all your previous generations
✅ **Shareable Links**: `yourapp.com?id=abc123` → loads that presentation
✅ **Smart Caching**: Similar prompts reuse architect plans (7-day TTL)
✅ **No data loss**: Everything persisted, even if you close browser
✅ **Fast**: Cached generations complete in seconds instead of minutes

### Caching Performance Example

```typescript
// First time: "Explain hypertension management"
// → Architect: 30s
// → 10 Builders: 60s
// → Total: ~90 seconds

// Second time: Similar prompt detected via hash
// → Architect: CACHED (0s)
// → 10 Builders: Reused with minor tweaks (15s)
// → Total: ~15 seconds ⚡
```

---

**Use this prompt to rebuild from scratch with a focused, maintainable architecture backed by Supabase storage and smart caching.**
