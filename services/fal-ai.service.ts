/**
 * FAL AI Image Generation Service
 * Creates medical diagrams, anatomical illustrations, and visual aids
 */

export interface ImageGenerationRequest {
  prompt: string;
  style?: ImageStyle;
  size?: ImageSize;
  model?: FALModel;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  style: ImageStyle;
  size: ImageSize;
  createdAt: string;
}

export type ImageStyle =
  | 'medical-diagram'
  | 'anatomical'
  | 'flowchart'
  | 'infographic'
  | 'clinical-photo'
  | 'microscopy'
  | 'radiology';

export type ImageSize = '1024x1024' | '1024x768' | '768x1024' | '1920x1080';

export type FALModel = 'flux-pro' | 'flux-dev' | 'stable-diffusion-v3';

// Style-specific prompt enhancements
const STYLE_PROMPTS: Record<ImageStyle, string> = {
  'medical-diagram':
    'professional medical illustration, clean lines, labeled diagram, educational style, high detail, white background',
  'anatomical':
    'anatomical illustration, medical textbook quality, cross-section view, detailed labeling, scientific accuracy',
  'flowchart':
    'clinical algorithm flowchart, decision tree, clean modern design, medical guideline format, clear arrows and boxes',
  'infographic':
    'medical infographic, data visualization, healthcare statistics, clean modern design, professional color palette',
  'clinical-photo':
    'clinical photography style, medical documentation, professional lighting, neutral background, educational purpose',
  'microscopy':
    'microscopy view, histology slide, cellular detail, scientific visualization, laboratory photography',
  'radiology':
    'medical imaging style, radiograph visualization, diagnostic imaging, professional medical format',
};

// Default model configurations
const MODEL_CONFIGS: Record<FALModel, { quality: string; speed: string }> = {
  'flux-pro': { quality: 'highest', speed: 'medium' },
  'flux-dev': { quality: 'good', speed: 'fast' },
  'stable-diffusion-v3': { quality: 'high', speed: 'medium' },
};

/**
 * Get FAL API key from environment
 */
function getFALKey(): string | null {
  // Check various environment variable names
  return (
    (typeof process !== 'undefined' && process.env?.FAL_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FAL_KEY) ||
    localStorage.getItem('fal-api-key') ||
    null
  );
}

/**
 * Check if FAL AI is configured
 */
export function isFALConfigured(): boolean {
  return getFALKey() !== null;
}

/**
 * Build the full prompt with style enhancements
 */
export function buildPrompt(request: ImageGenerationRequest): string {
  const styleEnhancement = STYLE_PROMPTS[request.style || 'medical-diagram'];
  return `${request.prompt}, ${styleEnhancement}`;
}

/**
 * Generate an image using FAL AI
 * Note: This is a client-side implementation. For production, use server-side API calls.
 */
export async function generateImage(
  request: ImageGenerationRequest
): Promise<GeneratedImage | null> {
  const apiKey = getFALKey();

  if (!apiKey) {
    console.warn('FAL AI not configured. Set VITE_FAL_KEY environment variable.');
    return null;
  }

  const fullPrompt = buildPrompt(request);
  const model = request.model || 'flux-pro';
  const size = request.size || '1024x1024';

  try {
    // FAL AI API endpoint
    const endpoint = `https://fal.run/fal-ai/${model}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${apiKey}`,
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        image_size: size.replace('x', '_'),
        num_inference_steps: model === 'flux-pro' ? 50 : 28,
        guidance_scale: 7.5,
        num_images: 1,
        enable_safety_checker: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`FAL AI API error: ${response.status}`);
    }

    const data = await response.json();

    // FAL returns images in an array
    const imageUrl = data.images?.[0]?.url || data.image?.url;

    if (!imageUrl) {
      throw new Error('No image returned from FAL AI');
    }

    return {
      id: `fal-${Date.now()}`,
      url: imageUrl,
      prompt: request.prompt,
      style: request.style || 'medical-diagram',
      size,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('FAL AI image generation failed:', error);
    return null;
  }
}

/**
 * Generate a placeholder image for demo/offline mode
 */
export function generatePlaceholder(
  request: ImageGenerationRequest
): GeneratedImage {
  const size = request.size || '1024x1024';
  const [width, height] = size.split('x').map(Number);

  // Use a placeholder service
  const placeholderUrl = `https://placehold.co/${width}x${height}/1e293b/64748b?text=${encodeURIComponent(
    request.prompt.slice(0, 30) + '...'
  )}`;

  return {
    id: `placeholder-${Date.now()}`,
    url: placeholderUrl,
    prompt: request.prompt,
    style: request.style || 'medical-diagram',
    size,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Pre-defined medical diagram prompts
 */
export const MEDICAL_DIAGRAM_TEMPLATES: Record<string, string> = {
  'heart-anatomy': 'Human heart anatomy, cross-section showing all four chambers, valves, and major vessels',
  'lung-anatomy': 'Human lung anatomy, bronchial tree, alveoli detail, respiratory system',
  'brain-regions': 'Human brain anatomy, labeled regions, cortex areas, sagittal view',
  'kidney-nephron': 'Kidney nephron structure, glomerulus, tubules, collecting duct',
  'gi-tract': 'Gastrointestinal tract, digestive system, organs labeled',
  'ecg-waveform': 'Normal ECG waveform, P wave QRS complex T wave, labeled intervals',
  'cell-structure': 'Eukaryotic cell structure, organelles labeled, nucleus mitochondria',
  'nerve-synapse': 'Neuron synapse, synaptic cleft, neurotransmitter release',
  'immune-response': 'Immune system response, T cells B cells, antibody production',
  'bone-structure': 'Long bone anatomy, cortical bone, trabecular bone, marrow',
};

/**
 * Store generated image locally
 */
export function cacheGeneratedImage(image: GeneratedImage): void {
  const cacheKey = 'vibe-image-cache';
  const cache = JSON.parse(localStorage.getItem(cacheKey) || '[]') as GeneratedImage[];

  // Add to beginning, limit to 20 images
  cache.unshift(image);
  if (cache.length > 20) {
    cache.pop();
  }

  localStorage.setItem(cacheKey, JSON.stringify(cache));
}

/**
 * Get cached generated images
 */
export function getCachedImages(): GeneratedImage[] {
  const cacheKey = 'vibe-image-cache';
  return JSON.parse(localStorage.getItem(cacheKey) || '[]') as GeneratedImage[];
}

/**
 * Clear image cache
 */
export function clearImageCache(): void {
  localStorage.removeItem('vibe-image-cache');
}
