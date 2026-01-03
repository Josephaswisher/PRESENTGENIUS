/**
 * Claude Provider - Anthropic Direct API Access
 * Models: claude-sonnet-4-5-20250929 (1M context)
 * SDK: @anthropic-ai/sdk@0.71.2
 * Features: Streaming, vision, extended thinking
 */

import Anthropic from '@anthropic-ai/sdk';
import { BaseProvider, FileInput, GenerationOptions, ProgressCallback } from './base-provider';
import { injectCheckpointSlides } from '../checkpoint-injector';
import { injectMiniGames, detectMiniGameOpportunities } from '../mini-game-injector';

export class ClaudeProvider extends BaseProvider {
  private client: Anthropic;

  constructor() {
    super({
      endpoint: 'https://api.anthropic.com/v1/messages',
      getApiKey: () => {
        // Support multiple environment variable names
        const key = import.meta.env.VITE_ANTHROPIC_API_KEY ||
                   import.meta.env.ANTHROPIC_API_KEY;
        if (!key) {
          const error: any = new Error(
            'Anthropic API key is not configured. Please add it to your .env.local file and restart the app.'
          );
          error.validation = {
            isValid: false,
            suggestions: [
              'Create or edit .env.local in your project root',
              'Add this line: VITE_ANTHROPIC_API_KEY=your-key-here',
              'Get your API key from https://console.anthropic.com/settings/keys',
              'Restart the development server: npm run dev',
            ],
          };
          throw error;
        }
        return key;
      },
      modelId: 'claude-sonnet-4-5-20250929',
    });

    // Initialize Anthropic client
    this.client = new Anthropic({
      apiKey: this.config.getApiKey(),
      dangerouslyAllowBrowser: true, // Required for Vite browser environment
    });
  }

