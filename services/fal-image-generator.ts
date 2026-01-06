/**
 * FAL AI Image Generation Service
 * Generates images using FAL API for presentations
 *
 * ⚠️ STATUS: DISABLED (January 2026)
 * This service is currently disabled in favor of inline SVG graphics generation.
 * External image API calls have been removed from parallel-generation.ts.
 *
 * This file is preserved for potential future use if external image generation
 * is needed again. To re-enable:
 * 1. Uncomment the import in parallel-generation.ts (line 16)
 * 2. Uncomment the generateChapterImages() call (lines 155-167)
 * 3. Update the imageUrlsText to use external images instead of SVG guidelines
 */

// FAL API Configuration
const FAL_API_KEYS = [
  '298951cb-ac74-4887-a520-d0d429ededa9:989faefcba6b2115871622a362764b37',
  'b1ff02e6-0af0-4b6d-b3f4-25d013506ce2:b821ae0cbe5c70ab3cac79c7951e2883'
];

let currentKeyIndex = 0;

function getCurrentApiKey(): string {
  return FAL_API_KEYS[currentKeyIndex];
}

function rotateApiKey(): void {
  currentKeyIndex = (currentKeyIndex + 1) % FAL_API_KEYS.length;
  console.log(`[FAL] Rotated to API key ${currentKeyIndex + 1}`);
}

export interface ImageGenerationOptions {
  prompt: string;
  style?: 'icon' | 'illustration' | 'photo' | 'diagram' | 'medical';
  aspectRatio?: '1:1' | '16:9' | '4:3' | '3:2';
  size?: 'small' | 'medium' | 'large';
}

export interface GeneratedImage {
  url: string;
  prompt: string;
  width: number;
  height: number;
}

/**
 * Generate an image using FAL AI
 */
export async function generateImage(
  options: ImageGenerationOptions
): Promise<GeneratedImage> {
  const { prompt, style = 'illustration', aspectRatio = '1:1', size = 'medium' } = options;

  console.log(`[FAL] Generating image: "${prompt}" (${style}, ${aspectRatio})`);

  // Enhance prompt based on style
  const enhancedPrompt = enhancePrompt(prompt, style);

  // Determine image dimensions
  const dimensions = getDimensions(aspectRatio, size);

  try {
    const apiKey = getCurrentApiKey();

    // Use FAL's flux-schnell model for fast generation
    const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: enhancedPrompt,
        image_size: getImageSize(aspectRatio, size),
        num_inference_steps: 4, // Fast generation
        num_images: 1,
        enable_safety_checker: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[FAL] API Error:', response.status, errorText);

      // Try rotating API key on auth errors
      if (response.status === 401 || response.status === 403) {
        rotateApiKey();
        throw new Error('API key error, rotated to next key');
      }

      throw new Error(`FAL API error: ${response.status}`);
    }

    const result = await response.json();

    if (!result.images || result.images.length === 0) {
      throw new Error('No images returned from FAL API');
    }

    const imageUrl = result.images[0].url;

    console.log(`✅ [FAL] Image generated successfully: ${imageUrl.substring(0, 50)}...`);

    return {
      url: imageUrl,
      prompt: enhancedPrompt,
      width: dimensions.width,
      height: dimensions.height,
    };
  } catch (error: any) {
    console.error('[FAL] Generation failed:', error.message);

    // If it's an API key rotation, retry once
    if (error.message.includes('rotated to next key')) {
      console.log('[FAL] Retrying with new API key...');
      return generateImage(options); // Retry with rotated key
    }

    // Return a fallback placeholder
    return {
      url: createPlaceholderDataUrl(prompt, dimensions.width, dimensions.height),
      prompt,
      width: dimensions.width,
      height: dimensions.height,
    };
  }
}

/**
 * Generate multiple images in parallel
 */
export async function generateImages(
  prompts: ImageGenerationOptions[]
): Promise<GeneratedImage[]> {
  console.log(`[FAL] Generating ${prompts.length} images in parallel...`);

  const promises = prompts.map(options => generateImage(options));
  const results = await Promise.all(promises);

  console.log(`✅ [FAL] Generated ${results.length} images`);
  return results;
}

/**
 * Enhance prompt based on style
 */
function enhancePrompt(prompt: string, style: string): string {
  const styleEnhancements: Record<string, string> = {
    icon: 'flat design icon, simple, clean, minimal, vector style, no background, centered',
    illustration: 'professional illustration, clean design, educational, medical illustration style',
    photo: 'professional photography, high quality, well-lit, medical photography',
    diagram: 'technical diagram, clear labels, educational, schematic style, clean lines',
    medical: 'medical illustration, anatomically accurate, educational, professional medical textbook style',
  };

  const enhancement = styleEnhancements[style] || styleEnhancements.illustration;
  return `${prompt}, ${enhancement}`;
}

