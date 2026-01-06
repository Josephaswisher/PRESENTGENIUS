/**
 * Parallel Agents Architecture for Fast Content Generation
 * Simplified to use MiniMax only
 *
 * Architecture:
 * 1. Architect Agent (MiniMax M2.1) - analyzes files and creates curriculum outline
 * 2. Parallel Builder Agents (MiniMax M2.1) - build individual slides concurrently (1 to infinite slides)
 * 3. Assembler - stitches fragments into flat HTML (no iframes, no base64)
 */

import { MiniMaxProvider, BaseProvider } from './providers';
import type { FileInput, ProgressCallback } from './providers';
import type { AIProvider } from './ai-provider';
import { getPresentationStyleTag } from '../utils/presentation-styles';
// DISABLED: External image generation using FAL API
// import { generateChapterImages, type GeneratedImage } from './fal-image-generator';

/**
 * Curriculum outline structure returned by Architect Agent
 */
export interface CurriculumOutline {
  title: string;
  description: string;
  learnerLevel: string;
  slides: SlideOutline[];
}

export interface SlideOutline {
  id: number;
  title: string;
  description: string;
  keyTopics: string[];
  interactionType: 'quiz' | 'case-study' | 'diagram' | 'decision-tree';
}

/**
 * Slide fragment built by Builder Agent
 */
export interface SlideFragment {
  slideId: number;
  title: string;
  html: string;
}

/**
 * Get a fast provider instance for parallel work
 */
function getFastProvider(provider: AIProvider): BaseProvider {
  // Simplified to only use MiniMax
  return new MiniMaxProvider();
}

/**
 * STEP 1: Architect Agent - Analyze files and create curriculum outline
 */
async function architectAgent(
  prompt: string,
  files: FileInput[],
  provider: AIProvider,
  onProgress?: ProgressCallback
): Promise<CurriculumOutline> {
  onProgress?.('architect', 5, '🏗️ Architect Agent initializing...');

  const providerImpl = getFastProvider(provider);

  onProgress?.('architect', 8, '📚 Analyzing educational content requirements...');

  const architectPrompt = `You are an expert Medical Education Architect.

Analyze the following request and uploaded files to create a structured curriculum outline.

User Request: ${prompt}

Output a JSON curriculum outline with this EXACT structure:
{
  "title": "Course Title",
  "description": "Brief overview",
  "learnerLevel": "Medical Student | Resident | Attending",
  "slides": [
    {
      "id": 1,
      "title": "Slide Title",
      "description": "What this slide covers",
      "keyTopics": ["topic1", "topic2", "topic3"],
      "interactionType": "quiz" | "case-study" | "diagram" | "decision-tree"
    }
  ]
}

Create as many slides as needed to thoroughly cover the topic (1 to infinite slides supported). Each slide should be focused and cover a distinct aspect of the topic.

Return ONLY the JSON, no other text.`;

  try {
    // Simplified to only use MiniMax
    const fastModel = 'MiniMax-M2.1';

    onProgress?.('architect', 12, `🤖 Connecting to MINIMAX (${fastModel})...`);

    const response = await providerImpl.generate(
      architectPrompt,
      files,
      { modelId: fastModel },
      onProgress
    );

    // DEBUG: Log raw architect response
    console.log('🔍 [DEBUG] RAW ARCHITECT RESPONSE (first 1000 chars):', response.substring(0, 1000));
    console.log('🔍 [DEBUG] Response type:', typeof response);
    console.log('🔍 [DEBUG] Response length:', response.length, 'chars');

    onProgress?.('architect', 18, '🔍 Parsing curriculum structure...');
    onProgress?.('architect', 22, '📋 Validating chapter organization...');

    // Strip markdown code blocks if present (```json ... ``` or ``` ... ```)
    let cleanedResponse = response.trim();
    if (cleanedResponse.startsWith('```')) {
      // Remove opening markdown fence (```json or ``` or ```javascript)
      cleanedResponse = cleanedResponse.replace(/^```(?:json|javascript|js)?\n?/, '');
      // Remove closing markdown fence
      cleanedResponse = cleanedResponse.replace(/\n?```\s*$/, '');
      console.log('🔍 [DEBUG] Stripped markdown code blocks from Architect response');
    }

    // Extract JSON from response with better error handling
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ [Architect] No JSON found in response');
      console.error(`Response preview: ${response.substring(0, 500)}...`);
      throw new Error('Architect Agent failed to return valid JSON. The AI response did not contain a JSON object. Please try again.');
    }

    let outline: CurriculumOutline;
    try {
      outline = JSON.parse(jsonMatch[0]) as CurriculumOutline;
    } catch (parseError: any) {
      console.error('❌ [Architect] JSON parsing failed:', parseError);
      console.error(`JSON preview: ${jsonMatch[0].substring(0, 500)}...`);
      throw new Error(`Architect Agent returned malformed JSON: ${parseError.message}. Please try again.`);
    }

    // Validate outline structure
    if (!outline || typeof outline !== 'object') {
      throw new Error('Architect Agent returned invalid curriculum structure. Expected an object.');
    }

    if (!outline.title || typeof outline.title !== 'string') {
      console.warn('⚠️ [Architect] Missing or invalid title, using default');
      outline.title = 'Medical Presentation';
    }

    if (!outline.slides || !Array.isArray(outline.slides)) {
      throw new Error('Curriculum must include a "slides" array.');
    }

    if (outline.slides.length === 0) {
      throw new Error('Curriculum must have at least one slide. Please try again with a more detailed prompt.');
    }

    // Validate each slide has required fields
    outline.slides.forEach((slide, index) => {
      if (!slide.title) {
        slide.title = `Slide ${index + 1}`;
      }
      if (!slide.description) {
        slide.description = 'Educational content';
      }
      if (!slide.keyTopics || !Array.isArray(slide.keyTopics)) {
        slide.keyTopics = [];
      }
      if (!slide.interactionType) {
        slide.interactionType = 'diagram';
      }
    });

    console.log('✅ [Architect] Curriculum outline:', outline);
    console.log(`✅ [Architect] Generated ${outline.slides.length} slides`);
    return outline;

  } catch (error: any) {
    console.error('❌ [Architect Agent] Error:', error);
    throw new Error(`Architect Agent failed: ${error.message}`);
  }
}

