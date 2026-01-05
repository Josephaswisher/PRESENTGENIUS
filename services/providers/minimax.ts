/**
 * MiniMax Provider - Direct API Access
 * Models: MiniMax-M2.1, MiniMax-M2.1-lightning (all 200K context)
 * Endpoint: https://api.minimax.io/v1/text/chatcompletion_v2
 */

import { BaseProvider, FileInput, GenerationOptions, ProgressCallback } from './base-provider';

export class MiniMaxProvider extends BaseProvider {
  constructor() {
    super({
      endpoint: 'https://api.minimax.io/v1/text/chatcompletion_v2',
      getApiKey: () => {
        // Support both VITE_ prefixed and alternative naming (minimax_api_key)
        const key = import.meta.env.VITE_MINIMAX_API_KEY || import.meta.env.minimax_api_key;
        if (!key) {
          const error: any = new Error(
            'MiniMax API key is not configured. Please add it to your .env.local file and restart the app.'
          );
          error.validation = {
            isValid: false,
            suggestions: [
              'Create or edit .env.local in your project root',
              'Add this line: VITE_MINIMAX_API_KEY=eyJ-your-jwt-token-here',
              'Get your API key (JWT format) from https://platform.minimax.io/user-center/api-key',
              'Restart the development server: npm run dev',
            ],
          };
          throw error;
        }
        return key;
      },
      modelId: 'MiniMax-M2.1',
    });
  }

  /**
   * Parse Server-Sent Events (SSE) stream from MiniMax API
   * Uses OpenAI-compatible format: data: {"choices":[{"delta":{"content":"text"}}]}
   */
  private async parseSSEStream(
    response: Response,
    onProgress?: ProgressCallback,
    startProgress: number = 30,
    phase: string = 'minimax'
  ): Promise<string> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Response body is not readable');

    const decoder = new TextDecoder();
    let accumulatedText = '';
    let buffer = '';
    let lastProgress = startProgress;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();

          if (data === '[DONE]') {
            console.log(`[MiniMax] Stream complete: ${accumulatedText.length} chars`);
            return accumulatedText;
          }

