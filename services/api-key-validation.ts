/**
 * API Key Validation Service for Direct Provider Integration
 * Validates DeepSeek, MiniMax, GLM, Claude, and Gemini API keys
 * Perplexity is used as an optional citation tool, not a standalone provider
 */

export type AIProvider = 'deepseek' | 'minimax' | 'glm' | 'claude' | 'gemini' | 'none';

export interface APIKeyValidationResult {
  isValid: boolean;
  provider: AIProvider;
  key: string;
  error?: string;
  suggestions?: string[];
}

/**
 * Comprehensive API key validation
 * Checks all providers and returns the first valid one
 * Note: Perplexity API key is optional and only used for citation enhancement
 */
export function validateAPIKeys(): APIKeyValidationResult {
  // Support alternative environment variable names for deployment flexibility
  const deepseekKey = import.meta.env.VITE_DEEPSEEK_API_KEY || import.meta.env.DEEPSEEK_API_KEY;
  const minimaxKey = import.meta.env.VITE_MINIMAX_API_KEY || import.meta.env.minimax_api_key;
  const glmKey = import.meta.env.VITE_GLM_API_KEY || import.meta.env.GLM_API_KEY || import.meta.env.ZAI_API_KEY;
  const claudeKey = import.meta.env.VITE_ANTHROPIC_API_KEY || import.meta.env.ANTHROPIC_API_KEY;
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || import.meta.env.API_KEY;

  // Check GLM first (recommended default provider)
  if (glmKey) {
    const validation = validateGLMKey(glmKey);
    if (validation.isValid) {
      return {
        isValid: true,
        provider: 'glm',
        key: glmKey,
      };
    }
  }

  // Check Claude
  if (claudeKey) {
    const validation = validateClaudeKey(claudeKey);
    if (validation.isValid) {
      return {
        isValid: true,
        provider: 'claude',
        key: claudeKey,
      };
    }
  }

  // Check Gemini
  if (geminiKey) {
    const validation = validateGeminiKey(geminiKey);
    if (validation.isValid) {
      return {
        isValid: true,
        provider: 'gemini',
        key: geminiKey,
      };
    }
  }

  // Check MiniMax
  if (minimaxKey) {
    const validation = validateMiniMaxKey(minimaxKey);
    if (validation.isValid) {
      return {
        isValid: true,
        provider: 'minimax',
        key: minimaxKey,
      };
    }
  }

  // Check DeepSeek
  if (deepseekKey) {
    const validation = validateDeepSeekKey(deepseekKey);
    if (validation.isValid) {
      return {
        isValid: true,
        provider: 'deepseek',
        key: deepseekKey,
      };
    }
  }

  // No keys found
  return {
    isValid: false,
    provider: 'none',
    key: '',
    error: 'No API keys configured. Please set up at least one provider.',
    suggestions: [
      'GLM (Recommended): https://z.ai/console/api-keys → VITE_GLM_API_KEY',
      'Claude (Premium): https://console.anthropic.com/settings/keys → VITE_ANTHROPIC_API_KEY',
      'Gemini (Balanced): https://aistudio.google.com/app/apikey → VITE_GEMINI_API_KEY',
      'DeepSeek: https://platform.deepseek.com/api_keys → VITE_DEEPSEEK_API_KEY',
      'MiniMax: https://platform.minimax.io/user-center/api-key → VITE_MINIMAX_API_KEY',
      'Copy .env.example to .env.local and add your API key',
      'Restart the development server after updating .env',
      '',
      'Optional: Add VITE_PERPLEXITY_API_KEY for citation support (works with all providers)',
    ],
  };
}

/**
 * Validate DeepSeek API key format
 */
function validateDeepSeekKey(key: string): { isValid: boolean; error?: string } {
  if (!key || typeof key !== 'string') {
    return {
      isValid: false,
      error: 'DeepSeek API key is missing. Please add it to your .env.local file.'
    };
  }

  if (!key.startsWith('sk-')) {
    return {
      isValid: false,
      error: 'Your DeepSeek API key appears incorrect. It should start with "sk-". Please check your .env.local file.',
    };
  }

  if (key.length < 20) {
    return {
      isValid: false,
      error: 'Your DeepSeek API key looks incomplete. Please verify you copied the entire key from the DeepSeek dashboard.'
    };
  }

  return { isValid: true };
}

/**
 * Validate MiniMax API key format (JWT)
 */