/**
 * STEP 2: Builder Agent - Build a single slide
 */
async function slideBuilderAgent(
  slide: SlideOutline,
  courseContext: CurriculumOutline,
  files: FileInput[],
  provider: AIProvider,
  agentId: number,
  onProgress?: ProgressCallback
): Promise<SlideFragment> {
  const baseProgress = 25 + (agentId * 12); // Spread agents across 25-73%

  onProgress?.('builder', baseProgress, `🔨 Agent ${agentId}: Initializing slide ${slide.id}...`);

  const providerImpl = getFastProvider(provider);

  onProgress?.('builder', baseProgress + 2, `🔨 Agent ${agentId}: Analyzing "${slide.title}" requirements...`);

  // DISABLED: External image generation (FAL API)
  // User requested inline SVG graphics instead of external API calls
  // TODO: If external images needed in future, restore generateChapterImages() call
  //
  // onProgress?.('builder', baseProgress + 3, `🎨 Agent ${agentId}: Generating AI images...`);
  // let slideImages: Record<string, GeneratedImage> | null = null;
  // try {
  //   slideImages = await generateChapterImages(
  //     slide.title,
  //     slide.description,
  //     slide.keyTopics,
  //     slide.interactionType
  //   );
  //   console.log(`✅ [Builder ${agentId}] Generated ${Object.keys(slideImages).length} images for "${slide.title}"`);
  // } catch (error: any) {
  //   console.warn(`⚠️ [Builder ${agentId}] Image generation failed, using placeholders:`, error.message);
  // }

  onProgress?.('builder', baseProgress + 4, `🔨 Agent ${agentId}: Building ${slide.interactionType} interaction with SVG graphics...`);

  // Force SVG graphics generation (no external images)
  const slideImages = null;

  // Comprehensive SVG graphics generation instructions
  const imageUrlsText = `
SVG GRAPHICS STRATEGY:
Use inline SVG graphics strategically to enhance understanding and aesthetics. NO external images, NO emojis, NO placeholders.

WHEN TO USE SVGs:
1. Medical diagrams that aid understanding (anatomy, pathways, processes)
2. Charts and data visualizations (flowcharts, decision trees, timelines)
3. Icons and visual indicators (quiz symbols, status indicators, interaction cues)
4. Decorative elements that enhance aesthetics (headers, dividers, backgrounds)

WHEN NOT TO USE SVGs:
- Don't force SVGs where they don't add value
- Text-heavy content doesn't need graphics
- Simple concepts may not need visual aids

MEDICAL SVG ILLUSTRATION GUIDELINES:
1. Use anatomically accurate representations where applicable
2. Professional medical textbook illustration style
3. Clean lines, proper proportions, educational clarity
4. Include labels and annotations for medical diagrams
5. Keep it simple and focused on educational value

SVG TECHNICAL REQUIREMENTS:
- Use inline <svg> elements with proper viewBox (e.g., viewBox="0 0 800 600")
- SIZING GUIDELINES:
  * Small icons/decorative graphics: Use fixed pixel sizes (width="80" height="80") or Tailwind classes (class="w-16 h-16" or "w-20 h-20")
  * Medium graphics/charts: Add max-width constraint (style="max-width: 400px; width: 100%; height: auto")
  * Large diagrams/full-width images: Add max-width cap (style="max-width: 800px; width: 100%; height: auto")
  * NEVER use width="100%" or class="w-full" alone without a max-width - graphics will blow up too large!
- Accessibility: Include descriptive <title> and <desc> tags inside SVG
- Use <g> groups for logical sections
- Semantic naming for IDs and classes

MEDICAL COLOR PALETTE (Professional Clinical Style):
- Arteries/Oxygenated: #ef4444 (red-500) or #dc2626 (red-600)
- Veins/Deoxygenated: #3b82f6 (blue-500) or #2563eb (blue-600)
- Organs: #f59e0b (amber-500), #f97316 (orange-500)
- Bones: #f5f5f4 (stone-100) with #78716c (stone-500) outlines
- Muscles: #dc2626 (red-600) at 80% opacity
- Nerves: #eab308 (yellow-500)
- Normal/Healthy: #10b981 (emerald-500)
- Warning/Abnormal: #f59e0b (amber-500)
- Critical/Danger: #ef4444 (red-500)
- Background: #1e293b (slate-800) or transparent
- Borders/Outlines: #475569 (slate-600)

SVG ELEMENT EXAMPLES:
- Paths: <path d="M10,10 L100,100" stroke="#ef4444" stroke-width="3" fill="none"/>
- Circles: <circle cx="50" cy="50" r="30" fill="#3b82f6" opacity="0.8"/>
- Rectangles: <rect x="10" y="10" width="100" height="50" fill="#10b981" rx="5"/>
- Text Labels: <text x="50" y="50" fill="#f8fafc" font-size="16" font-weight="600">Label</text>
- Gradients: Use <defs><linearGradient>...</linearGradient></defs> for depth

USE SVGs FOR THESE INTERACTION TYPES:

${slide.interactionType === 'quiz' ? `
QUIZ ICONS:
- Question mark icon in circle:
  <svg viewBox="0 0 100 100" class="w-16 h-16 mx-auto mb-4">
    <circle cx="50" cy="50" r="45" fill="#3b82f6" opacity="0.2" stroke="#3b82f6" stroke-width="2"/>
    <text x="50" y="65" text-anchor="middle" font-size="48" font-weight="bold" fill="#3b82f6">?</text>
  </svg>
- Checkmark/X icons for correct/incorrect feedback
` : ''}

${slide.interactionType === 'diagram' ? `
ANATOMICAL DIAGRAM GUIDELINES:
- Create cross-sectional views or system diagrams
- Use clear anatomical terminology in labels
- Include directional indicators (anterior/posterior, superior/inferior)
- Use arrows to show flow (blood flow, neural pathways, etc.)
- Layer transparency for depth: foreground 100%, background 40-60%
- Example heart chamber:
  <svg viewBox="0 0 400 400" class="w-full max-w-md mx-auto">
    <defs>
      <linearGradient id="heartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#ef4444;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#dc2626;stop-opacity:1" />
      </linearGradient>
    </defs>
    <ellipse cx="200" cy="200" rx="120" ry="140" fill="url(#heartGrad)" opacity="0.9"/>
    <path d="M200,100 Q150,150 200,250 Q250,150 200,100" fill="#dc2626"/>
    <text x="200" y="320" text-anchor="middle" fill="#f8fafc" font-size="14">Left Ventricle</text>
  </svg>
` : ''}

${slide.interactionType === 'case-study' ? `
CASE STUDY ICONS:
- Patient profile icon
- Medical chart/clipboard icon
- Stethoscope icon
- Lab results icon (test tubes, beakers)
- All using medical color palette
` : ''}

${slide.interactionType === 'decision-tree' ? `
DECISION TREE FLOWCHART:
- Use rounded rectangles for decision nodes: <rect rx="10" ry="10"/>
- Diamond shapes for yes/no branching: <path d="M50,0 L100,50 L50,100 L0,50 Z"/>
- Arrows connecting nodes: <line> or <path> with <marker> for arrowheads
- Color code by urgency: green (stable), yellow (monitor), red (immediate)
` : ''}

HERO/HEADER SVG EXAMPLE (for top of slide):
<svg viewBox="0 0 800 200" style="max-width: 800px; width: 100%; height: auto;" class="rounded-lg mb-6">
  <rect width="800" height="200" fill="url(#heroGrad)"/>
  <defs>
    <linearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e293b;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0f172a;stop-opacity:1" />
    </linearGradient>
  </defs>
  <!-- Add relevant medical imagery here based on slide topic -->
</svg>

CRITICAL REQUIREMENTS:
1. Generate AT LEAST 2 custom SVG graphics per slide (hero/header + detail/icon)
2. SVGs must be inline in the HTML, not external files
3. Use medical education best practices for clarity
4. SVG TEXT SIZING RULES (strictly enforce):
   - Icon/decorative text: font-size="16" to "24"
   - Diagram labels: font-size="12" to "18"
   - Heading text in SVGs: font-size="24" to "48"
   - NEVER exceed font-size="60" - text will overflow and look bad
5. Test that SVGs render properly in modern browsers
6. Use semantic grouping and IDs for interactive elements if needed

STYLE OVERRIDE CLASSES (use when defaults conflict with your design intent):
- .ai-light-theme: Force light background/dark text instead of default dark theme
- .ai-dark-theme: Force dark background/light text
- .ai-custom-bg: Remove background constraints to use your own
- .ai-custom-padding: Remove padding constraints to use your own
- .ai-custom-text: Remove text color constraints
- .ai-custom-heading: Remove heading size/weight constraints
- .ai-full-width: Make element truly full-width without max-width cap
- .ai-no-max-width: Remove max-width constraint entirely

DO NOT:
- Use emojis (🫀, 🧠, etc.) - create proper SVG icons instead
- Use placeholder images or broken image links
- Use external image URLs
- Use base64 encoded images
- Leave graphics as "TODO" or placeholder text
`;


  const builderPrompt = `You are Builder Agent ${agentId}. Create an interactive HTML slide.

COURSE CONTEXT:
- Course: ${courseContext.title}
- Learner Level: ${courseContext.learnerLevel}
- Your Slide: #${slide.id} - ${slide.title}

SLIDE REQUIREMENTS:
- Description: ${slide.description}
- Key Topics: ${slide.keyTopics.join(', ')}
- Interaction Type: ${slide.interactionType}

${imageUrlsText}

BUILD THIS SLIDE AS A COMPLETE <section> ELEMENT:

<section id="slide-${slide.id}" class="slide-section min-h-screen p-8 bg-gradient-to-br from-slate-900 to-slate-800">
  <div class="max-w-4xl mx-auto">
    <h2 class="text-5xl font-bold text-white mb-6">${slide.title}</h2>

    <!-- Slide content with interactive elements -->

    ${slide.interactionType === 'quiz' ? `
    <!-- Interactive quiz with reveal buttons -->
    <div class="quiz-container space-y-6">
      <!-- Multiple choice questions with immediate feedback -->
    </div>
    ` : ''}

    ${slide.interactionType === 'case-study' ? `
    <!-- Interactive case study (text-adventure style) -->
    <div class="case-study-container">
      <!-- Patient presentation → Differential → Labs → Treatment -->
    </div>
    ` : ''}

    ${slide.interactionType === 'diagram' ? `
    <!-- Interactive SVG diagram with click-to-reveal labels -->
    <div class="diagram-container">
      <!-- Inline SVG with interactive elements -->
    </div>
    ` : ''}

    ${slide.interactionType === 'decision-tree' ? `
    <!-- Interactive decision tree / algorithm -->
    <div class="decision-tree-container">
      <!-- Flowchart-style navigation -->
    </div>
    ` : ''}
  </div>
</section>

CRITICAL RULES:
1. Return ONLY the <section> HTML, no DOCTYPE, no explanations
2. Use Tailwind CSS classes (will be provided by the shell)
3. CREATE INLINE SVG GRAPHICS - Do NOT use emojis, external images, or placeholder images
4. Generate AT LEAST 2 custom SVG graphics per slide following the guidelines above
5. Include all JavaScript inline within <script> tags in the section
6. Make it fully interactive and educational
7. Use medical color system: red-500/20 (critical), yellow-500/20 (warning), green-500/20 (normal), blue-500/20 (info)
8. All SVG graphics must be responsive with proper viewBox and accessibility attributes

Return ONLY the <section> element:`;

  try {
    // Simplified to only use MiniMax
    const fastModel = 'MiniMax-M2.1';

    onProgress?.('builder', baseProgress + 6, `🔨 Agent ${agentId}: Connecting to ${provider}...`);

    const response = await providerImpl.generate(
      builderPrompt,
      files,
      { modelId: fastModel },
      onProgress
    );

    // DEBUG: Log raw builder response
    console.log(`🔍 [DEBUG] RAW BUILDER ${agentId} RESPONSE (first 500 chars):`, response.substring(0, 500));
    console.log(`🔍 [DEBUG] Builder ${agentId} response length:`, response.length, 'chars');
    console.log(`🔍 [DEBUG] Builder ${agentId} starts with:`, response.trim().substring(0, 50));

    onProgress?.('builder', baseProgress + 8, `🔨 Agent ${agentId}: Parsing HTML structure...`);

    // Strip markdown code blocks if present (```html ... ``` or ``` ... ```)
    let cleanedResponse = response.trim();
    if (cleanedResponse.startsWith('```')) {
      // Remove opening markdown fence (```html or ``` or ```xml)
      cleanedResponse = cleanedResponse.replace(/^```(?:html|xml|xhtml)?\n?/, '');
      // Remove closing markdown fence
      cleanedResponse = cleanedResponse.replace(/\n?```\s*$/, '');
      console.log(`🔍 [DEBUG] Stripped markdown code blocks from Builder ${agentId} response`);
      console.log(`🔍 [DEBUG] Cleaned response now starts with:`, cleanedResponse.substring(0, 50));
    }

    // Extract section HTML with better validation
    const sectionMatch = cleanedResponse.match(/<section[\s\S]*?<\/section>/i);

    if (!sectionMatch) {
      console.error(`❌ [Builder ${agentId}] No valid <section> found in response`);
      console.error(`Response preview: ${cleanedResponse.substring(0, 500)}...`);

      // Check if response looks like JSON
      if (cleanedResponse.trim().startsWith('{') || cleanedResponse.trim().startsWith('[')) {
        throw new Error(`Builder Agent ${agentId} returned JSON instead of HTML. The AI may have misunderstood the prompt.`);
      }

      // Check if response is too short to be valid HTML
      if (cleanedResponse.length < 100) {
        throw new Error(`Builder Agent ${agentId} returned incomplete HTML (${cleanedResponse.length} chars). Please try again.`);
      }

      // Use the cleaned response as fallback, but wrap it in a section
      console.warn(`⚠️ [Builder ${agentId}] Wrapping response in <section> tag`);
      const wrappedHtml = `<section id="slide-${slide.id}" class="slide-section min-h-screen p-8 bg-gradient-to-br from-slate-900 to-slate-800">
        <div class="max-w-4xl mx-auto">
          <h2 class="text-5xl font-bold text-white mb-6">${slide.title}</h2>
          ${cleanedResponse}
        </div>
      </section>`;

      return {
        slideId: slide.id,
        title: slide.title,
        html: wrappedHtml
      };
    }

    const sectionHtml = sectionMatch[0];

    onProgress?.('builder', baseProgress + 10, `🔨 Agent ${agentId}: Validating interactive elements...`);
    onProgress?.('builder', baseProgress + 11, `✅ Agent ${agentId}: Slide ${slide.id} complete!`);

    console.log(`✅ [Builder ${agentId}] Slide ${slide.id} "${slide.title}" complete (${sectionHtml.length} chars)`);

    return {
      slideId: slide.id,
      title: slide.title,
      html: sectionHtml
    };

  } catch (error: any) {
    console.error(`❌ [Builder Agent ${agentId}] Error:`, error);
    throw new Error(`Builder Agent ${agentId} failed: ${error.message}`);
  }
}

