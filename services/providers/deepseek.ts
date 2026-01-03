/**
 * DeepSeek Provider - Direct API Access
 * Models: deepseek-chat (64K), deepseek-reasoner (64K)
 * Endpoint: https://api.deepseek.com/chat/completions
 */

import { BaseProvider, FileInput, GenerationOptions, ProgressCallback } from './base-provider';

export class DeepSeekProvider extends BaseProvider {
  constructor() {
    super({
      endpoint: 'https://api.deepseek.com/chat/completions',
      getApiKey: () => {
        // Support both VITE_ prefixed and non-prefixed environment variables
        const key = import.meta.env.VITE_DEEPSEEK_API_KEY || import.meta.env.DEEPSEEK_API_KEY;
        if (!key) {
          const error: any = new Error(
            'DeepSeek API key is not configured. Please add it to your .env.local file and restart the app.'
          );
          error.validation = {
            isValid: false,
            suggestions: [
              'Create or edit .env.local in your project root',
              'Add this line: VITE_DEEPSEEK_API_KEY=sk-your-key-here',
              'Get your API key from https://platform.deepseek.com/api_keys',
              'Restart the development server: npm run dev',
            ],
          };
          throw error;
        }
        return key;
      },
      modelId: 'deepseek-chat',
    });
  }

  /**
   * Generate new presentation using DeepSeek API
   */
  async generate(
    prompt: string,
    files: FileInput[] = [],
    options: GenerationOptions = {},
    onProgress?: ProgressCallback
  ): Promise<string> {
    try {
      onProgress?.('starting', 0, '🔐 Validating DeepSeek API key...');

      const apiKey = this.config.getApiKey();
      const modelId = options.modelId || 'deepseek-chat';

      onProgress?.('starting', 3, `✅ API key validated successfully`);
      onProgress?.('starting', 5, `🎯 Selected model: ${modelId}`);

      onProgress?.('deepseek', 8, '🚀 Initializing DeepSeek connection...');
      onProgress?.('deepseek', 10, '📋 Building system prompt...');

      // Build messages array
      const messages: any[] = [
        {
          role: 'system',
          content: `You are an expert medical educator creating interactive HTML presentations for Dr. Swisher's medical education platform.

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

SLIDE EXAMPLE STRUCTURE:
<section>
  <h1>Slide Title</h1>
  <p>Content for this slide...</p>
  <ul><li>Key point 1</li><li>Key point 2</li></ul>
</section>

<section>
  <h2>Next Slide Title</h2>
  <p>Different content...</p>
</section>`,
        },
      ];

      onProgress?.('deepseek', 12, `✅ System prompt configured`);

      // Handle images if provided (for vision-capable models if supported)
      if (files.length > 0) {
        onProgress?.(
          'deepseek',
          15,
          `📸 Processing ${files.length} image${files.length > 1 ? 's' : ''}...`
        );
        const content: any[] = [{ type: 'text', text: prompt }];

        for (const file of files) {
          if (file.mimeType.startsWith('image/')) {
            onProgress?.('deepseek', 17, `🖼️ Encoding image: ${file.mimeType}`);
            content.push({
              type: 'image_url',
              image_url: {
                url: `data:${file.mimeType};base64,${file.base64}`,
              },
            });
          }
        }

        messages.push({ role: 'user', content });
        onProgress?.('deepseek', 20, `✅ ${files.length} image(s) encoded`);
      } else {
        messages.push({ role: 'user', content: prompt });
        onProgress?.('deepseek', 18, '📝 User prompt added to messages');
      }

      onProgress?.('deepseek', 22, `📊 Request size: ${JSON.stringify(messages).length} characters`);
      onProgress?.('deepseek', 25, '🔗 Establishing connection to DeepSeek API...');

      const requestFn = async () => {
        onProgress?.('deepseek', 30, '📡 Sending request to DeepSeek...');
        onProgress?.('deepseek', 35, '⏳ Waiting for AI processing...');

        const response = await fetch(this.config.endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelId,
            messages,
            max_tokens: 8192,
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ [DeepSeek] API Error:', {
            status: response.status,
            error: errorData,
          });
          const error: any = new Error(
            errorData.error?.message || `DeepSeek API returned error status ${response.status}`
          );
          error.status = response.status;
          error.statusCode = response.status;
          throw error;
        }

        onProgress?.('deepseek', 60, '📥 Receiving response from DeepSeek...');
        onProgress?.('deepseek', 65, '📦 Downloading response data...');
        return response.json();
      };

      const data = await this.makeRequestWithRetry(requestFn, onProgress);

      onProgress?.('processing', 75, '🔍 Analyzing response structure...');
      onProgress?.('processing', 80, '📝 Extracting HTML content...');

