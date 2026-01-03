/**
 * Parallel Agents Architecture for Fast Content Generation
 * Supports all AI providers: DeepSeek, MiniMax, GLM, Claude, Gemini
 *
 * Architecture:
 * 1. Architect Agent (fast model) - analyzes files and creates curriculum outline
 * 2. 4 Parallel Builder Agents (fast models) - build individual chapters concurrently
 * 3. Assembler - stitches fragments into final HTML
 */

import { DeepSeekProvider, MiniMaxProvider, GLMProvider, ClaudeProvider, GeminiProvider, BaseProvider } from './providers';
import type { FileInput, ProgressCallback } from './providers';
import type { AIProvider } from './ai-provider';

/**
 * Curriculum outline structure returned by Architect Agent
 */
export interface CurriculumOutline {
  title: string;
  description: string;
  learnerLevel: string;
  chapters: ChapterOutline[];
}

export interface ChapterOutline {
  id: number;
  title: string;
  description: string;
  keyTopics: string[];
  interactionType: 'quiz' | 'case-study' | 'diagram' | 'decision-tree';
}

/**
 * Chapter fragment built by Builder Agent
 */
export interface ChapterFragment {
  chapterId: number;
  title: string;
  html: string;
}

/**
 * Get a fast provider instance for parallel work
 */
function getFastProvider(provider: AIProvider): BaseProvider {
  switch (provider) {
    case 'deepseek':
      return new DeepSeekProvider();
    case 'minimax':
      return new MiniMaxProvider();
    case 'glm':
      return new GLMProvider();
    case 'claude':
      return new ClaudeProvider();
    case 'gemini':
      return new GeminiProvider();
    default:
      return new DeepSeekProvider(); // Default to DeepSeek
  }
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
  "chapters": [
    {
      "id": 1,
      "title": "Chapter Title",
      "description": "What this chapter covers",
      "keyTopics": ["topic1", "topic2", "topic3"],
      "interactionType": "quiz" | "case-study" | "diagram" | "decision-tree"
    }
  ]
}

Create 4 chapters total. Each chapter should be self-contained and cover a distinct aspect of the topic.

Return ONLY the JSON, no other text.`;

  try {
    // Use fast model for each provider
    const fastModel = provider === 'deepseek' ? 'deepseek-chat'
                    : provider === 'minimax' ? 'MiniMax-M2.1'
                    : provider === 'claude' ? 'claude-sonnet-4-5-20250929'
                    : provider === 'gemini' ? 'gemini-3-flash-preview'
                    : 'glm-4-flash';

    onProgress?.('architect', 12, `🤖 Connecting to ${provider.toUpperCase()} (${fastModel})...`);

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

    // Validate outline has 4 chapters
    if (!outline.chapters || outline.chapters.length !== 4) {
      throw new Error('Curriculum must have exactly 4 chapters');
    }

    console.log('✅ [Architect] Curriculum outline:', outline);
    return outline;

  } catch (error: any) {
    console.error('❌ [Architect Agent] Error:', error);
    throw new Error(`Architect Agent failed: ${error.message}`);
  }
}

/**
 * STEP 2: Builder Agent - Build a single chapter
 */
async function builderAgent(
  chapter: ChapterOutline,
  courseContext: CurriculumOutline,
  files: FileInput[],
  provider: AIProvider,
  agentId: number,
  onProgress?: ProgressCallback
): Promise<ChapterFragment> {
  const baseProgress = 25 + (agentId * 12); // Spread agents across 25-73%

  onProgress?.('builder', baseProgress, `🔨 Agent ${agentId}: Initializing chapter ${chapter.id}...`);

  const providerImpl = getFastProvider(provider);

  onProgress?.('builder', baseProgress + 2, `🔨 Agent ${agentId}: Analyzing "${chapter.title}" requirements...`);
  onProgress?.('builder', baseProgress + 4, `🔨 Agent ${agentId}: Building ${chapter.interactionType} interaction...`);

  const builderPrompt = `You are Builder Agent ${agentId}. Create an interactive HTML chapter.

COURSE CONTEXT:
- Course: ${courseContext.title}
- Learner Level: ${courseContext.learnerLevel}
- Your Chapter: #${chapter.id} - ${chapter.title}

CHAPTER REQUIREMENTS:
- Description: ${chapter.description}
- Key Topics: ${chapter.keyTopics.join(', ')}
- Interaction Type: ${chapter.interactionType}

BUILD THIS CHAPTER AS A COMPLETE <section> ELEMENT:

<section id="chapter-${chapter.id}" class="chapter-section min-h-screen p-8 bg-gradient-to-br from-slate-900 to-slate-800">
  <div class="max-w-4xl mx-auto">
    <h2 class="text-5xl font-bold text-white mb-6">${chapter.title}</h2>

    <!-- Chapter content with interactive elements -->

    ${chapter.interactionType === 'quiz' ? `
    <!-- Interactive quiz with reveal buttons -->
    <div class="quiz-container space-y-6">
      <!-- Multiple choice questions with immediate feedback -->
    </div>
    ` : ''}

    ${chapter.interactionType === 'case-study' ? `
    <!-- Interactive case study (text-adventure style) -->
    <div class="case-study-container">
      <!-- Patient presentation → Differential → Labs → Treatment -->
    </div>
    ` : ''}

    ${chapter.interactionType === 'diagram' ? `
    <!-- Interactive SVG diagram with click-to-reveal labels -->
    <div class="diagram-container">
      <!-- Inline SVG with interactive elements -->
    </div>
    ` : ''}

    ${chapter.interactionType === 'decision-tree' ? `
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
3. NO external images - use SVG, emojis, CSS shapes only
4. Include all JavaScript inline within <script> tags in the section
5. Make it fully interactive and educational
6. Use medical color system: red-500/20 (critical), yellow-500/20 (warning), green-500/20 (normal), blue-500/20 (info)

Return ONLY the <section> element:`;

  try {
    const fastModel = provider === 'deepseek' ? 'deepseek-chat'
                    : provider === 'minimax' ? 'MiniMax-M2.1'
                    : 'glm-4-flash';

    onProgress?.('builder', baseProgress + 6, `🔨 Agent ${agentId}: Connecting to ${provider}...`);

    const response = await providerImpl.generate(
      builderPrompt,
      files,
      { modelId: fastModel },
      onProgress
    );

    onProgress?.('builder', baseProgress + 8, `🔨 Agent ${agentId}: Parsing HTML structure...`);
    onProgress?.('builder', baseProgress + 10, `🔨 Agent ${agentId}: Validating interactive elements...`);
    onProgress?.('builder', baseProgress + 11, `✅ Agent ${agentId}: Chapter ${chapter.id} complete!`);

    // Extract section HTML
    const sectionMatch = response.match(/<section[\s\S]*?<\/section>/i);
    const sectionHtml = sectionMatch ? sectionMatch[0] : response;

    console.log(`✅ [Builder ${agentId}] Chapter ${chapter.id} "${chapter.title}" complete`);

    return {
      chapterId: chapter.id,
      title: chapter.title,
      html: sectionHtml
    };

  } catch (error: any) {
    console.error(`❌ [Builder Agent ${agentId}] Error:`, error);
    throw new Error(`Builder Agent ${agentId} failed: ${error.message}`);
  }
}

/**
 * STEP 3: Assembler - Stitch fragments into final HTML
 */
function assembler(
  outline: CurriculumOutline,
  fragments: ChapterFragment[],
  onProgress?: ProgressCallback
): string {
  onProgress?.('assembler', 80, '🔧 Assembling final presentation...');

  // Sort fragments by chapter ID
  const sortedFragments = [...fragments].sort((a, b) => a.chapterId - b.chapterId);

  // Build navigation menu
  const navItems = sortedFragments.map(f =>
    `<button onclick="scrollToChapter(${f.chapterId})" class="nav-item px-4 py-2 rounded-lg hover:bg-white/10 transition-colors">
      ${f.chapterId}. ${f.title}
    </button>`
  ).join('\n            ');

  // Combine all chapter HTML
  const chaptersHtml = sortedFragments.map(f => f.html).join('\n\n        ');

  const finalHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${outline.title}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {
            scroll-behavior: smooth;
        }
        .chapter-section {
            scroll-margin-top: 80px;
        }
        .nav-item {
            text-align: left;
            width: 100%;
        }
        .nav-item:hover {
            background: rgba(255, 255, 255, 0.1);
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
                    <span class="text-sm text-slate-400">${outline.learnerLevel}</span>
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
                <h2 class="text-xl font-bold">Chapters</h2>
                <button onclick="toggleMenu()" class="text-slate-400 hover:text-white">✕</button>
            </div>
            <div class="space-y-2">
${navItems}
            </div>
        </div>
    </div>

    <!-- Course Introduction -->
    <div class="pt-20 pb-12 bg-gradient-to-br from-blue-900 to-slate-900">
        <div class="max-w-4xl mx-auto px-8">
            <h2 class="text-6xl font-bold text-white mb-4">${outline.title}</h2>
            <p class="text-2xl text-blue-200 mb-6">${outline.description}</p>
            <div class="flex items-center gap-4">
                <span class="px-4 py-2 bg-blue-600/30 border border-blue-400 rounded-lg text-blue-200">
                    📚 ${outline.learnerLevel}
                </span>
                <span class="px-4 py-2 bg-green-600/30 border border-green-400 rounded-lg text-green-200">
                    ✓ ${sortedFragments.length} Interactive Chapters
                </span>
            </div>
        </div>
    </div>

    <!-- Chapters (generated by parallel agents) -->
    <main>
        ${chaptersHtml}
    </main>

    <!-- Footer -->
    <footer class="bg-slate-900 border-t border-slate-700 py-8">
        <div class="max-w-4xl mx-auto px-8 text-center text-slate-400">
            <p>Generated with PresentGenius - Parallel AI Architecture</p>
            <p class="text-sm mt-2">Powered by ${outline.chapters.length} concurrent AI agents</p>
        </div>
    </footer>

    <script>
        function toggleMenu() {
            const menu = document.getElementById('menu');
            menu.classList.toggle('translate-x-full');
        }

        function scrollToChapter(chapterId) {
            const chapter = document.getElementById('chapter-' + chapterId);
            if (chapter) {
                chapter.scrollIntoView({ behavior: 'smooth' });
                toggleMenu();
            }
        }

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const menu = document.getElementById('menu');
                if (!menu.classList.contains('translate-x-full')) {
                    toggleMenu();
                }
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
  provider: AIProvider = 'deepseek',
  onProgress?: ProgressCallback
): Promise<string> {
  console.log('🚀 [Parallel Pipeline] Starting with provider:', provider);

  try {
    // STEP 1: Architect Agent - Create curriculum outline
    onProgress?.('starting', 0, '🏗️ Initializing Parallel Pipeline...');
    const outline = await architectAgent(prompt, files, provider, onProgress);

    // STEP 2: Launch 4 Parallel Builder Agents
    onProgress?.('parallel', 25, '🚀 Launching 4 parallel builder agents...');

    const builderPromises = outline.chapters.map((chapter, index) =>
      builderAgent(chapter, outline, files, provider, index + 1, onProgress)
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