/**
 * STEP 3: Assembler - Stitch fragments into flat HTML structure
 */
function assembler(
  outline: CurriculumOutline,
  fragments: SlideFragment[],
  onProgress?: ProgressCallback
): string {
  onProgress?.('assembler', 80, '🔧 Assembling flat presentation structure...');

  // Sort fragments by slide ID
  const sortedFragments = [...fragments].sort((a, b) => a.slideId - b.slideId);

  // Build navigation menu
  const navItems = sortedFragments.map(f =>
    `<button onclick="goToSlide(${f.slideId - 1})" class="nav-item px-4 py-2 rounded-lg hover:bg-white/10 transition-colors">
      ${f.slideId}. ${f.title}
    </button>`
  ).join('\n            ');

  // Direct slide sections without iframes - clean and flat
  const slidesHtml = sortedFragments.map((f, index) => {
    return `<div class="slide" data-slide-index="${index}" style="display: ${index === 0 ? 'block' : 'none'}; width: 100%; min-height: 100vh; overflow: auto;">
      ${f.html}
    </div>`;
  }).join('\n\n        ');

  const finalHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${outline.title}</title>
    ${getPresentationStyleTag()}
    <style>
        body {
            margin: 0;
            padding: 0;
            overflow: hidden;
        }
        .slide {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100vh;
        }

        /* Responsive image scaling */
        .slide img,
        .slide-section img,
        section img {
            max-width: 100%;
            height: auto;
            object-fit: contain;
            display: block;
        }

        /* Responsive SVG scaling */
        .slide svg,
        .slide-section svg,
        section svg {
            max-width: 100%;
            height: auto;
        }

        /* Responsive text scaling */
        .slide,
        .slide-section,
        section {
            font-size: clamp(14px, 1.2vw, 16px);
            line-height: 1.6;
        }

        .slide h1,
        .slide-section h1 {
            font-size: clamp(2rem, 4vw, 3.5rem);
        }

        .slide h2,
        .slide-section h2 {
            font-size: clamp(1.5rem, 3vw, 2.5rem);
        }

        .slide h3,
        .slide-section h3 {
            font-size: clamp(1.25rem, 2.5vw, 1.875rem);
        }

        /* Responsive container padding */
        .slide .max-w-4xl,
        .slide-section .max-w-4xl {
            padding: clamp(1rem, 2.5vw, 1.75rem);
        }

        .nav-item {
            text-align: left;
            width: 100%;
        }
        .nav-item:hover {
            background: rgba(255, 255, 255, 0.1);
        }
        .slide-indicator {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 8px;
            z-index: 100;
        }
        .slide-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            cursor: pointer;
            transition: all 0.3s;
        }
        .slide-dot.active {
            background: white;
            width: 30px;
            border-radius: 5px;
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
            .slide {
                padding: 0.5rem;
            }

            .slide .max-w-4xl,
            .slide-section .max-w-4xl {
                padding: 1rem;
            }

            nav .max-w-7xl {
                padding: 1rem;
            }

            .slide h1,
            .slide-section h1 {
                font-size: clamp(1.5rem, 5vw, 2.25rem);
                margin-bottom: 1rem;
            }

            .slide h2,
            .slide-section h2 {
                font-size: clamp(1.25rem, 4vw, 1.875rem);
                margin-bottom: 0.75rem;
            }

            /* Hide text labels on mobile for navigation buttons */
            button .text-xs {
                display: none;
            }

            /* Adjust slide indicators for mobile */
            .slide-indicator {
                bottom: 10px;
                gap: 6px;
            }

            .slide-dot {
                width: 8px;
                height: 8px;
            }

            .slide-dot.active {
                width: 24px;
            }
        }

        /* Tablet responsiveness */
        @media (min-width: 769px) and (max-width: 1024px) {
            .slide .max-w-4xl,
            .slide-section .max-w-4xl {
                padding: 1.5rem;
            }

            .slide h1,
            .slide-section h1 {
                font-size: clamp(2rem, 4vw, 3rem);
            }
        }

        /* Ensure interactive elements are touch-friendly on mobile */
        @media (max-width: 768px) {
            button,
            .nav-item,
            .slide-dot {
                min-height: 44px;
                min-width: 44px;
            }
        }
    </style>