      const content = data.choices?.[0]?.message?.content || '';
      onProgress?.('processing', 85, `✅ Received ${content.length} characters`);

      onProgress?.('processing', 88, '🔎 Searching for HTML code blocks...');
      const htmlMatch =
        content.match(/```html\n?([\s\S]*?)```/) || content.match(/<!DOCTYPE[\s\S]*<\/html>/i);
      const result = htmlMatch ? (htmlMatch[1] || htmlMatch[0]).trim() : content;

      onProgress?.('processing', 92, '✅ HTML extracted successfully');
      onProgress?.('processing', 95, `📏 Final HTML size: ${result.length} characters`);

      onProgress?.('complete', 100, '✅ Generation complete!');
      return result;
    } catch (error: any) {
      this.handleProviderError(error, 'DeepSeek');
    }
  }

  /**
   * Refine existing presentation using DeepSeek API
   */
  async refine(
    currentHtml: string,
    instruction: string,
    modelId: string = 'deepseek-chat',
    onProgress?: ProgressCallback
  ): Promise<string> {
    try {
      onProgress?.('starting', 0, '🔐 Validating DeepSeek API key...');

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
        64000, // DeepSeek context limit
        modelId
      );

      if (wasTruncated) {
        console.warn(`⚠️ [DeepSeek] Content truncated to prevent payload errors`);
        onProgress?.('processing', 12, '⚠️ Content truncated to fit size limits');
      } else {
        onProgress?.('processing', 12, '✅ Content fits within size limits');
      }

      onProgress?.('deepseek', 15, '📋 Building refinement prompt...');

      const messages = [
        {
          role: 'system',
          content: `You are Dr. Swisher's Lecture Copilot, an expert at refining interactive medical education HTML presentations.

GUIDELINES:
- Modify the HTML according to the user's instructions
- Maintain medical accuracy and educational value
- Preserve the existing Tailwind CSS styling and structure unless specifically asked to change it
- Keep the premium, professional medical aesthetic
- Return ONLY the complete modified HTML document (no explanations or markdown formatting)
${wasTruncated ? '- NOTE: The HTML was truncated for transmission. Make refinements based on the visible content and preserve the overall structure.' : ''}

CAPABILITIES:
- Direct HTML refinement (text, styling, layout changes)
- Medical content updates and corrections
- UI/UX improvements
- Adding or removing sections based on requests

Always prioritize clarity, medical accuracy, and educational effectiveness.`,
        },
        {
          role: 'user',
          content: `Current HTML${wasTruncated ? ' (truncated to fit size limits)' : ''}:\n\n${processedHtml}\n\n---\n\nUser's refinement request: ${instruction}\n\nReturn the updated HTML:`,
        },
      ];

      onProgress?.('deepseek', 18, '✅ Prompt configured');
      onProgress?.('deepseek', 20, '🔗 Connecting to DeepSeek API...');

      const requestFn = async () => {
        onProgress?.('deepseek', 25, '🎨 Sending refinement request...');
        onProgress?.('deepseek', 30, '⏳ AI is processing your request...');

        const response = await fetch(this.config.endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelId,
            messages,
            max_tokens: 8192,
            temperature: 0.5,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ [DeepSeek] Refinement Error:', errorData);
          const error: any = new Error(
            errorData.error?.message || `DeepSeek API returned error status ${response.status}`
          );
          error.status = response.status;
          error.statusCode = response.status;
          throw error;
        }

        onProgress?.('deepseek', 60, '📥 Receiving refined content...');
        onProgress?.('deepseek', 65, '📦 Downloading response...');
        return response.json();
      };

      const data = await this.makeRequestWithRetry(requestFn, onProgress);

      onProgress?.('processing', 75, '🔍 Analyzing refined response...');
      onProgress?.('processing', 80, '📝 Extracting updated HTML...');

      const content = data.choices?.[0]?.message?.content || '';
      onProgress?.('processing', 85, `✅ Received ${content.length} characters`);

      onProgress?.('processing', 88, '🔎 Parsing HTML code blocks...');
      const htmlMatch =
        content.match(/```html\n?([\s\S]*?)```/) || content.match(/<!DOCTYPE[\s\S]*<\/html>/i);
      const result = htmlMatch ? (htmlMatch[1] || htmlMatch[0]).trim() : content;

      onProgress?.('processing', 92, '✅ HTML parsed successfully');
      onProgress?.('processing', 95, `📏 Final size: ${result.length} characters`);

      onProgress?.('complete', 100, '✅ Refinement complete!');
      return result;
    } catch (error: any) {
      this.handleProviderError(error, 'DeepSeek');
    }
  }
}
