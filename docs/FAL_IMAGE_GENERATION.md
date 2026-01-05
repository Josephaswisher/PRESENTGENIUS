# FAL AI Image Generation Integration

## Overview

The presentation generator now uses **FAL AI** to create custom images instead of emojis. Images are generated automatically for each chapter using the FLUX Schnell model.

## Features

### Automatic Image Generation
For each chapter, the system generates:
- **Hero Image** (16:9) - Chapter header/banner
- **Icon** (1:1) - Interaction type indicator
- **Topic Images** (4:3) - 1-2 images based on key topics

### Supported Styles
- `icon` - Flat design icons, minimal, vector style
- `illustration` - Professional educational illustrations
- `photo` - Realistic photography style
- `diagram` - Technical diagrams with clean lines
- `medical` - Anatomically accurate medical illustrations

### API Configuration

**Configured API Keys** (automatic rotation on failure):
```
Key 1: 298951cb-ac74-4887-a520-d0d429ededa9
Key 2: b1ff02e6-0af0-4b6d-b3f4-25d013506ce2
```

## How It Works

### 1. Chapter Analysis
```typescript
extractImagePrompts(
  chapterTitle: "Heart Failure Guidelines",
  chapterDescription: "Latest ACC/AHA guidelines...",
  keyTopics: ["GDMT", "SGLT2i", "Acute decompensation"],
  interactionType: "case-study"
)
```

### 2. Image Generation
```typescript
// Generates 4 images per chapter:
{
  hero: GeneratedImage,    // 16:9 header image
  icon: GeneratedImage,    // 1:1 interaction icon
  topic1: GeneratedImage,  // 4:3 first topic
  topic2: GeneratedImage   // 4:3 second topic
}
```

### 3. HTML Integration
The builder agent receives image URLs:
```html
<img
  src="https://fal.media/files/..."
  alt="Heart Failure Guidelines"
  class="w-full h-64 object-cover rounded-lg mb-6"
>
```

## Usage

### In Parallel Generation
Images are generated automatically when using the parallel generation pipeline:

```typescript
generateParallelCourse(
  "Create a lecture on heart failure",
  files,
  'minimax'
)
// ✅ Images automatically generated for each chapter
```

### Manual Image Generation
```typescript
import { generateImage } from './fal-image-generator';

const image = await generateImage({
  prompt: "Heart anatomy diagram",
  style: 'medical',
  aspectRatio: '16:9',
  size: 'medium'
});
```

### Batch Generation
```typescript
import { generateImages } from './fal-image-generator';

const images = await generateImages([
  { prompt: "ECG icon", style: 'icon', aspectRatio: '1:1' },
  { prompt: "Cardiac cycle", style: 'diagram', aspectRatio: '4:3' },
  { prompt: "Heart failure pathophysiology", style: 'medical', aspectRatio: '16:9' }
]);
```

## Rate Limiting & Error Handling

### Automatic Delays
- 500ms delay between image requests
- Prevents API rate limit errors

### Fallback Strategy
If image generation fails:
1. Try rotating API key
2. Retry with new key
3. Return SVG placeholder if all fails

### API Key Rotation
```typescript
// Automatically rotates on 401/403 errors
currentKey = (currentKey + 1) % totalKeys
```

## Cost Optimization

### Image Sizes
- **Small**: 512-640px (icons, thumbnails)
- **Medium**: 768-1024px (standard slides)
- **Large**: 1024-1920px (hero images)

### Generation Speed
- FLUX Schnell model
- 4 inference steps (fast generation)
- ~2-3 seconds per image

## Troubleshooting

### Images Not Appearing
Check browser console for:
```
✅ [FAL] Image generated successfully
⚠️ [FAL] Generation failed, using placeholders
```

### API Key Issues
```
[FAL] Rotated to API key 2
```
System automatically tries next key.

### Rate Limiting
```
[FAL] Generating 4 images in parallel...
```
500ms delay between requests prevents rate limiting.

## Example Output

### Console Logs
```
🎨 Agent 1: Generating AI images...
[FAL] Generating images for chapter: "GDMT Optimization"
[FAL] Generating image: "GDMT Optimization - medical education header" (medical, 16:9)
✅ [FAL] Image generated successfully: https://fal.media/files/...
✅ [Builder 1] Generated 4 images for "GDMT Optimization"
```

### Generated HTML
```html
<section id="chapter-1" class="chapter-section min-h-screen p-8">
  <div class="max-w-4xl mx-auto">
    <h2 class="text-5xl font-bold text-white mb-6">GDMT Optimization</h2>

    <!-- Hero Image -->
    <img
      src="https://fal.media/files/lion/abc123..."
      alt="GDMT Optimization"
      class="w-full h-64 object-cover rounded-lg mb-6"
    >

    <!-- Content with topic images -->
    <div class="grid grid-cols-2 gap-4">
      <img src="https://fal.media/files/lion/def456..."
           alt="SGLT2 Inhibitors"
           class="rounded-lg">
      <img src="https://fal.media/files/lion/ghi789..."
           alt="Beta Blockers"
           class="rounded-lg">
    </div>
  </div>
</section>
```

## Performance

- **Generation Time**: ~2-3 seconds per image
- **Total Chapter Time**: ~10-12 seconds (4 images + 500ms delays)
- **Parallel Processing**: All chapters generate images simultaneously
- **Total Presentation**: ~10-15 seconds for 8 chapters

## Next Steps

To customize image generation:
1. Edit `extractImagePrompts()` in `fal-image-generator.ts`
2. Adjust image counts, sizes, or styles
3. Modify prompt enhancement in `enhancePrompt()`
4. Update builder prompt in `parallel-generation.ts`