  /**
   * Generate new presentation using Claude API with streaming
   */
  async generate(
    prompt: string,
    files: FileInput[] = [],
    options: GenerationOptions = {},
    onProgress?: ProgressCallback
  ): Promise<string> {
    try {
      onProgress?.('starting', 0, '🔐 Validating Anthropic API key...');

      const apiKey = this.config.getApiKey();
      const modelId = options.modelId || 'claude-sonnet-4-5-20250929';

      onProgress?.('starting', 3, '✅ API key validated successfully');
      onProgress?.('starting', 5, `🤖 Selected model: ${modelId}`);

      onProgress?.('claude', 8, '🟡 Initializing Claude (Anthropic) connection...');
      onProgress?.('claude', 10, '📋 Building system prompt...');

      // Build system prompt
      const systemPrompt = `You are an expert medical educator creating interactive HTML presentations for Dr. Swisher's medical education platform.

OUTPUT STRUCTURE:
- Create a complete, self-contained HTML document with embedded CSS and JavaScript
- Use Tailwind CSS via CDN for styling
- Structure content as DISCRETE SLIDES using semantic HTML
- Each major topic/concept should be its own slide marked with an H1 or H2 heading
- Use <section> or <article> tags to wrap each slide's content
- The slide editor will parse headings (H1/H2) as slide boundaries

CONTENT GUIDELINES:
- Focus on clarity, medical accuracy, and educational value
- Create as many slides as needed to cover the topic comprehensively (no fixed number)
- Each slide should have a clear focus and not be overcrowded
- Use visual hierarchy: headings, bullet points, diagrams, and interactive elements
- Make content visually engaging and interactive where appropriate
${options.learnerLevel ? `- Target audience: ${options.learnerLevel}` : ''}
${options.activityId ? `- Activity type: ${options.activityId}` : ''}

CREATIVE UI VARIETY - USE DIVERSE LAYOUTS:
Vary your designs across slides to create visual interest. Choose from these patterns:

1. GRID LAYOUTS (Product Cards, Feature Grids):
   - 2-3 column grids with cards for comparing concepts
   - Each card with icon, title, description, hover effects
   - Use: bg-gradient-to-br, shadow-xl, hover:scale-105 transitions

2. TIMELINE DESIGNS (Sequential Processes):
   - Vertical timeline with connecting lines
   - Numbered steps with icons and descriptions
   - Use: before:content arrows, border-l-4 for timeline spine

3. SPLIT SCREEN LAYOUTS (Before/After, Compare/Contrast):
   - Two-column layouts with dividing line
   - Left vs Right comparisons with visual balance
   - Use: grid-cols-2, gap-8, border-r-2

4. HERO SECTIONS (Topic Introductions):
   - Large gradient backgrounds with centered content
   - Oversized headings with subtitle text
   - Use: text-6xl, bg-gradient-to-r from-blue-600 to-purple-600

5. INTERACTIVE CARDS (Expandable Content):
   - Collapsible/expandable sections with JavaScript
   - Tabs for switching between related content
   - Use: hidden class toggling, transition-all duration-300

6. CASE STUDY FORMATS (Medical Scenarios):
   - Patient info in styled box + problem description
   - Interactive reveal of diagnosis/treatment
   - Use: bg-blue-50 border-l-4 border-blue-500 for callouts

7. QUIZ/ASSESSMENT STYLES:
   - Multiple choice with clickable buttons
   - Instant feedback with color changes
   - Use: onclick handlers, bg-green-100 for correct answers

8. DIAGRAM OVERLAYS (Anatomical, Flow Charts):
   - SVG or CSS-based diagrams with labels
   - Hover to reveal additional information
   - Use: relative/absolute positioning for tooltips

INTERACTIVE ELEMENTS TO INCLUDE:
- Click-to-reveal answers (use <details> or JavaScript)
- Hover tooltips for medical terms (title attributes or custom)
- Animated transitions (transition-all, transform, opacity)
- Color-coded sections (different gradients per topic)
- Progress indicators for multi-step processes
- Expandable sections for detailed information
- Image zoom on hover (scale-110 transform)

COLOR & VISUAL VARIETY:
- Rotate gradient schemes: blue→purple, green→teal, orange→pink, red→purple
- Use complementary colors for contrast (blue text on yellow bg)
- Vary card shadows: shadow-sm, shadow-md, shadow-lg, shadow-2xl
- Mix rounded corners: rounded-lg, rounded-xl, rounded-2xl
- Add subtle animations: animate-fade-in, animate-slide-up

MEDICAL EDUCATION PATTERNS:
- Symptom checkers with checkboxes
- Diagnosis decision trees (if/then flowcharts)
- Treatment comparison tables (grid with borders)
- Drug information cards (dosage, side effects, contraindications)
- Anatomy diagrams with labeled parts
- Clinical case presentations (patient history → findings → diagnosis)
- Evidence-based citations (small text references)
- Interactive drug dosing calculators with real-time sliders (weight-based, renal adjustments, safety warnings)

EXAMPLE CREATIVE SLIDE STRUCTURES:

<!-- Hero Slide with Gradient -->
<section class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500">
  <div class="text-center text-white">
    <h1 class="text-7xl font-bold mb-4 animate-fade-in">Cardiovascular Physiology</h1>
    <p class="text-2xl opacity-90">Understanding the Heart's Electrical System</p>
  </div>
</section>

<!-- Grid Cards Layout -->
<section class="p-12 bg-gray-50">
  <h2 class="text-4xl font-bold mb-8 text-center">Key Cardiac Phases</h2>
  <div class="grid grid-cols-3 gap-6">
    <div class="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all">
      <div class="text-5xl mb-4">💓</div>
      <h3 class="text-xl font-semibold mb-2">Systole</h3>
      <p class="text-gray-600">Contraction phase pumping blood...</p>
    </div>
    <!-- More cards... -->
  </div>
</section>

<!-- Interactive Case Study -->
<section class="p-12">
  <h2 class="text-3xl font-bold mb-6">Clinical Case: Acute MI</h2>
  <div class="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6 rounded-r-lg">
    <p><strong>Patient:</strong> 58M presenting with crushing chest pain...</p>
  </div>
  <details class="bg-white p-6 rounded-lg shadow-md">
    <summary class="font-semibold cursor-pointer hover:text-blue-600">Click to reveal ECG findings →</summary>
    <div class="mt-4 p-4 bg-yellow-50 rounded">
      <p>ST-segment elevation in leads II, III, aVF...</p>
    </div>
  </details>
</section>

<!-- Timeline Layout -->
<section class="p-12 bg-gradient-to-r from-green-50 to-teal-50">
  <h2 class="text-3xl font-bold mb-8">Pathophysiology Timeline</h2>
  <div class="relative border-l-4 border-green-500 pl-8 space-y-8">
    <div class="relative">
      <div class="absolute -left-10 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">1</div>
      <h3 class="text-xl font-semibold">Plaque Rupture</h3>
      <p class="text-gray-600">Atherosclerotic plaque becomes unstable...</p>
    </div>
    <!-- More timeline items... -->
  </div>
</section>

JAW-DROPPING ENHANCEMENTS - 25 ADVANCED PATTERNS:

=== ANIMATIONS & MICRO-INTERACTIONS ===

9. PARALLAX SCROLLING
   - Use bg-fixed for background images that move slower than content
   - Creates immersive depth and engagement on scroll
   - Perfect for hero sections and topic introductions
   - Example: <div class="bg-fixed bg-cover" style="background-image: url(...)">

10. SCROLL-TRIGGERED ANIMATIONS
    - Fade/slide elements in as user scrolls down the page
    - Use IntersectionObserver API for performance
    - Add classes: opacity-0 translate-y-8 → opacity-100 translate-y-0
    - Progressive reveal maintains attention and creates flow

11. PARTICLE/BUBBLE ANIMATIONS
    - Floating medical symbols (⚕️ 🧬 💊 💉) in background
    - Use @keyframes float with transform translate + rotate
    - Stagger animation-delay (0s, 1s, 2s) for natural feel
    - Low opacity (0.1-0.3) for subtle ambient movement

12. MORPHING SVG BLOBS
    - Organic background shapes that smoothly flow and morph
    - SVG <animate attributeName="d"> for shape transitions
    - Use low opacity for subtle ambient effect
    - Creates modern, dynamic backgrounds

13. SCROLL PROGRESS BARS
    - Fixed top indicator showing reading progress (0-100%)
    - Width calculated from: scrollY / (documentHeight - windowHeight)
    - Use gradient colors (blue→purple) for visual appeal
    - Provides visual completion feedback

=== 3D & DEPTH EFFECTS ===

14. CSS 3D CARD FLIPS
    - Front/back cards with rotateY(180deg) on click
    - Use transform-style: preserve-3d and backface-visibility: hidden
    - Click handler toggles .rotate-y-180 class
    - Perfect for quiz questions (front) with answers (back)

15. ISOMETRIC ILLUSTRATIONS
    - 3D appearance using skew transforms (no WebGL needed)
    - Combine skew-y-12 with scale-75 for isometric effect
    - Great for organ diagrams, body systems, architectural views
    - Creates depth without complex 3D rendering

16. NEUMORPHISM (SOFT UI)
    - Embossed/pressed appearance with dual box-shadows
    - Light shadow: box-shadow: -12px -12px 24px #ffffff
    - Dark shadow: box-shadow: 12px 12px 24px #bebebe
    - Use on gray backgrounds (bg-gray-200) for best effect

17. PERSPECTIVE HOVER TILTS
    - Cards tilt toward mouse position for 3D effect
    - Calculate rotateX/Y from cursor coordinates
    - Use perspective(1000px) for 3D space
    - Creates engaging interaction on hover

18. GLASSMORPHISM
    - Frosted glass effect with backdrop-blur-lg
    - Semi-transparent backgrounds (bg-white/10 or bg-white/20)
    - Light border (border-white/30) for definition
    - Premium, Apple-style modern aesthetic

=== DATA VISUALIZATION ===

19. ANIMATED PROGRESS RINGS
    - SVG circles with stroke-dashoffset animation
    - Percentage displayed in center (text-5xl font-bold)
    - Use for survival rates, efficacy statistics, completion metrics
    - Animate from 0 to target value on load

20. INTERACTIVE BAR CHARTS
    - CSS-based horizontal bars with width transitions
    - Animated width on scroll-in using IntersectionObserver
    - Gradient fills (from-green-400 to-green-600)
    - Show percentage text inside bars, hover for details

21. BEFORE/AFTER COMPARISON SLIDERS
    - Two overlaid images with draggable divider
    - Range input controls reveal width of "after" image
    - Perfect for treatment outcomes, disease progression
    - Interactive exploration of visual comparisons

22. RADIAL/CIRCULAR MENUS
    - Items positioned on circle perimeter using transforms
    - Use: rotate(angle) translate(radius) rotate(-angle)
    - Interactive selection wheels for options/pathways
    - Creates unique visual hierarchy in circular form

23. HEAT MAPS
    - Color-coded grids showing severity/intensity
    - Hover tooltips reveal detailed information
    - Great for: body region pain mapping, symptom distribution
    - Use color gradient: green (mild) → yellow → red (severe)

=== GAMIFICATION ===

24. ACHIEVEMENT BADGES
    - Trophy/medal icons (🏆 🥇 ⭐) with unlock animations
    - Scale from 0 to 100, add animate-pulse + animate-ping
    - Celebrate section completion, milestones reached
    - Creates motivational feedback loop

25. STAR RATINGS
    - Click to rate understanding/confidence (1-5 stars)
    - Animated bounce on selection (animate-bounce)
    - Visual feedback system for self-assessment
    - Yellow filled stars vs gray outlined

26. COUNTDOWN TIMERS
    - JavaScript setInterval for timed learning challenges
    - Large display (text-6xl font-bold) showing seconds
    - Creates urgency and engagement for quizzes
    - Updates every second, triggers completion when time=0

27. DRAG-DROP MATCHING
    - Match terms to definitions using HTML5 drag/drop API
    - draggable="true" + ondragstart/ondrop handlers
    - Visual feedback: bg-green-100 when correctly matched
    - Active learning technique for knowledge reinforcement

28. FILL-IN-BLANK EXERCISES
    - Inline text inputs with data-answer attribute
    - onblur validation with instant color feedback
    - Green border for correct, red for incorrect
    - Immediate knowledge check without page reload

=== PREMIUM LAYOUTS ===

29. BENTO GRID LAYOUTS
    - Asymmetric grid with varying col-span/row-span
    - Mix of card sizes: 1x1, 2x2, 1x2, 2x1
    - Apple-style modern composition with rounded corners
    - Creates visual interest through size variation

30. MAGAZINE MULTI-COLUMN
    - Text flows naturally across 2-3 columns
    - Use CSS columns-3 gap-8
    - Images can break columns (column-span: all)
    - Professional editorial reading experience

31. OVERLAPPING SECTIONS
    - Position absolute elements with strategic z-index
    - Create depth through intentional overlaps
    - Dynamic, editorial compositions
    - Cards "float" over background elements

32. CIRCULAR/RADIAL TEXT
    - SVG <textPath> following curved paths
    - Circular headings, decorative text around focal points
    - Use for: topic rings, emphasis, artistic headers
    - Eye-catching and unique typography

33. MASONRY LAYOUTS
    - Pinterest-style waterfall of variable-height cards
    - Use CSS columns with break-inside-avoid
    - Cards flow naturally without fixed heights
    - Organic, dynamic gallery layouts

=== USAGE GUIDELINES ===

CRITICAL: Use 5-8 DIFFERENT enhancements per presentation

COMBINATION EXAMPLES FOR MAXIMUM IMPACT:
- Parallax hero + Glassmorphism cards + Scroll progress bar
- 3D flip cards + Particle effects + Achievement badges
- Bento grid dashboard + Animated charts + Heat maps
- Magazine layout + Circular text + Comparison sliders
- Masonry gallery + Morphing blobs + Interactive timeline

IMPLEMENTATION CHECKLIST:
✓ All JavaScript must be inline and functional
✓ Smooth animations (transition-all duration-300 ease-out)
✓ Hover states on all interactive elements
✓ Mobile-responsive (touch interactions work on cards)
✓ Accessibility (keyboard navigation where possible)
✓ Medical accuracy always maintained
✓ Multiple diverse patterns per presentation
✓ No repeated layouts across different slides

=== ADVANCED CODE EXAMPLES ===

Example 1: Parallax Hero with Glassmorphism
<section class="relative min-h-screen flex items-center justify-center overflow-hidden">
  <div class="absolute inset-0 bg-cover bg-fixed bg-center"
       style="background-image: url('https://images.unsplash.com/photo-1631217868264-e5b90bb7e133')"></div>
  <div class="relative z-10 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-12 max-w-2xl shadow-2xl">
    <h1 class="text-6xl font-bold text-white mb-4 animate-fade-in">Cardiac Physiology</h1>
    <p class="text-xl text-white/90">Explore the intricate electrical system of the human heart</p>
  </div>
</section>

Example 2: 3D Flip Card Quiz
<div class="flip-card w-80 h-96 cursor-pointer perspective-1000"
     onclick="this.querySelector('.flip-inner').classList.toggle('rotate-y-180')">
  <div class="flip-inner relative w-full h-full transition-transform duration-700"
       style="transform-style: preserve-3d">
    <div class="absolute w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 flex items-center justify-center shadow-xl"
         style="backface-visibility: hidden">
      <h3 class="text-white text-2xl text-center font-semibold">What is the normal resting heart rate for adults?</h3>
    </div>
    <div class="absolute w-full h-full bg-white rounded-2xl p-8 flex items-center justify-center shadow-xl"
         style="backface-visibility: hidden; transform: rotateY(180deg)">
      <div class="text-center">
        <p class="text-4xl font-bold mb-2 text-blue-600">60-100 bpm</p>
        <p class="text-gray-600">Beats per minute</p>
      </div>
    </div>
  </div>
</div>

Example 3: Animated Progress Ring with Gradient
<div class="flex flex-col items-center p-8">
  <svg class="w-40 h-40 -rotate-90">
    <circle cx="80" cy="80" r="70" fill="none" stroke="#e5e7eb" stroke-width="10"/>
    <circle cx="80" cy="80" r="70" fill="none" stroke="url(#progressGradient)" stroke-width="10"
            stroke-dasharray="440" stroke-dashoffset="110" stroke-linecap="round"
            class="transition-all duration-2000 ease-out">
      <animate attributeName="stroke-dashoffset" from="440" to="110" dur="2s" fill="freeze"/>
    </circle>
    <defs>
      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#10b981"/>
        <stop offset="100%" style="stop-color:#3b82f6"/>
      </linearGradient>
    </defs>
  </svg>
  <div class="text-5xl font-bold mt-4 text-gray-800">75%</div>
  <div class="text-gray-600 text-lg">Treatment Success Rate</div>
</div>

Example 4: Bento Grid Dashboard Layout
<div class="grid grid-cols-4 grid-rows-4 gap-4 h-screen p-8 bg-gray-50">
  <div class="col-span-2 row-span-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-8 text-white shadow-xl">
    <h2 class="text-4xl font-bold mb-4">Heart Disease Overview</h2>
    <p class="text-lg opacity-90">Comprehensive analysis of cardiovascular conditions</p>
  </div>
  <div class="col-span-2 row-span-1 bg-white rounded-2xl p-6 shadow-lg">
    <h3 class="font-semibold text-gray-600 mb-2">Prevention Rate</h3>
    <p class="text-4xl font-bold text-green-600">98.5%</p>
  </div>
  <div class="col-span-1 row-span-2 bg-gradient-to-b from-green-400 to-teal-500 rounded-2xl p-6 text-white shadow-lg">
    <h3 class="font-semibold mb-4">Patient Progress</h3>
    <!-- Progress ring SVG here -->
  </div>
  <div class="col-span-3 row-span-1 bg-gradient-to-r from-orange-100 to-pink-100 rounded-2xl p-6">
    <h3 class="font-semibold text-gray-700">Recent Activity Trends</h3>
  </div>
  <div class="col-span-4 row-span-1 bg-white rounded-2xl p-6 shadow-lg">
    <!-- Interactive bar chart here -->
  </div>
</div>

Example 5: Drag-Drop Matching Game
<div class="grid grid-cols-2 gap-12 p-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl">
  <div class="space-y-4">
    <h3 class="text-2xl font-bold mb-6 text-gray-800">Medical Terms</h3>
    <div draggable="true" ondragstart="event.dataTransfer.setData('text', 'Hypertension')"
         class="p-4 bg-blue-100 rounded-lg cursor-move hover:bg-blue-200 hover:scale-105 transition-all shadow-md">
      <span class="font-semibold text-blue-800">Hypertension</span>
    </div>
    <div draggable="true" ondragstart="event.dataTransfer.setData('text', 'Diabetes')"
         class="p-4 bg-green-100 rounded-lg cursor-move hover:bg-green-200 hover:scale-105 transition-all shadow-md">
      <span class="font-semibold text-green-800">Diabetes Mellitus</span>
    </div>
    <div draggable="true" ondragstart="event.dataTransfer.setData('text', 'Tachycardia')"
         class="p-4 bg-purple-100 rounded-lg cursor-move hover:bg-purple-200 hover:scale-105 transition-all shadow-md">
      <span class="font-semibold text-purple-800">Tachycardia</span>
    </div>
  </div>
  <div class="space-y-4">
    <h3 class="text-2xl font-bold mb-6 text-gray-800">Match Definitions</h3>
    <div class="p-4 border-2 border-dashed border-gray-300 rounded-lg min-h-20 transition-all hover:border-blue-400"
         ondrop="event.preventDefault(); const text = event.dataTransfer.getData('text'); event.target.innerHTML = '<span class=\\'font-semibold text-green-800\\'>' + text + '</span><span class=\\'text-sm text-gray-600 block mt-1\\'>Elevated blood pressure</span>'; event.target.classList.add('bg-green-100', 'border-green-500')"
         ondragover="event.preventDefault()">
      <span class="text-gray-400">Elevated blood pressure (>140/90)</span>
    </div>
    <div class="p-4 border-2 border-dashed border-gray-300 rounded-lg min-h-20 transition-all hover:border-blue-400"
         ondrop="event.preventDefault(); const text = event.dataTransfer.getData('text'); event.target.innerHTML = '<span class=\\'font-semibold text-green-800\\'>' + text + '</span><span class=\\'text-sm text-gray-600 block mt-1\\'>High blood glucose</span>'; event.target.classList.add('bg-green-100', 'border-green-500')"
         ondragover="event.preventDefault()">
      <span class="text-gray-400">High blood glucose levels</span>
    </div>
    <div class="p-4 border-2 border-dashed border-gray-300 rounded-lg min-h-20 transition-all hover:border-blue-400"
         ondrop="event.preventDefault(); const text = event.dataTransfer.getData('text'); event.target.innerHTML = '<span class=\\'font-semibold text-green-800\\'>' + text + '</span><span class=\\'text-sm text-gray-600 block mt-1\\'>Rapid heart rate</span>'; event.target.classList.add('bg-green-100', 'border-green-500')"
         ondragover="event.preventDefault()">
      <span class="text-gray-400">Heart rate >100 bpm at rest</span>
    </div>
  </div>
</div>

Example 6: Scroll Progress Bar
<div class="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
  <div class="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300"
       style="width: 0%" id="scrollProgress"></div>
</div>
<script>
  window.addEventListener('scroll', () => {
    const winScroll = document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    document.getElementById('scrollProgress').style.width = scrolled + '%';
  });
</script>

===========================================================================
SECOND WAVE: 25 MORE ADVANCED PATTERNS (PATTERNS 34-58)
===========================================================================

=== CATEGORY 1: DYNAMIC TEXT & TYPOGRAPHY ===

34. TYPEWRITER EFFECT
    - Text types out character by character with blinking cursor
    - CSS animation with steps() function or JavaScript setInterval
    - Great for dramatic quotes, key takeaways, case introductions
    - Add blinking cursor: animation: blink 1s step-end infinite

35. TEXT SCRAMBLE/DECODE ANIMATION
    - Matrix-style text that scrambles then settles into final text
    - Random characters → real text over 1-2 seconds
    - Use for dramatic reveals of diagnoses, critical results
    - JavaScript: randomize characters, gradually replace with actual text

36. GRADIENT TEXT WITH MOVING BACKGROUND
    - Text with animated gradient that shifts/rotates
    - background-clip: text with -webkit- prefix
    - Gradient animates left-to-right or rotates 360deg
    - Eye-catching for section titles and key statements

37. TEXT REVEAL ON SCROLL (WORD BY WORD)
    - Individual words appear one at a time as user scrolls
    - IntersectionObserver + opacity-0 → opacity-100 transitions
    - Stagger delay (0.1s per word) creates flowing effect
    - Perfect for step-by-step instructions or protocols

38. NEON GLOW TEXT
    - Pulsing neon sign effect for critical emphasis
    - Multiple text-shadow layers in bright colors (cyan, magenta, yellow)
    - Animate shadow blur/opacity for pulsing glow
    - Perfect for "WARNING", "CRITICAL", "EMERGENCY" labels

=== CATEGORY 2: ADVANCED TRANSITIONS & VISUAL EFFECTS ===

39. PAGE CURL EFFECT
    - Book-like page corner curl on hover/click
    - CSS clip-path + transform: rotateY() for realistic curl
    - Creates skeuomorphic, tactile reading experience
    - Use for multi-page case studies or textbook-style content

40. RIPPLE/WATER EFFECT ON CLICK
    - Expanding circle animation emanating from click point
    - Absolute positioned <div> with scale(0) → scale(4) animation
    - Remove element after animation completes (600ms)
    - Satisfying tactile feedback for interactive elements

41. KEN BURNS EFFECT (ZOOM & PAN)
    - Slow zoom + pan on background images (cinematic feel)
    - CSS @keyframes with transform: scale(1.2) + translate
    - 20-30 second animation for subtle movement
    - Perfect for hero sections with medical imagery

42. VIDEO BACKGROUNDS (LOOPING)
    - Medical footage (blood flow, heartbeat, microscopy) as background
    - HTML5 <video> element with autoplay muted loop
    - Low opacity overlay (bg-black/50) for text readability
    - Adds dynamic movement without overwhelming content

43. SPOTLIGHT FOLLOWING CURSOR
    - Dark overlay with circular spotlight centered on cursor
    - JavaScript mousemove tracks cursor position
    - Radial gradient (transparent center, dark edges) follows mouse
    - Creates focus and drama on anatomical diagrams

=== CATEGORY 3: MEDICAL-SPECIFIC VISUALIZATIONS ===

44. PULSE WAVE/ECG ANIMATIONS
    - Animated heartbeat waveform moving across screen
    - SVG path with stroke-dashoffset animation
    - Realistic ECG rhythm strip effect (QRS complexes)
    - Perfect for cardiology topics, vital signs displays

45. BODY SYSTEM LAYER TOGGLE
    - Stacked images: skin → muscle → organs → skeleton
    - Toggle buttons show/hide individual layers
    - CSS opacity: 0 ↔ opacity: 1 smooth transitions
    - Interactive anatomy education (click to explore layers)

46. MEDICATION TIMELINE (HALF-LIFE DECAY)
    - Visual drug concentration curve over time
    - Exponential decay SVG path (peak → steady-state → elimination)
    - Show dosing intervals, therapeutic window, toxic levels
    - Perfect for pharmacokinetics, dosing education

47. LAB VALUE GAUGES (ANALOG METERS)
    - Semicircular gauge with rotating needle indicator
    - SVG needle rotates to indicate value position
    - Color zones: green (normal), yellow (borderline), red (critical)
    - Interactive: click different labs to update display

48. DNA HELIX ANIMATION
    - Rotating double helix structure with base pair labels
    - CSS 3D transforms + continuous rotation animation
    - Color-code base pairs (A-T blue, G-C green)
    - Hover to pause rotation and explore structure

=== CATEGORY 4: SMART INTERACTION PATTERNS ===

49. TABBED INTERFACES
    - Multiple tabs for organizing related content
    - Click tab to switch active content panel
    - Animated underline/highlight slides to active tab
    - Organize complex topics: Symptoms | Diagnosis | Treatment

50. ACCORDION SECTIONS (VERTICAL COLLAPSE)
    - Click header to expand/collapse content sections
    - Smooth height transition using max-height property
    - Auto-close other sections or allow multiple open
    - Great for FAQs, step-by-step protocols, guidelines

51. MODAL LIGHTBOX OVERLAYS
    - Click thumbnail/button to open full-screen detail view
    - Darkened backdrop (bg-black/80) with centered modal
    - Close button + click-outside-to-dismiss
    - Perfect for detailed images, charts, data tables

52. STICKY NOTES WALL
    - Post-it style notes in various colors (yellow, pink, blue, green)
    - Slight rotation (rotate(-2deg), rotate(3deg)) for realism
    - Hover to "lift" note (increase shadow, scale(1.05))
    - Collect quick facts, mnemonics, clinical pearls

53. CLICK-TO-ZOOM IMAGES (HIGH-RES EXPLORATION)
    - Click image to zoom in 2-3x for detail viewing
    - Pan around zoomed image with mouse drag or touch
    - Transform-origin follows click position
    - Essential for pathology slides, radiology, anatomy

=== CATEGORY 5: ENGAGEMENT & FEEDBACK MECHANICS ===

54. SCRATCH-OFF REVEAL
    - Canvas overlay that "scratches off" on mouse drag
    - Reveals hidden answer/image underneath
    - Track scratch percentage, auto-reveal at 70%+
    - Fun, engaging quiz interaction (scratch to reveal answer)

55. MINI FLIP CARDS GRID (GLOSSARY)
    - Grid of small cards (medical term front, definition back)
    - Click individual cards to flip with 3D rotateY effect
    - 4x4 or 3x5 grid layout for medical terminology
    - Great for vocabulary review, term matching

56. CONFETTI BURST ON SUCCESS
    - Colorful particles explode from center on correct answer
    - CSS particles with randomized transform + opacity animations
    - 50-100 particles with varied colors and trajectories
    - Positive reinforcement, celebratory feedback

57. SKELETON LOADING SCREENS
    - Pulsing gray rectangles before actual content loads
    - Shimmer animation (gradient sweeps left-to-right)
    - Better UX than spinners for progressive content reveal
    - Use when loading complex visualizations or images

58. "TYPING" INDICATOR ANIMATION
    - Three bouncing dots (...) indicating processing
    - Staggered bounce timing creates wave effect
    - Use when AI is "thinking" or content is loading
    - Humanizes interactions, sets user expectations

=== NEW CODE EXAMPLES (SECOND WAVE) ===

Example 7: Typewriter Effect
<div class="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
  <div class="typewriter-container">
    <h2 class="typewriter text-5xl font-bold text-white">Diagnosis: Acute Myocardial Infarction</h2>
  </div>
</div>
<style>
  .typewriter {
    overflow: hidden;
    border-right: 3px solid #3b82f6;
    white-space: nowrap;
    animation: typing 3.5s steps(42) forwards, blink 0.75s step-end infinite;
  }
  @keyframes typing {
    from { width: 0; }
    to { width: 100%; }
  }
  @keyframes blink {
    50% { border-color: transparent; }
  }
</style>

Example 8: Ripple Effect on Click
<div class="ripple-container relative overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 text-white p-16 rounded-3xl cursor-pointer shadow-2xl"
     onclick="createRipple(event, this)">
  <h3 class="text-3xl font-bold relative z-10">Click to Interact</h3>
  <p class="text-lg opacity-90 mt-2 relative z-10">Watch the ripple effect</p>
</div>
<style>
  .ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    transform: scale(0);
    animation: ripple-animation 0.6s ease-out;
    pointer-events: none;
  }
  @keyframes ripple-animation {
    to { transform: scale(4); opacity: 0; }
  }
</style>
<script>
  function createRipple(event, element) {
    const ripple = document.createElement('div');
    ripple.classList.add('ripple');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = event.clientX - rect.left - size / 2 + 'px';
    ripple.style.top = event.clientY - rect.top - size / 2 + 'px';
    element.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }
</script>

Example 9: Accordion Sections
<div class="accordion space-y-4 max-w-3xl mx-auto p-8">
  <div class="accordion-item border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm">
    <button class="accordion-header w-full text-left p-6 font-bold text-lg bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 flex justify-between items-center transition-all"
            onclick="toggleAccordion(this)">
      <span class="text-blue-800">Clinical Symptoms</span>
      <span class="accordion-icon text-2xl text-blue-600">▼</span>
    </button>
    <div class="accordion-content max-h-0 overflow-hidden transition-all duration-300 bg-white">
      <div class="p-6 text-gray-700">
        <ul class="list-disc pl-6 space-y-2">
          <li class="text-lg">Chest pain radiating to left arm and jaw</li>
          <li class="text-lg">Shortness of breath (dyspnea)</li>
          <li class="text-lg">Diaphoresis (profuse sweating)</li>
          <li class="text-lg">Nausea and vomiting</li>
        </ul>
      </div>
    </div>
  </div>
  <div class="accordion-item border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm">
    <button class="accordion-header w-full text-left p-6 font-bold text-lg bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 flex justify-between items-center transition-all"
            onclick="toggleAccordion(this)">
      <span class="text-green-800">Diagnostic Tests</span>
      <span class="accordion-icon text-2xl text-green-600">▼</span>
    </button>
    <div class="accordion-content max-h-0 overflow-hidden transition-all duration-300 bg-white">
      <div class="p-6 text-gray-700">
        <ul class="list-disc pl-6 space-y-2">
          <li class="text-lg">12-lead ECG (ST-elevation pattern)</li>
          <li class="text-lg">Cardiac troponin levels (elevated)</li>
          <li class="text-lg">Coronary angiography</li>
        </ul>
      </div>
    </div>
  </div>
</div>
<script>
  function toggleAccordion(button) {
    const content = button.nextElementSibling;
    const icon = button.querySelector('.accordion-icon');
    const isOpen = content.style.maxHeight && content.style.maxHeight !== '0px';

    // Close all accordions
    document.querySelectorAll('.accordion-content').forEach(el => {
      el.style.maxHeight = null;
    });
    document.querySelectorAll('.accordion-icon').forEach(el => {
      el.textContent = '▼';
    });

    // Open clicked accordion if it was closed
    if (!isOpen) {
      content.style.maxHeight = content.scrollHeight + 'px';
      icon.textContent = '▲';
    }
  }
</script>

Example 10: Tabbed Interface
<div class="tabs-container max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow-xl">
  <div class="tabs-header flex border-b-2 border-gray-300 mb-6">
    <button class="tab-button px-8 py-4 font-bold text-lg transition-all border-b-4 border-transparent hover:bg-gray-50 active"
            onclick="switchTab(event, 'symptoms')">
      <span class="flex items-center gap-2">
        <span>🩺</span> Symptoms
      </span>
    </button>
    <button class="tab-button px-8 py-4 font-bold text-lg transition-all border-b-4 border-transparent hover:bg-gray-50"
            onclick="switchTab(event, 'diagnosis')">
      <span class="flex items-center gap-2">
        <span>🔬</span> Diagnosis
      </span>
    </button>
    <button class="tab-button px-8 py-4 font-bold text-lg transition-all border-b-4 border-transparent hover:bg-gray-50"
            onclick="switchTab(event, 'treatment')">
      <span class="flex items-center gap-2">
        <span>💊</span> Treatment
      </span>
    </button>
  </div>

  <div id="symptoms" class="tab-content">
    <h3 class="text-2xl font-bold mb-4 text-gray-800">Clinical Presentation</h3>
    <p class="text-lg text-gray-700 mb-4">Patients typically present with:</p>
    <ul class="list-disc pl-6 space-y-2 text-gray-700">
      <li>Severe chest pain (crushing, pressure-like sensation)</li>
      <li>Dyspnea and tachypnea</li>
      <li>Diaphoresis and pallor</li>
    </ul>
  </div>

  <div id="diagnosis" class="tab-content hidden">
    <h3 class="text-2xl font-bold mb-4 text-gray-800">Diagnostic Criteria</h3>
    <p class="text-lg text-gray-700 mb-4">Diagnosis confirmed by:</p>
    <ul class="list-disc pl-6 space-y-2 text-gray-700">
      <li>ECG showing ST-segment elevation in 2+ contiguous leads</li>
      <li>Elevated cardiac biomarkers (troponin I/T)</li>
      <li>Clinical presentation consistent with MI</li>
    </ul>
  </div>

  <div id="treatment" class="tab-content hidden">
    <h3 class="text-2xl font-bold mb-4 text-gray-800">Treatment Protocol</h3>
    <p class="text-lg text-gray-700 mb-4">MONA + PCI Protocol:</p>
    <ul class="list-disc pl-6 space-y-2 text-gray-700">
      <li><strong>M</strong>orphine for pain control</li>
      <li><strong>O</strong>xygen if SpO2 <90%</li>
      <li><strong>N</strong>itroglycerin (sublingual)</li>
      <li><strong>A</strong>spirin 325mg chewed</li>
      <li><strong>PCI</strong> within 90 minutes (door-to-balloon)</li>
    </ul>
  </div>
</div>
<style>
  .tab-button.active {
    border-bottom-color: #3b82f6;
    color: #3b82f6;
    background: linear-gradient(to bottom, transparent, #eff6ff);
  }
  .tab-content {
    animation: fadeIn 0.4s ease-in;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
<script>
  function switchTab(event, tabId) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-button').forEach(el => el.classList.remove('active'));

    // Show selected tab
    document.getElementById(tabId).classList.remove('hidden');
    event.target.closest('.tab-button').classList.add('active');
  }
</script>

Example 11: Confetti Celebration
<div class="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
  <button onclick="celebrate()" class="px-12 py-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-2xl font-bold rounded-2xl shadow-2xl hover:scale-105 transition-transform">
    Correct Answer! Click to Celebrate 🎉
  </button>
</div>
<script>
  function celebrate() {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff6600'];
    for (let i = 0; i < 80; i++) {
      const confetti = document.createElement('div');
      const size = Math.random() * 8 + 6;
      confetti.style.cssText = \`
        position: fixed;
        width: \${size}px;
        height: \${size}px;
        background: \${colors[Math.floor(Math.random() * colors.length)]};
        left: 50%;
        top: 50%;
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        animation: confetti-fall \${1.5 + Math.random()}s ease-out forwards;
        transform: translate(\${Math.random() * 300 - 150}px, \${Math.random() * 200 - 100}px) rotate(\${Math.random() * 360}deg);
      \`;
      document.body.appendChild(confetti);
      setTimeout(() => confetti.remove(), 3000);
    }
  }
  if (!document.getElementById('confetti-style')) {
    const style = document.createElement('style');
    style.id = 'confetti-style';
    style.textContent = '@keyframes confetti-fall { to { transform: translateY(100vh) rotate(720deg); opacity: 0; } }';
    document.head.appendChild(style);
  }
</script>

Example 12: Interactive Drug Dosing Calculator
<section class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-8">
  <div class="max-w-5xl mx-auto">
    <h2 class="text-4xl font-bold text-white mb-8">💊 Real-Time Drug Dosing Calculator</h2>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Input Controls -->
      <div class="space-y-4">
        <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6">
          <h3 class="text-white font-bold mb-4">Select Medication</h3>
          <select id="drugSelect" onchange="calculateDose()" class="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white">
            <option value="acetaminophen">Acetaminophen</option>
            <option value="vancomycin">Vancomycin</option>
            <option value="gentamicin">Gentamicin</option>
          </select>
        </div>

        <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6">
          <label class="text-slate-300 text-sm font-medium mb-2 block flex justify-between">
            <span>Weight (kg)</span>
            <span id="weightDisplay" class="text-purple-400 font-bold">70</span>
          </label>
          <input type="range" id="weightSlider" min="3" max="150" value="70" step="0.5"
                 oninput="document.getElementById('weightDisplay').textContent = this.value; calculateDose()"
                 class="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer">

          <label class="text-slate-300 text-sm font-medium mb-2 mt-4 block flex justify-between">
            <span>CrCl (mL/min)</span>
            <span id="crclDisplay" class="text-purple-400 font-bold">90</span>
          </label>
          <input type="range" id="crclSlider" min="5" max="120" value="90" step="5"
                 oninput="document.getElementById('crclDisplay').textContent = this.value; calculateDose()"
                 class="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer">
        </div>
      </div>

      <!-- Results Display -->
      <div class="lg:col-span-2 space-y-4">
        <div class="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30 rounded-2xl p-6">
          <div class="flex items-start justify-between mb-4">
            <h3 id="drugName" class="text-white font-bold text-2xl">Acetaminophen</h3>
            <div id="safetyBadge" class="px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-xl text-green-400 font-bold">
              ✓ SAFE
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 bg-slate-800/50 rounded-xl p-6">
            <div>
              <p class="text-slate-400 text-sm">Recommended Dose</p>
              <p id="calcDose" class="text-white font-bold text-3xl">1000 mg</p>
            </div>
            <div>
              <p class="text-slate-400 text-sm">Frequency</p>
              <p id="frequency" class="text-white font-bold text-2xl">Q6H</p>
            </div>
          </div>

          <div id="warningZone" class="hidden bg-red-500/10 border-2 border-red-500/50 rounded-xl p-4 mt-4">
            <div class="flex items-start gap-2">
              <span class="text-2xl animate-pulse">🚨</span>
              <div>
                <p class="text-red-400 font-bold text-lg">TOXIC DOSE ALERT</p>
                <p class="text-slate-200" id="warningText">Dose exceeds safe range!</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Therapeutic Window Visualization -->
        <div class="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <h3 class="text-white font-bold mb-4">📊 Therapeutic Window</h3>
          <div class="relative h-20 bg-gradient-to-r from-green-500/20 via-yellow-500/20 to-red-500/20 rounded-xl overflow-hidden mb-4">
            <div class="absolute inset-0 flex text-xs font-bold">
              <div class="flex-1 flex items-center justify-center text-green-400">SAFE</div>
              <div class="flex-1 flex items-center justify-center text-yellow-400">BORDERLINE</div>
              <div class="flex-1 flex items-center justify-center text-red-400">TOXIC</div>
            </div>
            <div id="doseIndicator" class="absolute top-0 bottom-0 w-1 bg-white shadow-lg transition-all duration-300" style="left: 25%;">
              <div class="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    background: linear-gradient(135deg, #a855f7, #ec4899);
    cursor: pointer;
    border-radius: 50%;
    box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
  }
</style>

<script>
  const drugs = {
    acetaminophen: { name: 'Acetaminophen', dose: 15, freq: 'Q6H', max: 4000, renalAdj: false },
    vancomycin: { name: 'Vancomycin', dose: 15, freq: 'Q12H', max: 4000, renalAdj: true },
    gentamicin: { name: 'Gentamicin', dose: 5, freq: 'Q24H', max: 7, renalAdj: true }
  };

  function calculateDose() {
    const drugKey = document.getElementById('drugSelect').value;
    const weight = parseFloat(document.getElementById('weightSlider').value);
    const crcl = parseFloat(document.getElementById('crclSlider').value);
    const drug = drugs[drugKey];

    let dose = drug.dose * weight;

    // Renal adjustment
    if (drug.renalAdj && crcl < 30) {
      dose = dose * 0.5;
    } else if (drug.renalAdj && crcl < 60) {
      dose = dose * 0.75;
    }

    dose = Math.round(dose * 10) / 10;

    // Update display
    document.getElementById('drugName').textContent = drug.name;
    document.getElementById('calcDose').textContent = dose + ' mg';
    document.getElementById('frequency').textContent = drug.freq;

    // Safety check
    const dailyDose = dose * (drug.freq === 'Q6H' ? 4 : drug.freq === 'Q12H' ? 2 : 1);
    const isToxic = dailyDose > drug.max;

    if (isToxic) {
      document.getElementById('warningZone').classList.remove('hidden');
      document.getElementById('safetyBadge').className = 'px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 font-bold';
      document.getElementById('safetyBadge').textContent = '🚨 TOXIC';
      document.getElementById('doseIndicator').style.left = '85%';
    } else {
      document.getElementById('warningZone').classList.add('hidden');
      document.getElementById('safetyBadge').className = 'px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-xl text-green-400 font-bold';
      document.getElementById('safetyBadge').textContent = '✓ SAFE';
      const percentage = Math.min((dailyDose / drug.max) * 100, 100);
      document.getElementById('doseIndicator').style.left = percentage + '%';
    }
  }

  calculateDose(); // Initialize
</script>

=== UPDATED USAGE GUIDELINES (58 PATTERNS TOTAL) ===

CRITICAL: Use 6-10 DIFFERENT enhancements per presentation (increased from 5-8)

MAXIMUM IMPACT COMBINATIONS:
- Typewriter intro + Tabbed content + Confetti rewards + Progress rings + ECG animation
- Video background + Glassmorphism cards + Accordion + Body layer toggle + Lab gauges
- Ken Burns hero + Flip cards grid + Spotlight cursor + Heat maps + DNA helix
- Sticky notes wall + Ripple effects + Medication timeline + Bento grid + Neon text
- Page curl + Modal lightboxes + Drag-drop matching + Scroll progress + Scratch-off quiz

MIX CATEGORIES FOR VARIETY:
✓ Text effects (typewriter, neon, gradient)
✓ 3D elements (flips, tilts, glassmorphism)
✓ Data viz (charts, gauges, timelines)
✓ Interactions (tabs, accordions, drag-drop)
✓ Medical-specific (ECG, body layers, DNA)
✓ Gamification (confetti, badges, scratch-off)

===========================================================================

=== FINAL REMINDERS ===

MUST DO FOR JAW-DROPPING PRESENTATIONS:
- Use 6-10 different advanced patterns per presentation (not just 1-2)
- Combine multiple techniques for compound effects (parallax + glassmorphism, 3D + particles)
- Ensure ALL JavaScript is inline and actually works when executed
- Test every interactive element (clicks, drags, hovers function properly)
- Maintain medical accuracy while being maximally creative
- Make EVERY slide visually unique with different layouts
- Create multiple WOW moments that make presentations unforgettable and shareable

ABSOLUTELY FORBIDDEN:
- Don't use the same pattern on multiple slides (variety is key)
- Don't create presentations without interactive elements (boring!)
- Don't sacrifice medical accuracy for visual creativity (both required)
- Don't use external JavaScript libraries (must be self-contained)
- Don't make it overly complex (balance wow factor with usability)
- Don't forget to vary color schemes across slides (visual diversity)

REMEMBER:
- VARY layouts across slides (don't repeat same pattern)
- Use DIFFERENT color schemes for different topics
- Include INTERACTIVE elements (click, hover, expand)
- Create VISUAL HIERARCHY with size, color, spacing
- Make it ENGAGING and MEMORABLE for learners
- Each slide should have a UNIQUE visual identity`;

      onProgress?.('claude', 12, '✅ System prompt configured');

      // Build message content (multimodal support)
      const userContent: any[] = [
        {
          type: 'text',
          text: prompt,
        },
      ];

      // Handle images if provided (vision support)
      if (files && files.length > 0) {
        onProgress?.('claude', 15, `📷 Processing ${files.length} uploaded file(s)...`);

        for (const file of files) {
          // Determine media type
          const mediaType = file.mimeType || 'image/jpeg';

          userContent.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: file.base64,
            },
          });

          onProgress?.('claude', 18, `✅ Image processed (${mediaType})`);
        }
      }

      onProgress?.('claude', 20, '🚀 Sending request to Claude with streaming...');

      // Use streaming for real-time progress
      let accumulatedText = '';
      let lastProgress = 20;

      await this.makeRequestWithRetry(async () => {
        const stream = await this.client.messages.stream({
          model: modelId,
          max_tokens: 16384, // Large output window
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: userContent,
            },
          ],
          temperature: 0.7,
        });

        // Handle streaming events
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            accumulatedText += event.delta.text;

            // Update progress based on accumulated length
            const estimatedProgress = Math.min(20 + (accumulatedText.length / 200), 95);
            if (estimatedProgress > lastProgress + 5) {
              const kb = Math.round(accumulatedText.length / 1024);
              onProgress?.('claude', estimatedProgress, `📥 Streaming... (${kb}KB received)`, undefined, accumulatedText);
              lastProgress = estimatedProgress;
            }
          }
        }

        return accumulatedText;
      }, onProgress);

      onProgress?.('claude', 95, '✅ Response received successfully');

      // Validate we have accumulated content
      if (!accumulatedText || accumulatedText.trim().length === 0) {
        throw new Error('No content received from Claude API. The response was empty.');
      }

      console.log(`📊 [Claude] Received ${accumulatedText.length} chars from stream`);

      // Detect response type (JSON vs HTML)
      const trimmed = accumulatedText.trim();
      const looksLikeJson = trimmed.startsWith('{') || trimmed.startsWith('[') ||
                           /^```json\s*\{/.test(trimmed) || /^```json\s*\[/.test(trimmed);

      // If it's JSON, extract and return it directly (for architect agent, etc.)
      if (looksLikeJson) {
        console.log('✅ [Claude] Detected JSON response, extracting...');

        // Strip markdown code blocks if present
        const jsonStripped = accumulatedText
          .replace(/^```json\s*/, '')
          .replace(/^```\s*/, '')
          .replace(/```\s*$/, '')
          .trim();

        onProgress?.('complete', 100, '✅ JSON response received');
        return jsonStripped;
      }

      // Otherwise, extract HTML
      onProgress?.('claude', 98, '📄 Extracting HTML from response...');
      let htmlContent = '';

      // Try 1: Extract from markdown code blocks first
      const codeBlockMatch = accumulatedText.match(/```(?:html)?\s*(<!DOCTYPE[\s\S]*?<\/html>|<html[\s\S]*?<\/html>)\s*```/i);
      if (codeBlockMatch) {
        console.log('✅ [Claude] Extracted HTML from code block');
        htmlContent = codeBlockMatch[1];
      } else {
        // Try 2: Complete HTML document (with closing tag)
        const completeHtmlMatch = accumulatedText.match(/<!DOCTYPE html>[\s\S]*?<\/html>/i) ||
                                  accumulatedText.match(/<html[\s\S]*?<\/html>/i);
        if (completeHtmlMatch) {
          console.log('✅ [Claude] Found complete HTML document');
          htmlContent = completeHtmlMatch[0];
        } else {
          // Try 3: Partial HTML (DOCTYPE to end, even if incomplete)
          const partialHtmlMatch = accumulatedText.match(/(<!DOCTYPE html>[\s\S]*)/i);
          if (partialHtmlMatch) {
            console.warn('⚠️ [Claude] HTML appears incomplete, attempting to repair...');
            let partial = partialHtmlMatch[0];

            // Auto-close common unclosed tags
            if (!partial.includes('</html>')) {
              if (!partial.includes('</body>')) {
                partial += '\n</body>';
              }
              partial += '\n</html>';
            }

            htmlContent = partial;
            console.log('✅ [Claude] Repaired incomplete HTML');
          } else {
            // Try 4: Look for <html> tag without DOCTYPE
            const htmlTagMatch = accumulatedText.match(/(<html[\s\S]*)/i);
            if (htmlTagMatch) {
              console.warn('⚠️ [Claude] Found HTML without DOCTYPE, adding it...');
              let partial = htmlTagMatch[0];

              // Auto-close if needed
              if (!partial.includes('</html>')) {
                if (!partial.includes('</body>')) {
                  partial += '\n</body>';
                }
                partial += '\n</html>';
              }

              htmlContent = '<!DOCTYPE html>\n' + partial;
              console.log('✅ [Claude] Added DOCTYPE to HTML');
            } else {
              // Try 5: Last resort - look for body content
              const bodyMatch = accumulatedText.match(/<body[\s\S]*?<\/body>/i);
              if (bodyMatch) {
                console.warn('⚠️ [Claude] Only found body tag, creating minimal HTML wrapper');
                htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"></script></head>${bodyMatch[0]}</html>`;
              } else {
                // Try 6: Ultra last resort - look for ANY body tag (even unclosed)
                const partialBodyMatch = accumulatedText.match(/(<body[\s\S]*)/i);
                if (partialBodyMatch) {
                  console.warn('⚠️ [Claude] Found unclosed body tag, attempting rescue...');
                  let bodyContent = partialBodyMatch[0];
                  if (!bodyContent.includes('</body>')) {
                    bodyContent += '\n</body>';
                  }
                  htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"></script></head>${bodyContent}</html>`;
                  console.log('✅ [Claude] Salvaged partial HTML content');
                } else {
                  console.error('❌ [Claude] No HTML structure found in response');
                  console.error(`First 500 chars: ${accumulatedText.substring(0, 500)}`);
                  throw new Error('No valid HTML found in Claude response. Response may be incomplete or malformed.');
                }
              }
            }
          }
        }
      }

      // Post-processing: Inject checkpoint slides every 3 slides
      onProgress?.('complete', 96, '🧠 Adding knowledge checkpoint slides...');

      let enhancedHtml = htmlContent;

      try {
        const htmlWithCheckpoints = await injectCheckpointSlides(htmlContent, {
          interval: 3,
          provider: 'gemini', // Use Gemini for checkpoint questions (faster)
          includeActiveRecall: true,
          includeElaborative: true,
        });

        enhancedHtml = htmlWithCheckpoints;
        onProgress?.('complete', 98, '✅ Checkpoints added');
      } catch (checkpointError) {
        console.warn('⚠️ [Claude] Failed to inject checkpoints, continuing without them:', checkpointError);
        onProgress?.('complete', 98, '⚠️ Checkpoints skipped');
      }

      // Post-processing: Add content enhancement layers
      onProgress?.('complete', 99, '💎 Generating content enhancements...');

      try {
        const { generateEnhancementsForSlide, injectEnhancementLayerHTML } = await import('../content-enhancer');

        // Extract topic from prompt or use generic
        const topic = prompt.split('\n')[0].slice(0, 100) || 'Medical Education';

        // Generate enhancements for the presentation (use Gemini for speed)
        const enhancements = await generateEnhancementsForSlide(enhancedHtml, topic, 'gemini');

        if (enhancements.length > 0) {
          enhancedHtml = injectEnhancementLayerHTML(enhancedHtml, enhancements);
          console.log(`✅ [Claude] Added ${enhancements.length} content enhancements`);
        }
      } catch (enhancementError) {
        console.warn('⚠️ [Claude] Failed to add enhancements, continuing without them:', enhancementError);
      }

      // Post-processing: Inject mini-games based on content detection
      onProgress?.('complete', 99, '🎮 Detecting mini-game opportunities...');

      try {
        const detectedGames = detectMiniGameOpportunities(enhancedHtml);

        if (detectedGames.length > 0) {
          console.log(`[Claude] Detected ${detectedGames.length} mini-game opportunities:`,
                     detectedGames.map(g => `${g.gameType} (${Math.round(g.confidence * 100)}%)`));

          enhancedHtml = injectMiniGames(enhancedHtml, { autoDetect: true });
          onProgress?.('complete', 100, `✅ Presentation complete with ${detectedGames.length} mini-game(s)`);
        } else {
          onProgress?.('complete', 100, '✅ Presentation generated successfully');
        }

        return enhancedHtml;
      } catch (miniGameError) {
        console.warn('⚠️ [Claude] Failed to inject mini-games, returning presentation without them:', miniGameError);
        onProgress?.('complete', 100, '✅ Presentation generated (mini-games skipped)');
        return enhancedHtml;
      }
    } catch (error: any) {
      console.error('❌ Claude generation error:', error);

      onProgress?.('error', 0, `❌ Error: ${error.message}`, error);

      // Re-throw with user-friendly message
      throw new Error(
        error.message ||
        'Failed to generate presentation with Claude. Please check your API key and try again.'
      );
    }
  }

  /**
   * Refine existing presentation using Claude with streaming
   */
  async refine(
    currentHtml: string,
    instruction: string,
    modelId?: string,
    onProgress?: ProgressCallback
  ): Promise<string> {
    try {
      onProgress?.('starting', 0, '🔐 Validating Anthropic API key...');

      const apiKey = this.config.getApiKey();
      const model = modelId || 'claude-sonnet-4-5-20250929';

      onProgress?.('starting', 5, '✅ API key validated');
      onProgress?.('claude', 10, '🟡 Preparing refinement request...');

      // Apply compression and truncation from BaseProvider
      const { html: truncatedHtml, wasTruncated } = this.truncateHtmlForRefinement(
        currentHtml,
        60000 // Conservative limit for Claude (1M context available)
      );

      if (wasTruncated) {
        onProgress?.('claude', 15, '⚠️ HTML truncated to fit context window');
      }

      // Log usage warnings
      this.logUsageWarnings(
        truncatedHtml.length,
        instruction.length,
        1000000, // 1M token context window
        model
      );

      onProgress?.('claude', 20, '📋 Building refinement prompt...');

      const refinementPrompt = `You are refining an existing medical education presentation.

CURRENT HTML:
${truncatedHtml}

REFINEMENT INSTRUCTION:
${instruction}

REQUIREMENTS:
- Modify the HTML according to the instruction
- Maintain the overall structure and styling
- Preserve all Tailwind CSS classes and CDN links
- Keep the presentation self-contained
- Return the COMPLETE modified HTML document
- Do NOT add explanations - return only the HTML

Return the refined HTML:`;

      onProgress?.('claude', 25, '🚀 Sending refinement request with streaming...');

      let accumulatedText = '';
      let lastProgress = 25;

      await this.makeRequestWithRetry(async () => {
        const stream = await this.client.messages.stream({
          model: model,
          max_tokens: 16384,
          messages: [
            {
              role: 'user',
              content: refinementPrompt,
            },
          ],
          temperature: 0.5, // Lower temperature for refinement
        });

        // Handle streaming events
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            accumulatedText += event.delta.text;

            // Update progress
            const estimatedProgress = Math.min(25 + (accumulatedText.length / 200), 95);
            if (estimatedProgress > lastProgress + 5) {
              const kb = Math.round(accumulatedText.length / 1024);
              onProgress?.('claude', estimatedProgress, `📥 Refining... (${kb}KB)`, undefined, accumulatedText);
              lastProgress = estimatedProgress;
            }
          }
        }

        return accumulatedText;
      }, onProgress);

      onProgress?.('claude', 95, '✅ Refinement complete');

      // Validate we have accumulated content
      if (!accumulatedText || accumulatedText.trim().length === 0) {
        throw new Error('No content received from Claude API during refinement.');
      }

      console.log(`📊 [Claude Refine] Received ${accumulatedText.length} chars from stream`);

      // Detect response type (JSON vs HTML) - though refinement should always be HTML
      const trimmed = accumulatedText.trim();
      const looksLikeJson = trimmed.startsWith('{') || trimmed.startsWith('[') ||
                           /^```json\s*\{/.test(trimmed) || /^```json\s*\[/.test(trimmed);

      // If it's unexpectedly JSON, return it directly
      if (looksLikeJson) {
        console.warn('⚠️ [Claude Refine] Received JSON instead of HTML (unexpected)');
        const jsonStripped = accumulatedText
          .replace(/^```json\s*/, '')
          .replace(/^```\s*/, '')
          .replace(/```\s*$/, '')
          .trim();
        onProgress?.('complete', 100, '⚠️ Received JSON instead of HTML');
        return jsonStripped;
      }

      // Extract HTML
      onProgress?.('claude', 98, '📄 Extracting refined HTML...');
      let refinedHtml = '';

      // Try 1: Extract from markdown code blocks first
      const codeBlockMatch = accumulatedText.match(/```(?:html)?\s*(<!DOCTYPE[\s\S]*?<\/html>|<html[\s\S]*?<\/html>)\s*```/i);
      if (codeBlockMatch) {
        console.log('✅ [Claude Refine] Extracted HTML from code block');
        refinedHtml = codeBlockMatch[1];
      } else {
        // Try 2: Complete HTML document (with closing tag)
        const completeHtmlMatch = accumulatedText.match(/<!DOCTYPE html>[\s\S]*?<\/html>/i) ||
                                  accumulatedText.match(/<html[\s\S]*?<\/html>/i);
        if (completeHtmlMatch) {
          console.log('✅ [Claude Refine] Found complete HTML document');
          refinedHtml = completeHtmlMatch[0];
        } else {
          // Try 3: Partial HTML (DOCTYPE to end, even if incomplete)
          const partialHtmlMatch = accumulatedText.match(/(<!DOCTYPE html>[\s\S]*)/i);
          if (partialHtmlMatch) {
            console.warn('⚠️ [Claude Refine] HTML appears incomplete, attempting to repair...');
            let partial = partialHtmlMatch[0];

            // Auto-close common unclosed tags
            if (!partial.includes('</html>')) {
              if (!partial.includes('</body>')) {
                partial += '\n</body>';
              }
              partial += '\n</html>';
            }

            refinedHtml = partial;
            console.log('✅ [Claude Refine] Repaired incomplete HTML');
          } else {
            // Try 4: Look for <html> tag without DOCTYPE
            const htmlTagMatch = accumulatedText.match(/(<html[\s\S]*)/i);
            if (htmlTagMatch) {
              console.warn('⚠️ [Claude Refine] Found HTML without DOCTYPE, adding it...');
              let partial = htmlTagMatch[0];

              // Auto-close if needed
              if (!partial.includes('</html>')) {
                if (!partial.includes('</body>')) {
                  partial += '\n</body>';
                }
                partial += '\n</html>';
              }

              refinedHtml = '<!DOCTYPE html>\n' + partial;
              console.log('✅ [Claude Refine] Added DOCTYPE to HTML');
            } else {
              // Try 5: Last resort - look for body content
              const bodyMatch = accumulatedText.match(/<body[\s\S]*?<\/body>/i);
              if (bodyMatch) {
                console.warn('⚠️ [Claude Refine] Only found body tag, creating minimal HTML wrapper');
                refinedHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"></script></head>${bodyMatch[0]}</html>`;
              } else {
                // Try 6: Ultra last resort - look for ANY body tag (even unclosed)
                const partialBodyMatch = accumulatedText.match(/(<body[\s\S]*)/i);
                if (partialBodyMatch) {
                  console.warn('⚠️ [Claude Refine] Found unclosed body tag, attempting rescue...');
                  let bodyContent = partialBodyMatch[0];
                  if (!bodyContent.includes('</body>')) {
                    bodyContent += '\n</body>';
                  }
                  refinedHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"></script></head>${bodyContent}</html>`;
                  console.log('✅ [Claude Refine] Salvaged partial HTML content');
                } else {
                  console.error('❌ [Claude Refine] No HTML structure found in response');
                  console.error(`First 500 chars: ${accumulatedText.substring(0, 500)}`);
                  throw new Error('No valid HTML found in Claude refinement response. Response may be incomplete or malformed.');
                }
              }
            }
          }
        }
      }

      onProgress?.('complete', 100, '✅ Presentation refined successfully');

      return refinedHtml;
    } catch (error: any) {
      console.error('❌ Claude refinement error:', error);

      onProgress?.('error', 0, `❌ Error: ${error.message}`, error);

      throw new Error(
        error.message ||
        'Failed to refine presentation with Claude. Please try again.'
      );
    }
  }
}