/**
 * Get image size string for FAL API
 */
function getImageSize(aspectRatio: string, size: string): string {
  const sizes: Record<string, Record<string, string>> = {
    '1:1': {
      small: 'square_hd',
      medium: 'square_hd',
      large: 'square_hd',
    },
    '16:9': {
      small: 'landscape_4_3',
      medium: 'landscape_16_9',
      large: 'landscape_16_9',
    },
    '4:3': {
      small: 'landscape_4_3',
      medium: 'landscape_4_3',
      large: 'landscape_4_3',
    },
    '3:2': {
      small: 'landscape_4_3',
      medium: 'landscape_4_3',
      large: 'landscape_4_3',
    },
  };

  return sizes[aspectRatio]?.[size] || 'square_hd';
}

/**
 * Get pixel dimensions for aspect ratio and size
 */
function getDimensions(aspectRatio: string, size: string): { width: number; height: number } {
  const dimensions: Record<string, Record<string, { width: number; height: number }>> = {
    '1:1': {
      small: { width: 512, height: 512 },
      medium: { width: 768, height: 768 },
      large: { width: 1024, height: 1024 },
    },
    '16:9': {
      small: { width: 640, height: 360 },
      medium: { width: 1024, height: 576 },
      large: { width: 1920, height: 1080 },
    },
    '4:3': {
      small: { width: 640, height: 480 },
      medium: { width: 1024, height: 768 },
      large: { width: 1600, height: 1200 },
    },
    '3:2': {
      small: { width: 600, height: 400 },
      medium: { width: 1050, height: 700 },
      large: { width: 1500, height: 1000 },
    },
  };

  return dimensions[aspectRatio]?.[size] || { width: 768, height: 768 };
}

/**
 * Create a fallback placeholder SVG data URL
 */
function createPlaceholderDataUrl(text: string, width: number, height: number): string {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#1e293b"/>
      <text
        x="50%"
        y="50%"
        font-family="Arial, sans-serif"
        font-size="16"
        fill="#94a3b8"
        text-anchor="middle"
        dominant-baseline="middle"
      >
        ${text.substring(0, 30)}...
      </text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Extract image prompts from chapter content
 * This analyzes the chapter to suggest appropriate images
 */
export function extractImagePrompts(
  chapterTitle: string,
  chapterDescription: string,
  keyTopics: string[],
  interactionType: string
): ImageGenerationOptions[] {
  const prompts: ImageGenerationOptions[] = [];

  // Header/hero image for the chapter
  prompts.push({
    prompt: `${chapterTitle} - medical education header image showing ${keyTopics[0]}`,
    style: 'medical',
    aspectRatio: '16:9',
    size: 'medium',
  });

  // Icon for interaction type
  if (interactionType === 'quiz') {
    prompts.push({
      prompt: 'quiz question mark icon',
      style: 'icon',
      aspectRatio: '1:1',
      size: 'small',
    });
  } else if (interactionType === 'case-study') {
    prompts.push({
      prompt: 'medical case study patient chart icon',
      style: 'icon',
      aspectRatio: '1:1',
      size: 'small',
    });
  } else if (interactionType === 'diagram') {
    prompts.push({
      prompt: 'anatomical diagram icon',
      style: 'icon',
      aspectRatio: '1:1',
      size: 'small',
    });
  } else if (interactionType === 'decision-tree') {
    prompts.push({
      prompt: 'clinical decision tree flowchart icon',
      style: 'icon',
      aspectRatio: '1:1',
      size: 'small',
    });
  }

  // Topic-specific images (up to 2)
  keyTopics.slice(0, 2).forEach(topic => {
    prompts.push({
      prompt: `${topic} medical illustration`,
      style: 'medical',
      aspectRatio: '4:3',
      size: 'medium',
    });
  });

  return prompts;
}

/**
 * Batch generate images for a chapter with rate limiting
 */
export async function generateChapterImages(
  chapterTitle: string,
  chapterDescription: string,
  keyTopics: string[],
  interactionType: string
): Promise<Record<string, GeneratedImage>> {
  console.log(`[FAL] Generating images for chapter: "${chapterTitle}"`);

  const prompts = extractImagePrompts(chapterTitle, chapterDescription, keyTopics, interactionType);

  // Generate images with slight delays to avoid rate limiting
  const images: GeneratedImage[] = [];
  for (let i = 0; i < prompts.length; i++) {
    const image = await generateImage(prompts[i]);
    images.push(image);

    // Small delay between requests
    if (i < prompts.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Return as a keyed object
  return {
    hero: images[0],
    icon: images[1],
    topic1: images[2],
    topic2: images[3],
  };
}