function validateMiniMaxKey(key: string): { isValid: boolean; error?: string } {
  if (!key || typeof key !== 'string') {
    return {
      isValid: false,
      error: 'MiniMax API key is missing. Please add it to your .env.local file.'
    };
  }

  // MiniMax keys are JWT tokens that start with 'eyJ'
  if (!key.startsWith('eyJ')) {
    return {
      isValid: false,
      error: 'Your MiniMax API key appears incorrect. It should be in JWT format starting with "eyJ". Please check your .env.local file.',
    };
  }

  if (key.length < 50) {
    return {
      isValid: false,
      error: 'Your MiniMax API key looks incomplete. Please verify you copied the entire JWT token from the MiniMax dashboard.'
    };
  }

  return { isValid: true };
}

/**
 * Validate GLM API key format
 */
function validateGLMKey(key: string): { isValid: boolean; error?: string } {
  if (!key || typeof key !== 'string') {
    return {
      isValid: false,
      error: 'GLM API key is missing. Please add it to your .env.local file.'
    };
  }

  if (key.length < 20) {
    return {
      isValid: false,
      error: 'Your GLM API key looks incomplete. Please verify you copied the entire key from the Z.AI dashboard.'
    };
  }

  return { isValid: true };
}

/**
 * Validate Perplexity API key format
 */
function validatePerplexityKey(key: string): { isValid: boolean; error?: string } {
  if (!key || typeof key !== 'string') {
    return {
      isValid: false,
      error: 'Perplexity API key is missing. Please add it to your .env.local file.'
    };
  }

  if (!key.startsWith('pplx-')) {
    return {
      isValid: false,
      error: 'Your Perplexity API key appears incorrect. It should start with "pplx-". Please check your .env.local file.',
    };
  }

  if (key.length < 20) {
    return {
      isValid: false,
      error: 'Your Perplexity API key looks incomplete. Please verify you copied the entire key from the Perplexity dashboard.'
    };
  }

  return { isValid: true };
}

/**
 * Validate Claude (Anthropic) API key format
 */
function validateClaudeKey(key: string): { isValid: boolean; error?: string } {
  if (!key || typeof key !== 'string') {
    return {
      isValid: false,
      error: 'Claude API key is missing. Please add it to your .env.local file.'
    };
  }

  if (!key.startsWith('sk-ant-')) {
    return {
      isValid: false,
      error: 'Your Claude API key appears incorrect. It should start with "sk-ant-". Please check your .env.local file.',
    };
  }

  if (key.length < 50) {
    return {
      isValid: false,
      error: 'Your Claude API key looks incomplete. Please verify you copied the entire key from the Anthropic console.'
    };
  }

  return { isValid: true };
}

/**
 * Validate Gemini API key format
 */
function validateGeminiKey(key: string): { isValid: boolean; error?: string } {
  if (!key || typeof key !== 'string') {
    return {
      isValid: false,
      error: 'Gemini API key is missing. Please add it to your .env.local file.'
    };
  }

  if (key.length < 30) {
    return {
      isValid: false,
      error: 'Your Gemini API key looks incomplete. Please verify you copied the entire key from AI Studio.'
    };
  }

  return { isValid: true };
}

/**
 * Get setup instructions for providers
 */
export function getSetupInstructions(): string {
  return `
PresentGenius - AI Provider Setup Guide

Choose ONE or more providers below:

1. GLM (Recommended - Latest Flagship)
   - Visit: https://z.ai/console/api-keys
   - Create account and generate API key
   - Add to .env.local: VITE_GLM_API_KEY=your_key
   - Models: glm-4.7, glm-4.6, glm-4.5, glm-4.5-air (200K context)
   - Cost: ~$1-2 input / ~$2-4 output per 1M tokens

2. DeepSeek (Most Cost-Effective)
   - Visit: https://platform.deepseek.com/api_keys
   - Create account and generate API key
   - Add to .env.local: VITE_DEEPSEEK_API_KEY=sk-your_key
   - Models: deepseek-chat (64K), deepseek-reasoner (64K)
   - Cost: $0.30 input / $1.20 output per 1M tokens

3. MiniMax (Large Context)
   - Visit: https://platform.minimax.io/user-center/api-key
   - Create account and generate API key
   - Add to .env.local: VITE_MINIMAX_API_KEY=eyJ...
   - Models: MiniMax-M2.1, MiniMax-M2.1-lightning (200K context)
   - Cost: $0.30 input / $1.20 output per 1M tokens

4. Perplexity (Web Search & Citations)
   - Visit: https://www.perplexity.ai/settings/api
   - Create account and generate API key
   - Add to .env.local: VITE_PERPLEXITY_API_KEY=pplx-your_key
   - Models: sonar (128K), sonar-pro (200K)
   - Features: Live web search, automatic citations, medical literature
   - Cost: $5 input / $5 output per 1M tokens

Environment Setup Steps:
1. Copy .env.example to .env.local
2. Add at least ONE API key to .env.local
3. Restart development server: npm run dev
4. GLM is selected by default (can change in Chat Assistant panel)

Alternative Environment Variable Names (for deployment platforms):
- DeepSeek: DEEPSEEK_API_KEY (without VITE_ prefix)
- MiniMax: minimax_api_key (lowercase with underscore)
- GLM: GLM_API_KEY or ZAI_API_KEY (without VITE_ prefix)

Need Help?
- GLM (Recommended): Latest flagship model (Dec 2025), optimal balance
- DeepSeek: Best cost/performance ratio for most use cases
- MiniMax: Alternative large context provider (200K)
- Perplexity: When you need citations, current evidence, or web research
- You can use multiple providers and switch between them in the UI
`;
}

