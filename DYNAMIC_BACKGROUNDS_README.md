# Dynamic Context-Aware Backgrounds

## Overview
PresentationMode now automatically detects slide content type and applies appropriate background gradients for enhanced visual presentation.

## Features

### Content Type Detection
The system analyzes each slide and detects the following content types:

#### 1. Code Slides
- **Detected by**: `<pre>`, `<code>` tags or class="code", class="language-*"
- **Background**: Dark purple-gray gradient `#1e1e2e` → `#2d2d44`
- **Use case**: Syntax highlighting, code snippets, programming examples

#### 2. Medical Diagrams
- **Detected by**: Images + medical keywords (anatomy, medical, clinical, diagnosis, patient, treatment, surgery, cardiac, brain, organ, MRI, CT scan, X-ray, pathology, radiology)
- **Background**: Slate blue gradient `#0f172a` → `#1e293b` → `#334155`
- **Use case**: Anatomical diagrams, medical imaging, physiological illustrations

#### 3. Clinical Case Studies
- **Detected by**: Clinical keywords (patient, diagnosis, symptoms, prognosis, case study, chief complaint, history of present illness, physical examination, laboratory, differential diagnosis)
- **Background**: Deep blue gradient `#082f49` → `#0c4a6e` → `#075985`
- **Use case**: Patient cases, clinical presentations, diagnostic workflows

#### 4. Data Visualization
- **Detected by**: Charts, tables, SVG, canvas elements OR data keywords (data, chart, graph, statistics, analysis, metrics, results, percentage, comparison)
- **Background**: Charcoal gradient `#18181b` → `#27272a` → `#3f3f46`
- **Use case**: Tables, charts, graphs, statistical presentations

#### 5. Text-Heavy Slides
- **Detected by**: More than 3 paragraphs OR text length > 500 characters
- **Background**: Navy blue gradient `#1a1a2e` → `#16213e` → `#0f3460`
- **Use case**: Detailed explanations, documentation, long-form content

#### 6. Default
- **Detected by**: All other content
- **Background**: Dark gradient `#0a0a0f` → `#1a1a24` → `#2a2a3a`
- **Use case**: General slides, mixed content

## Implementation

### Files Modified
- `/components/PresentationMode.tsx` - Main presentation component
- `/utils/content-detector.ts` - Content analysis and background detection utility

### Key Functions

#### `detectContentTypeAndBackground(slideElement: Element): string`
Analyzes slide content and returns CSS background style string.

#### `applyBackgroundStyle(element: HTMLElement, backgroundStyle: string): void`
Applies CSS background properties to an HTML element.

#### `analyzeContent(slideElement: Element): ContentAnalysis`
Returns detailed analysis with content type, background style, and confidence score.

## Usage

Backgrounds are applied automatically:
1. When presentation mode is initialized
2. When slides are loaded into the iframe
3. When transitioning between slides

No manual configuration required - the system intelligently detects and applies appropriate backgrounds.

## Technical Details

### Detection Priority
1. Code (highest priority - explicit tags)
2. Medical diagrams (images + keywords)
3. Clinical cases (keywords)
4. Data visualization (elements + keywords)
5. Text-heavy (paragraph count/length)
6. Default (fallback)

### Performance
- Backgrounds are detected once on slide load
- Cached in component state (`slideBackgrounds`)
- Reapplied during slide transitions
- No performance impact on rendering

### Accessibility
- All backgrounds maintain high contrast with text
- Gradients are subtle and don't interfere with readability
- Content remains the primary focus

## Examples

```html
<!-- Code Slide -->
<section>
  <h2>Python Example</h2>
  <pre><code class="language-python">
  def hello():
      print("Hello, World!")
  </code></pre>
</section>
<!-- Auto-applies dark purple-gray background -->

<!-- Medical Diagram -->
<section>
  <h2>Cardiac Anatomy</h2>
  <img src="heart-diagram.png" alt="Heart anatomy" />
  <p>The human heart is a muscular organ...</p>
</section>
<!-- Auto-applies slate blue background -->

<!-- Clinical Case -->
<section>
  <h2>Case Study</h2>
  <p><strong>Patient:</strong> 45-year-old male</p>
  <p><strong>Chief Complaint:</strong> Chest pain</p>
  <p><strong>History of Present Illness:</strong>...</p>
</section>
<!-- Auto-applies deep blue background -->
```

## Future Enhancements
- User preference overrides
- Custom background themes
- Animation transitions between background types
- Content confidence scoring visualization
- Manual background type selection
