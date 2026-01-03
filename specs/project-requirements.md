# PresentGenius - Project Requirements Specification

## Product Vision

**PresentGenius** is an AI-powered platform that enables medical educators to create interactive, visually engaging HTML presentations in minutes. By leveraging multiple state-of-the-art AI models, educators can focus on teaching while the system handles design, interactivity, and accessibility.

## Target Users

1. **Medical Faculty** - Creating lectures for medical students
2. **Resident Educators** - Designing case studies and teaching rounds
3. **Healthcare Trainers** - Building continuing education content
4. **Medical Students** - Preparing presentations for rounds/conferences

## Core Functional Requirements

### FR1: AI Model Selection
- Support 15+ AI models via OpenRouter API
- Display model metadata (name, icon, tier, pricing)
- Default to cost-effective model (DeepSeek V3)
- Allow dynamic model switching mid-session

### FR2: Content Generation
- Text prompt input (500-character limit, expandable)
- Image upload support (JPG, PNG, WebP)
- Multi-modal generation (text + images)
- Real-time progress tracking (10+ stages)
- Retry logic for transient failures
- Response caching for repeated prompts

### FR3: Live Preview & Editing
- Sandboxed iframe rendering
- Split-panel layout (60/40 preview/chat)
- AI-powered refinement via chat
- Undo/redo history (50 entries)
- Fullscreen presentation mode
- Mobile-responsive preview

### FR4: Cloud Storage
- Auto-save to Supabase PostgreSQL
- Prompt history tracking
- User authentication (email/OAuth)
- Database viewer for saved content
- Conflict resolution for concurrent edits

### FR5: Export Capabilities
- HTML export (standalone with embedded CSS)
- PDF export (via html2canvas + jsPDF)
- PNG screenshot (configurable resolution)
- Batch export (ZIP for multiple presentations)

### FR6: Settings & Configuration
- Theme selection (dark mode default)
- Auto-save toggle
- Default learner level (medical student, resident, attending)
- API key management
- Notification preferences
- Accessibility options

## Non-Functional Requirements

### NFR1: Performance
- **Page Load**: < 2 seconds
- **AI Generation**: 5-15 seconds (model-dependent)
- **Preview Render**: < 1 second
- **Export**: < 5 seconds for HTML/PNG, < 10 seconds for PDF

### NFR2: Reliability
- **Uptime**: 99.5% (excludes planned maintenance)
- **Error Rate**: < 1% of API calls
- **Data Loss**: Zero tolerance (auto-save + Supabase backup)
- **Retry Logic**: 3 attempts with exponential backoff

### NFR3: Security
- **API Keys**: Stored in .env, never committed to git
- **Input Sanitization**: Prevent XSS in prompts and generated HTML
- **Iframe Sandboxing**: Isolate preview from main app
- **HTTPS**: All API calls encrypted
- **Auth**: JWT-based authentication via Supabase

### NFR4: Usability
- **Onboarding**: 4-step tutorial for new users
- **Accessibility**: WCAG 2.1 AA compliance
- **Mobile Support**: Responsive down to 375px width
- **Error Messages**: User-friendly with actionable suggestions
- **Keyboard Shortcuts**: 12+ shortcuts for power users

### NFR5: Scalability
- **Concurrent Users**: Support 100+ simultaneous sessions
- **Database**: Supabase handles 500MB+ storage
- **Caching**: 40%+ cache hit rate for prompts
- **API Rate Limiting**: 100 calls/hour per user

## Technical Constraints

### TC1: Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (JIT mode)
- **State**: Zustand for global state
- **Database**: Supabase PostgreSQL
- **Hosting**: Vercel (recommended)
- **AI**: OpenRouter API (unified gateway)

### TC2: Browser Support
- **Chrome/Edge**: 90+
- **Safari**: 14+
- **Firefox**: 88+
- **Mobile**: iOS 14+, Android 10+

### TC3: API Dependencies
- **OpenRouter**: Primary AI provider
- **Supabase**: Authentication + database
- **Optional**: Direct API access (Anthropic, Google, etc.)

## User Stories