/**
 * Legacy error types for backwards compatibility
 */
export enum OpenRouterErrorType {
  NETWORK_ERROR = 'network_error',
  AUTH_ERROR = 'auth_error',
  RATE_LIMIT = 'rate_limit',
  INVALID_REQUEST = 'invalid_request',
  SERVER_ERROR = 'server_error',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown',
}

export interface OpenRouterError {
  type: OpenRouterErrorType;
  message: string;
  statusCode?: number;
  retryable: boolean;
  suggestions: string[];
}

/**
 * Classify errors (kept for backwards compatibility)
 */
export function classifyOpenRouterError(
  error: Error | any,
  statusCode?: number
): OpenRouterError {
  const message = error?.message || error?.toString() || 'Unknown error';
  const code = statusCode || error?.statusCode || error?.status;

  // Network errors
  if (
    error?.name === 'TypeError' ||
    message.includes('fetch') ||
    message.includes('network')
  ) {
    return {
      type: OpenRouterErrorType.NETWORK_ERROR,
      message: 'Network error: Could not connect to AI provider. Check your internet connection.',
      statusCode: code,
      retryable: true,
      suggestions: [
        'Check your internet connection',
        'Verify firewall settings',
        'Try again in a few moments',
      ],
    };
  }

  // Authentication errors
  if (code === 401 || message.includes('unauthorized') || message.includes('key')) {
    return {
      type: OpenRouterErrorType.AUTH_ERROR,
      message: 'Authentication error: Invalid API key. Please check your configuration.',
      statusCode: 401,
      retryable: false,
      suggestions: [
        'Verify your API key is correct in .env.local',
        'Ensure the API key has not expired',
        'Check that you copied the entire key without extra spaces',
      ],
    };
  }

  // Rate limiting
  if (code === 429 || message.includes('rate limit')) {
    return {
      type: OpenRouterErrorType.RATE_LIMIT,
      message: 'Rate limit exceeded. Please wait before trying again.',
      statusCode: 429,
      retryable: true,
      suggestions: [
        'Wait 1-2 minutes before retrying',
        'Consider upgrading your API plan',
        'Reduce the frequency of requests',
      ],
    };
  }

  // Server errors
  if (code && code >= 500) {
    return {
      type: OpenRouterErrorType.SERVER_ERROR,
      message: 'Server error: The AI provider is experiencing issues.',
      statusCode: code,
      retryable: true,
      suggestions: [
        'Try again in a few moments',
        'Check the provider status page',
        'Switch to a different provider if available',
      ],
    };
  }

  // Timeout
  if (message.includes('timeout') || message.includes('timed out')) {
    return {
      type: OpenRouterErrorType.TIMEOUT,
      message: 'Request timed out. Try with a shorter prompt or smaller presentation.',
      statusCode: 408,
      retryable: true,
      suggestions: [
        'Reduce the length of your prompt',
        'Try with a smaller presentation',
        'Check your internet connection speed',
      ],
    };
  }

  // Invalid request
  if (code === 400 || message.includes('invalid')) {
    return {
      type: OpenRouterErrorType.INVALID_REQUEST,
      message: 'Invalid request. Please check your input.',
      statusCode: 400,
      retryable: false,
      suggestions: [
        'Verify your prompt is properly formatted',
        'Check that all required parameters are provided',
        'Ensure the HTML content is not corrupted',
      ],
    };
  }

  // Unknown error
  return {
    type: OpenRouterErrorType.UNKNOWN,
    message: `An unexpected error occurred: ${message}`,
    statusCode: code,
    retryable: false,
    suggestions: [
      'Check the browser console for more details',
      'Verify your configuration',
      'Try refreshing the page',
    ],
  };
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: OpenRouterError): boolean {
  return error.retryable;
}

/**
 * Get retry delay with exponential backoff
 */
export function getRetryDelay(attempt: number, baseDelay = 1000): number {
  // Exponential backoff: 1s, 2s, 4s (capped at 30s)
  const delay = Math.min(baseDelay * Math.pow(2, attempt), 30000);
  // Add jitter to prevent thundering herd
  return delay + Math.random() * 1000;
}
