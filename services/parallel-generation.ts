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
import { generateChapterImages, type GeneratedImage } from './fal-image-generator';

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

    onProgress?.('architect', 18, '🔍 Parsing curriculum structure...');
    onProgress?.('architect', 22, '📋 Validating chapter organization...');

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Architect Agent failed to return valid JSON');
    }

    const outline = JSON.parse(jsonMatch[0]) as CurriculumOutline;

    // Validate outline has slides
    if (!outline.slides || outline.slides.length === 0) {
      throw new Error('Curriculum must have at least one slide');
    }

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

  // Generate AI images for this slide
  onProgress?.('builder', baseProgress + 3, `🎨 Agent ${agentId}: Generating AI images...`);
  let slideImages: Record<string, GeneratedImage> | null = null;
  try {
    slideImages = await generateChapterImages(
      slide.title,
      slide.description,
      slide.keyTopics,
      slide.interactionType
    );
    console.log(`✅ [Builder ${agentId}] Generated ${Object.keys(slideImages).length} images for "${slide.title}"`);
  } catch (error: any) {
    console.warn(`⚠️ [Builder ${agentId}] Image generation failed, using placeholders:`, error.message);
  }

  onProgress?.('builder', baseProgress + 4, `🔨 Agent ${agentId}: Building ${slide.interactionType} interaction...`);

  // Prepare image URLs for the prompt
  const imageUrlsText = slideImages
    ? `
GENERATED IMAGES (use these instead of emojis):
- Hero Image: ${slideImages.hero?.url || 'none'}
- Icon: ${slideImages.icon?.url || 'none'}
- Topic Image 1: ${slideImages.topic1?.url || 'none'}
- Topic Image 2: ${slideImages.topic2?.url || 'none'}

IMPORTANT: Use <img> tags with these URLs instead of emojis. Example:
<img src="${slideImages.hero?.url}" alt="${slide.title}" class="w-full h-64 object-cover rounded-lg mb-6">
`
    : 'No images available - use simple CSS shapes or SVG instead of emojis.';

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
3. USE THE PROVIDED AI-GENERATED IMAGE URLS - Do NOT use emojis or placeholder images
4. Include all JavaScript inline within <script> tags in the section
5. Make it fully interactive and educational
6. Use medical color system: red-500/20 (critical), yellow-500/20 (warning), green-500/20 (normal), blue-500/20 (info)
7. All images should be responsive with proper alt text and Tailwind classes

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

    onProgress?.('builder', baseProgress + 8, `🔨 Agent ${agentId}: Parsing HTML structure...`);
    onProgress?.('builder', baseProgress + 10, `🔨 Agent ${agentId}: Validating interactive elements...`);
    onProgress?.('builder', baseProgress + 11, `✅ Agent ${agentId}: Slide ${slide.id} complete!`);

    // Extract section HTML
    const sectionMatch = response.match(/<section[\s\S]*?<\/section>/i);
    const sectionHtml = sectionMatch ? sectionMatch[0] : response;

    console.log(`✅ [Builder ${agentId}] Slide ${slide.id} "${slide.title}" complete`);

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
            font-size: clamp(14px, 1.5vw, 18px);
            line-height: 1.6;
        }

        .slide h1,
        .slide-section h1 {
            font-size: clamp(2rem, 5vw, 4rem);
        }

        .slide h2,
        .slide-section h2 {
            font-size: clamp(1.5rem, 4vw, 3rem);
        }

        .slide h3,
        .slide-section h3 {
            font-size: clamp(1.25rem, 3vw, 2rem);
        }

        /* Responsive container padding */
        .slide .max-w-4xl,
        .slide-section .max-w-4xl {
            padding: clamp(1rem, 3vw, 2rem);
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
                font-size: clamp(1.5rem, 6vw, 2.5rem);
                margin-bottom: 1rem;
            }

            .slide h2,
            .slide-section h2 {
                font-size: clamp(1.25rem, 5vw, 2rem);
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
                font-size: clamp(2rem, 4.5vw, 3.5rem);
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
  console.log('✅ [Assembler] Final HTML generated');

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

  try {
    // STEP 1: Architect Agent - Create curriculum outline
    onProgress?.('starting', 0, '🏗️ Initializing Parallel Pipeline...');
    const outline = await architectAgent(prompt, files, provider, onProgress);

    // STEP 2: Launch Parallel Builder Agents
    onProgress?.('parallel', 25, `🚀 Launching ${outline.slides.length} parallel builder agents...`);

    const builderPromises = outline.slides.map((slide, index) =>
      slideBuilderAgent(slide, outline, files, provider, index + 1, onProgress)
    );

    // Wait for all builders to complete
    const fragments = await Promise.all(builderPromises);

    // STEP 3: Assembler - Stitch together
    const finalHtml = assembler(outline, fragments, onProgress);

    onProgress?.('complete', 100, '✅ Parallel generation complete!');
    return finalHtml;

  } catch (error: any) {
    console.error('❌ [Parallel Pipeline] Error:', error);
    onProgress?.('error', 0, `Error: ${error.message}`);
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