          try {
            const chunk = JSON.parse(data);
            const content = chunk.choices?.[0]?.delta?.content || '';

            if (content) {
              accumulatedText += content;
              // Log each chunk for debugging
              if (accumulatedText.length % 500 < 100) {
                console.log(`[MiniMax] 📥 Chunk received, total: ${accumulatedText.length} chars`);
              }

              // Update progress more frequently for visible streaming
              const currentProgress = Math.min(
                startProgress + Math.floor(accumulatedText.length / 200),
                95
              );

              // Update every 2% (was 5%) for more visible streaming progress
              if (currentProgress > lastProgress + 2) {
                const kb = Math.round(accumulatedText.length / 1024);
                console.log(`[MiniMax] 📥 Streaming progress: ${currentProgress}% (${kb}KB received)`);
                onProgress?.(
                  phase,
                  currentProgress,
                  `📥 Streaming... (${kb}KB received)`,
                  undefined,
                  accumulatedText  // Real-time preview
                );
                lastProgress = currentProgress;
              }
            }

            // Check for completion
            if (chunk.choices?.[0]?.finish_reason) {
              console.log(`[MiniMax] Stream finished: ${chunk.choices[0].finish_reason}`);
              return accumulatedText;
            }
          } catch (parseError) {
            console.warn('[MiniMax] SSE parse error:', line.substring(0, 100), parseError);
            continue;
          }
        }
      }

      return accumulatedText;
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Generate new presentation using MiniMax API
   *
   * @deprecated Direct usage deprecated. Use generateParallelCourse() instead.
   * This method is now only called internally by the parallel generation pipeline.
   */
  async generate(
    prompt: string,
    files: FileInput[] = [],
    options: GenerationOptions = {},
    onProgress?: ProgressCallback
  ): Promise<string> {
    try {
      onProgress?.('starting', 0, '🔐 Validating MiniMax API key...');

      const apiKey = this.config.getApiKey();
      const modelId = options.modelId || 'MiniMax-M2.1';

      onProgress?.('starting', 3, '✅ API key validated successfully');
      onProgress?.('starting', 5, `🎯 Selected model: ${modelId}`);

      onProgress?.('minimax', 8, '⚡ Initializing MiniMax connection...');
      onProgress?.('minimax', 10, '📋 Building system prompt...');

      // Build messages array
      const messages: any[] = [
        {
          role: 'system',
          content: `🚨 CRITICAL: You MUST return complete HTML with Tailwind CSS classes. NO plain text, NO markdown, ONLY HTML.

You are an expert medical educator creating interactive HTML presentations.

MANDATORY OUTPUT FORMAT - THIS IS NON-NEGOTIABLE:
1. Start with: <!DOCTYPE html>
2. DO NOT include Tailwind CDN script tag (styles are pre-loaded)
3. Use Tailwind classes for ALL styling (bg-gradient-to-br, text-4xl, p-8, rounded-xl, etc.)
4. Structure as <section> tags with Tailwind classes
5. NO plain text - ONLY HTML with Tailwind classes

REQUIRED STRUCTURE:
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Presentation Title</title>
</head>
<body class="bg-slate-950">
    <section class="min-h-screen p-12 bg-gradient-to-br from-slate-900 to-slate-800">
        <div class="max-w-4xl mx-auto">
            <h2 class="text-5xl font-black text-cyan-400 mb-8">Slide Title</h2>
            <div class="space-y-6">
                <!-- Content with Tailwind classes -->
            </div>
        </div>
    </section>
</body>
</html>

TAILWIND REQUIREMENTS:
- Large headings: text-4xl, text-5xl, text-6xl, font-black
- Colors: cyan-400, blue-400, slate-300, green-500, yellow-500, red-500
- Spacing: p-8, p-12, space-y-6, space-y-8, mb-8
- Backgrounds: bg-gradient-to-br, from-slate-900, to-slate-800
- Cards: bg-slate-800/50, rounded-2xl, backdrop-blur-sm
- Text: text-white, text-slate-300
${options.learnerLevel ? `- Target audience: ${options.learnerLevel}` : ''}
${options.activityId ? `- Activity type: ${options.activityId}` : ''}

SLIDE EXAMPLE STRUCTURE:
<section>
  <h1>Slide Title</h1>
  <p>Content for this slide...</p>
  <ul><li>Key point 1</li><li>Key point 2</li></ul>
</section>

<section>
  <h2>Next Slide Title</h2>
  <p>Different content...</p>
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
- Don't make it overly complex (balance wow factor with usability)`,
        },
      ];

      onProgress?.('minimax', 12, '✅ System prompt configured');

      // Handle images if provided
      if (files.length > 0) {
        onProgress?.(
          'minimax',
          15,
          `📸 Processing ${files.length} image${files.length > 1 ? 's' : ''}...`
        );
        const content: any[] = [{ type: 'text', text: prompt }];

        for (const file of files) {
          if (file.mimeType.startsWith('image/')) {
            onProgress?.('minimax', 17, `🖼️ Encoding image: ${file.mimeType}`);
            content.push({
              type: 'image_url',
              image_url: {
                url: `data:${file.mimeType};base64,${file.base64}`,
              },
            });
          }
        }

        messages.push({ role: 'user', content });
        onProgress?.('minimax', 20, `✅ ${files.length} image(s) encoded`);
      } else {
        messages.push({ role: 'user', content: prompt });
        onProgress?.('minimax', 18, '📝 User prompt added to messages');
      }

      onProgress?.('minimax', 22, `📊 Request size: ${JSON.stringify(messages).length} characters`);
      onProgress?.('minimax', 24, '🧠 Enabling reasoning mode for better quality...');
      onProgress?.('minimax', 25, '🔗 Establishing connection to MiniMax API...');

      let content = '';

      // Try streaming first (OpenAI-compatible SSE format)
      try {
        onProgress?.('minimax', 28, '🚀 Using streaming mode...');
        console.log('[MiniMax] Attempting SSE streaming...');

        const streamResponse = await fetch(this.config.endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelId,
            messages,
            temperature: 0.7,
            stream: true,  // Enable SSE streaming
            reasoning: true,
          }),
        });

        if (!streamResponse.ok) {
          throw new Error(`HTTP ${streamResponse.status}: ${await streamResponse.text()}`);
        }

        content = await this.parseSSEStream(streamResponse, onProgress, 30, 'minimax');
        console.log(`[MiniMax] Streaming successful: ${content.length} chars`);

      } catch (streamError: any) {
        console.warn('[MiniMax] Streaming failed, using standard mode:', streamError.message);
        onProgress?.('minimax', 28, '📡 Using standard mode...');

        // Fallback to non-streaming
        const requestFn = async () => {
          onProgress?.('minimax', 30, '📡 Sending request to MiniMax...');
          onProgress?.('minimax', 35, '🤔 AI is reasoning through your request...');

          const response = await fetch(this.config.endpoint, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: modelId,
              messages,
              temperature: 0.7,
              reasoning: true,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ [MiniMax] API Error:', {
              status: response.status,
              error: errorData,
            });
            const error: any = new Error(
              errorData.error?.message || `MiniMax API returned error status ${response.status}`
            );
            error.status = response.status;
            error.statusCode = response.status;
            throw error;
          }

          onProgress?.('minimax', 60, '📥 Receiving response from MiniMax...');
          onProgress?.('minimax', 65, '📦 Downloading response data...');
          return response.json();
        };

        const data = await this.makeRequestWithRetry(requestFn, onProgress);

        onProgress?.('processing', 75, '🔍 Analyzing response structure...');
        onProgress?.('processing', 78, '📝 Extracting HTML content...');

        // Log reasoning details if available (MiniMax interleaved thinking)
        const reasoningDetails = data.choices?.[0]?.message?.reasoning_details;
        if (reasoningDetails) {
          onProgress?.('processing', 80, `🧠 AI used ${reasoningDetails.thinking_tokens || 0} reasoning tokens`);
          console.log('🧠 [MiniMax Reasoning]:', {
            thinkingTokens: reasoningDetails.thinking_tokens,
            reasoningSteps: reasoningDetails.steps?.length || 0,
          });
        }

        content = data.choices?.[0]?.message?.content || '';
      }
      onProgress?.('processing', 85, `✅ Received ${content.length} characters`);

      onProgress?.('processing', 88, '🔎 Searching for HTML code blocks...');
      const htmlMatch =
        content.match(/```html\n?([\s\S]*?)```/) || content.match(/<!DOCTYPE[\s\S]*<\/html>/i);
      const result = htmlMatch ? (htmlMatch[1] || htmlMatch[0]).trim() : content;

      onProgress?.('processing', 92, '✅ HTML extracted successfully');

      // Validate Tailwind CSS presence
      const hasTailwind = /class="[^"]*(?:text-|bg-|p-|rounded-|flex|grid|space-|gap-)/i.test(result);
      const hasTailwindCDN = result.includes('cdn.tailwindcss.com');

      if (!hasTailwind || !hasTailwindCDN) {
        console.warn('⚠️ [MiniMax] Generated HTML may be missing Tailwind CSS!', {
          hasTailwindClasses: hasTailwind,
          hasTailwindCDN: hasTailwindCDN,
          sampleStart: result.substring(0, 500)
        });
        onProgress?.('processing', 93, '⚠️ Warning: Output may be missing Tailwind styling');
      } else {
        onProgress?.('processing', 93, '✅ Tailwind CSS detected in output');
      }

      onProgress?.('processing', 95, `📏 Final HTML size: ${result.length} characters`);

      onProgress?.('complete', 100, '✅ Generation complete!');
      return result;
    } catch (error: any) {
      this.handleProviderError(error, 'MiniMax');
    }
  }

  /**
   * Refine existing presentation using MiniMax API
   *
   * @deprecated Direct usage deprecated. Refinement now uses generateParallelCourse().
   * This method is kept for legacy compatibility but should not be called directly.
   */
  async refine(
    currentHtml: string,
    instruction: string,
    modelId: string = 'MiniMax-M2.1',
    onProgress?: ProgressCallback
  ): Promise<string> {
    try {
      onProgress?.('starting', 0, '🔐 Validating MiniMax API key...');

      const apiKey = this.config.getApiKey();

      onProgress?.('starting', 3, '✅ API key validated');
      onProgress?.('processing', 5, `📏 Original HTML size: ${currentHtml.length} characters`);

      // OPTIMIZATION 1 & 2: Compress & truncate, then log usage warnings
      onProgress?.('processing', 8, '🗜️ Compressing HTML content...');
      const { html: processedHtml, wasTruncated } = this.truncateHtmlForRefinement(
        currentHtml,
        80000
      );

      onProgress?.('processing', 10, `✅ Compressed to ${processedHtml.length} characters`);

      this.logUsageWarnings(
        processedHtml.length,
        instruction.length,
        200000, // MiniMax 200K context limit
        modelId
      );

      if (wasTruncated) {
        console.warn(`⚠️ [MiniMax] Content truncated to prevent payload errors`);
        onProgress?.('processing', 12, '⚠️ Content truncated to fit size limits');
      } else {
        onProgress?.('processing', 12, '✅ Content fits within size limits');
      }

      onProgress?.('minimax', 15, '📋 Building refinement prompt...');

      const messages = [
        {
          role: 'system',
          content: `🚨 CRITICAL: You MUST return complete HTML with Tailwind CSS classes. NO plain text, NO markdown, ONLY HTML.

You are Dr. Swisher's Lecture Copilot, an expert at refining interactive medical education HTML presentations.

MANDATORY OUTPUT FORMAT - THIS IS NON-NEGOTIABLE:
1. Start with: <!DOCTYPE html>
2. DO NOT include Tailwind CDN script tag (styles are pre-loaded)
3. Use Tailwind classes for ALL styling (bg-gradient-to-br, text-4xl, p-8, rounded-xl, etc.)
4. Structure as <section> tags with Tailwind classes
5. NO plain text - ONLY HTML with Tailwind classes

TAILWIND REQUIREMENTS (MANDATORY):
- Large headings: text-4xl, text-5xl, text-6xl, font-black
- Colors: cyan-400, blue-400, slate-300, green-500, yellow-500, red-500
- Spacing: p-8, p-12, space-y-6, space-y-8, mb-8
- Backgrounds: bg-gradient-to-br, from-slate-900, to-slate-800
- Cards: bg-slate-800/50, rounded-2xl, backdrop-blur-sm
- Text: text-white, text-slate-300

REFINEMENT GUIDELINES:
- Modify the HTML according to the user's instructions
- Maintain medical accuracy and educational value
- PRESERVE all Tailwind CSS styling and structure unless specifically asked to change it
- If adding new content, use the same Tailwind styling patterns
- Keep the premium, professional medical aesthetic
- Return ONLY the complete modified HTML document (no explanations or markdown formatting)
${wasTruncated ? '- NOTE: The HTML was truncated for transmission. Make refinements based on the visible content and preserve the overall structure.' : ''}

CAPABILITIES:
- Direct HTML refinement (text, styling, layout changes)
- Medical content updates and corrections
- UI/UX improvements with Tailwind classes
- Adding or removing sections based on requests

Always prioritize clarity, medical accuracy, educational effectiveness, and TAILWIND CSS STYLING.`,
        },
        {
          role: 'user',
          content: `Current HTML${wasTruncated ? ' (truncated to fit size limits)' : ''}:\n\n${processedHtml}\n\n---\n\nUser's refinement request: ${instruction}\n\nReturn the updated HTML:`,
        },
      ];

      onProgress?.('minimax', 18, '✅ Prompt configured');
      onProgress?.('minimax', 20, '🧠 Enabling reasoning mode...');
      onProgress?.('minimax', 22, '🔗 Connecting to MiniMax API...');

      let content = '';

      // Try streaming first (OpenAI-compatible SSE format)
      try {
        onProgress?.('minimax', 24, '🚀 Using streaming mode...');
        console.log('[MiniMax] Attempting SSE streaming for refinement...');

        const streamResponse = await fetch(this.config.endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelId,
            messages,
            temperature: 0.5,
            stream: true,  // Enable SSE streaming
            reasoning: true,
          }),
        });

        if (!streamResponse.ok) {
          throw new Error(`HTTP ${streamResponse.status}: ${await streamResponse.text()}`);
        }

        content = await this.parseSSEStream(streamResponse, onProgress, 27, 'minimax');
        console.log(`[MiniMax] Refinement streaming successful: ${content.length} chars`);

      } catch (streamError: any) {
        console.warn('[MiniMax] Refinement streaming failed, using standard mode:', streamError.message);
        onProgress?.('minimax', 24, '📡 Using standard mode...');

        // Fallback to non-streaming
        const requestFn = async () => {
          onProgress?.('minimax', 25, '🎨 Sending refinement request...');
          onProgress?.('minimax', 30, '🤔 AI is reasoning through refinement...');

          const response = await fetch(this.config.endpoint, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: modelId,
              messages,
              temperature: 0.5,
              reasoning: true,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ [MiniMax] Refinement Error:', errorData);
            const error: any = new Error(
              errorData.error?.message || `MiniMax API returned error status ${response.status}`
            );
            error.status = response.status;
            error.statusCode = response.status;
            throw error;
          }

          onProgress?.('minimax', 60, '📥 Receiving refined content...');
          onProgress?.('minimax', 65, '📦 Downloading response...');
          return response.json();
        };

        const data = await this.makeRequestWithRetry(requestFn, onProgress);

        onProgress?.('processing', 75, '🔍 Analyzing refined response...');
        onProgress?.('processing', 78, '📝 Extracting updated HTML...');

        // Log reasoning details if available (MiniMax interleaved thinking)
        const reasoningDetails = data.choices?.[0]?.message?.reasoning_details;
        if (reasoningDetails) {
          onProgress?.('processing', 80, `🧠 AI used ${reasoningDetails.thinking_tokens || 0} reasoning tokens`);
          console.log('🧠 [MiniMax Reasoning - Refine]:', {
            thinkingTokens: reasoningDetails.thinking_tokens,
            reasoningSteps: reasoningDetails.steps?.length || 0,
            instruction: instruction.substring(0, 50) + '...',
          });
        }

        content = data.choices?.[0]?.message?.content || '';
      }
      onProgress?.('processing', 85, `✅ Received ${content.length} characters`);

      onProgress?.('processing', 88, '🔎 Parsing HTML code blocks...');
      const htmlMatch =
        content.match(/```html\n?([\s\S]*?)```/) || content.match(/<!DOCTYPE[\s\S]*<\/html>/i);
      const result = htmlMatch ? (htmlMatch[1] || htmlMatch[0]).trim() : content;

      onProgress?.('processing', 92, '✅ HTML parsed successfully');

      // Validate Tailwind CSS presence
      const hasTailwind = /class="[^"]*(?:text-|bg-|p-|rounded-|flex|grid|space-|gap-)/i.test(result);
      const hasTailwindCDN = result.includes('cdn.tailwindcss.com');

      if (!hasTailwind || !hasTailwindCDN) {
        console.warn('⚠️ [MiniMax] Refined HTML may be missing Tailwind CSS!', {
          hasTailwindClasses: hasTailwind,
          hasTailwindCDN: hasTailwindCDN,
          sampleStart: result.substring(0, 500)
        });
        onProgress?.('processing', 93, '⚠️ Warning: Output may be missing Tailwind styling');
      } else {
        onProgress?.('processing', 93, '✅ Tailwind CSS detected in output');
      }

      onProgress?.('processing', 95, `📏 Final size: ${result.length} characters`);

      onProgress?.('complete', 100, '✅ Refinement complete!');
      return result;
    } catch (error: any) {
      this.handleProviderError(error, 'MiniMax');
    }
  }
}