</head>
<body class="bg-slate-950 text-white">
    <!-- Global Navigation -->
    <nav class="fixed top-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 z-50">
        <div class="max-w-7xl mx-auto px-6 py-4">
            <div class="flex items-center justify-between">
                <h1 class="text-2xl font-bold text-white">${outline.title}</h1>
                <div class="flex items-center gap-4">
                    <span class="text-sm text-slate-400">Slide <span id="current-slide">1</span>/${sortedFragments.length}</span>
                    <button onclick="toggleMenu()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                        Menu
                    </button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Slide-out Menu -->
    <div id="menu" class="fixed top-0 right-0 h-full w-80 bg-slate-900 border-l border-slate-700 transform translate-x-full transition-transform duration-300 z-50">
        <div class="p-6">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-bold">Slides</h2>
                <button onclick="toggleMenu()" class="text-slate-400 hover:text-white">✕</button>
            </div>
            <div class="space-y-2">
${navItems}
            </div>
        </div>
    </div>

    <!-- Navigation Controls -->
    <button onclick="prevSlide()" class="fixed left-4 top-1/2 -translate-y-1/2 bg-slate-900/80 hover:bg-slate-800 text-white p-4 rounded-full z-40 transition-all">
        ‹
    </button>
    <button onclick="nextSlide()" class="fixed right-4 top-1/2 -translate-y-1/2 bg-slate-900/80 hover:bg-slate-800 text-white p-4 rounded-full z-40 transition-all">
        ›
    </button>

    <!-- Slide Indicators -->
    <div class="slide-indicator">
        ${sortedFragments.map((_, i) => `<div class="slide-dot ${i === 0 ? 'active' : ''}" onclick="goToSlide(${i})"></div>`).join('')}
    </div>

    <!-- Isolated Slide Containers -->
    <main id="slide-container">
        ${slidesHtml}
    </main>

    <script>
        let currentSlideIndex = 0;
        const totalSlides = ${sortedFragments.length};

        function toggleMenu() {
            const menu = document.getElementById('menu');
            menu.classList.toggle('translate-x-full');
        }

        function goToSlide(index) {
            if (index < 0 || index >= totalSlides) return;

            // Hide current slide
            const slides = document.querySelectorAll('.slide');
            slides[currentSlideIndex].style.display = 'none';

            // Show new slide
            slides[index].style.display = 'block';
            currentSlideIndex = index;

            // Update indicators
            updateIndicators();

            // Close menu if open
            const menu = document.getElementById('menu');
            if (!menu.classList.contains('translate-x-full')) {
                toggleMenu();
            }
        }

        function nextSlide() {
            goToSlide(currentSlideIndex + 1);
        }

        function prevSlide() {
            goToSlide(currentSlideIndex - 1);
        }

        function updateIndicators() {
            // Update slide counter
            document.getElementById('current-slide').textContent = currentSlideIndex + 1;

            // Update dots
            const dots = document.querySelectorAll('.slide-dot');
            dots.forEach((dot, index) => {
                if (index === currentSlideIndex) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
                nextSlide();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                prevSlide();
            } else if (e.key === 'Escape') {
                const menu = document.getElementById('menu');
                if (!menu.classList.contains('translate-x-full')) {
                    toggleMenu();
                }
            } else if (e.key === 'Home') {
                e.preventDefault();
                goToSlide(0);
            } else if (e.key === 'End') {
                e.preventDefault();
                goToSlide(totalSlides - 1);
            }
        });
    </script>