### US1: Create Presentation (Medical Faculty)
**As a** medical faculty member,
**I want to** generate a presentation by describing the topic,
**So that** I can save 4+ hours of design work.

**Acceptance Criteria**:
- User enters prompt: "Explain cardiac cycle with animations"
- System generates interactive HTML with embedded diagrams
- Preview shows in < 15 seconds
- User can refine via chat ("Add systolic dysfunction")

### US2: Refine Content (Resident Educator)
**As a** resident educator,
**I want to** modify generated content without starting over,
**So that** I can quickly iterate on presentation design.

**Acceptance Criteria**:
- User clicks "Refine" in chat panel
- Types instruction: "Make text larger, add quiz at end"
- AI updates HTML preserving existing structure
- Changes preview in < 10 seconds

### US3: Save and Reuse (Healthcare Trainer)
**As a** healthcare trainer,
**I want to** save presentations to the cloud,
**So that** I can access them from any device.

**Acceptance Criteria**:
- Presentations auto-save to Supabase
- User sees "Saved" indicator in UI
- Can load from database viewer
- Works offline with local storage fallback

### US4: Export for Distribution (Medical Student)
**As a** medical student,
**I want to** export as PDF for sharing,
**So that** I can distribute to classmates.

**Acceptance Criteria**:
- User clicks "Export PDF"
- File downloads in < 10 seconds
- PDF preserves layout and styling
- Works on all browsers

### US5: Keyboard Productivity (Power User)
**As a** power user,
**I want** keyboard shortcuts for common actions,
**So that** I can work faster.

**Acceptance Criteria**:
- Cmd+S saves current presentation
- Cmd+K opens command palette
- Cmd+N starts new presentation
- Cmd+? shows help overlay with all shortcuts

## Success Metrics

### KPIs
- **User Activation**: 70% of new users create first presentation
- **Retention**: 40% return within 7 days
- **Presentation Quality**: 80% user satisfaction (survey)
- **Error Rate**: < 5% failed generations
- **Export Success**: 95% of exports complete

### Business Goals
- **Time Savings**: Reduce presentation creation from 4 hours → 30 minutes
- **Cost Efficiency**: Average $0.50 per presentation (API costs)
- **Adoption**: 500+ monthly active users by Q2 2026

## Out of Scope (Future Roadmap)

### Phase 2 (Q2 2026)
- Collaborative editing (real-time multiplayer)
- Presentation templates library (50+ pre-built)
- Voice input (Web Speech API)
- Analytics dashboard (view tracking)

### Phase 3 (Q3 2026)
- Mobile app (React Native)
- Plugin system (custom AI models/exporters)
- Advanced animations (Framer Motion)
- Slide deck format (multi-page presentations)

### Phase 4 (Q4 2026)
- LMS integration (Canvas, Blackboard)
- SCORM compliance
- Video generation (presentation → video)
- AI teaching assistant (Q&A on slides)

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| API cost overruns | High | Medium | Rate limiting, model selection defaults, caching |
| AI hallucinations (inaccurate medical content) | Critical | Medium | User review required, medical disclaimers, fact-checking prompts |
| Supabase quota exceeded | Medium | Low | Monitor usage, upgrade plan, implement pagination |
| Browser compatibility issues | Medium | Medium | Polyfills, feature detection, graceful degradation |
| Security vulnerabilities (XSS) | High | Low | Input sanitization, CSP headers, sandbox iframes |

## Compliance & Legal

### HIPAA Considerations
- **No PHI Storage**: App does not store patient data
- **User Responsibility**: Educators must not include PHI in prompts
- **Disclaimer**: "Do not enter patient-identifiable information"

### Copyright & Attribution
- **AI-Generated Content**: Users retain ownership
- **Model Attribution**: Show which AI generated content
- **Tailwind CSS License**: MIT (compliant)

### Terms of Service
- User agreement required on first use
- No warranty on medical accuracy (educational use only)
- API usage limits disclosed

---

**Document Version**: 1.0
**Last Updated**: 2026-01-03
**Owner**: Development Team
**Status**: Active Development