</body>
</html>`;

  onProgress?.('assembler', 95, '✅ Presentation assembled');

  // Validate final HTML
  if (!finalHtml || finalHtml.length < 1000) {
    console.error('❌ [Assembler] Generated HTML is too short or empty');
    throw new Error('Failed to generate valid presentation HTML. Please try again.');
  }

  if (!finalHtml.includes('<!DOCTYPE html>')) {
    console.error('❌ [Assembler] Generated HTML missing DOCTYPE');
    throw new Error('Generated HTML is incomplete. Please try again.');
  }

  if (!finalHtml.includes('</html>')) {
    console.error('❌ [Assembler] Generated HTML missing closing tag');
    throw new Error('Generated HTML is incomplete. Please try again.');
  }

  console.log(`✅ [Assembler] Final HTML generated (${finalHtml.length} chars, ${sortedFragments.length} slides)`);

  // DEBUG: Log final HTML structure
  console.log('🔍 [DEBUG] FINAL HTML (first 1000 chars):', finalHtml.substring(0, 1000));
  console.log('🔍 [DEBUG] FINAL HTML (last 500 chars):', finalHtml.substring(finalHtml.length - 500));
  console.log('🔍 [DEBUG] DOCTYPE check:', finalHtml.includes('<!DOCTYPE html>') ? '✅' : '❌');
  console.log('🔍 [DEBUG] Closing HTML tag check:', finalHtml.includes('</html>') ? '✅' : '❌');

  return finalHtml;
}

/**
 * MAIN FUNCTION: Generate course using parallel agents pipeline
 */
export async function generateParallelCourse(
  prompt: string,
  files: FileInput[] = [],
  provider: AIProvider = 'minimax',
  onProgress?: ProgressCallback
): Promise<string> {
  console.log('🚀 [Parallel Pipeline] Starting with MiniMax provider:', provider);
  console.log('📝 Prompt length:', prompt.length, 'chars');
  console.log('📁 Files:', files.length);

  try {
    // STEP 1: Architect Agent - Create curriculum outline
    onProgress?.('starting', 0, '🏗️ Initializing Parallel Pipeline...');
    console.log('🏗️ [Step 1/3] Starting Architect Agent...');

    const outline = await architectAgent(prompt, files, provider, onProgress);
    console.log(`✅ [Step 1/3] Architect complete - ${outline.slides.length} slides planned`);

    // STEP 2: Launch Parallel Builder Agents
    onProgress?.('parallel', 25, `🚀 Launching ${outline.slides.length} parallel builder agents...`);
    console.log(`🔨 [Step 2/3] Launching ${outline.slides.length} Builder Agents in parallel...`);

    const builderPromises = outline.slides.map((slide, index) =>
      slideBuilderAgent(slide, outline, files, provider, index + 1, onProgress)
    );

    // Wait for all builders to complete
    const fragments = await Promise.all(builderPromises);
    console.log(`✅ [Step 2/3] All ${fragments.length} Builder Agents complete`);

    // Validate fragments
    const invalidFragments = fragments.filter(f => !f.html || f.html.length < 50);
    if (invalidFragments.length > 0) {
      console.error(`❌ ${invalidFragments.length} invalid fragments detected`);
      throw new Error(`${invalidFragments.length} slides failed to generate properly. Please try again.`);
    }

    // STEP 3: Assembler - Stitch together
    console.log('🔧 [Step 3/3] Assembling final HTML...');
    const finalHtml = assembler(outline, fragments, onProgress);
    console.log(`✅ [Step 3/3] Assembly complete - ${finalHtml.length} chars`);

    onProgress?.('complete', 100, '✅ Parallel generation complete!');
    console.log('🎉 [Parallel Pipeline] Generation successful!');

    return finalHtml;

  } catch (error: any) {
    console.error('❌ [Parallel Pipeline] Error:', error);
    console.error('Stack:', error.stack);

    // Provide user-friendly error message
    const userMessage = error.message || 'An unknown error occurred during generation';
    onProgress?.('error', 0, `Error: ${userMessage}`);

    throw error;
  }
}

/**
 * Check if prompt should trigger parallel pipeline
 */
export function shouldUseParallelGeneration(prompt: string): boolean {
  const triggers = [
    'lecture',
    'course',
    'curriculum',
    'parallel',
    'fast',
    'multi-chapter',
    'comprehensive'
  ];

  const lowerPrompt = prompt.toLowerCase();
  return triggers.some(trigger => lowerPrompt.includes(trigger));
}
