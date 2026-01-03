/**
 * User-Friendly Error Handler
 * Converts technical errors into actionable messages for users
 */

export interface UserFriendlyError {
  userMessage: string;
  technicalMessage: string;
  suggestions: string[];
  examplePrompts?: string[]; // Example prompts users can try
  retryable: boolean;
  severity: 'error' | 'warning' | 'info';
}

/**
 * Shuffle array using Fisher-Yates algorithm
 * Keeps first item in place (most important suggestion)
 */
function shuffleSuggestions(suggestions: string[]): string[] {
  if (suggestions.length <= 2) return suggestions;

  // Keep first suggestion, shuffle the rest
  const first = suggestions[0];
  const rest = suggestions.slice(1);

  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }

  return [first, ...rest];
}

/**
 * Shuffle entire array without preserving first item
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Pool of example prompts users can try
 * Randomly shuffled and limited to 4-5 per error
 */
const EXAMPLE_PROMPTS_POOL = [
  'Create a presentation on Heart Failure management',
  'USMLE Step 1 review: Cardiovascular System',
  'Diabetes Type 2: Pathophysiology and Treatment',
  'Pneumonia: Diagnosis and Management Guidelines',
  'Introduction to Pharmacology for Nursing Students',
  'Acute Coronary Syndrome: Emergency Protocol',
  'Neuroanatomy: Cranial Nerves Overview',
  'Hypertension: First-line Medications',
  'COPD Exacerbation: Clinical Approach',
  'Wound Care: Types and Treatment',
  'Pediatric Immunization Schedule',
  'Sepsis: Recognition and Early Management',
  'ECG Interpretation: Common Arrhythmias',
  'Asthma Action Plan for Patients',
  'Renal Physiology: Nephron Function',
];

/**
 * Get random example prompts (4-5 prompts)
 */
function getExamplePrompts(count: number = 4): string[] {
  return shuffleArray(EXAMPLE_PROMPTS_POOL).slice(0, count);
}

/**
 * Classify and enhance errors with user-friendly messages
 */
export function createUserFriendlyError(
  error: any,
  context: {
    provider?: string;
    operation?: 'generate' | 'refine' | 'validate';
    statusCode?: number;
  } = {}
): UserFriendlyError {
  const isDev = import.meta.env.DEV;
  const message = error?.message || error?.toString() || 'Unknown error';
  const status = context.statusCode || error?.status || error?.statusCode;
  const provider = context.provider || 'AI Provider';

  // Network errors
  if (
    error?.name === 'TypeError' ||
    message.includes('fetch') ||
    message.includes('network') ||
    message.includes('ECONNREFUSED') ||
    message.includes('ENOTFOUND')
  ) {
    return {
      userMessage: 'Network connection failed. Please check your internet connection and try again.',
      technicalMessage: isDev ? message : '',
      suggestions: shuffleSuggestions([
        'Check your internet connection',
        'Verify you can access the internet in your browser',
        'Try disabling your VPN or proxy temporarily',
        'Check your firewall or antivirus settings',
        'Restart your router or modem',
        'Try switching to a different network (mobile hotspot, etc.)',
      ]),
      retryable: true,
      severity: 'error',
    };
  }

  // Authentication errors (401)
  if (status === 401 || message.toLowerCase().includes('unauthorized')) {
    return {
      userMessage: `Your ${provider} API key is invalid or has expired.`,
      technicalMessage: isDev ? message : '',
      suggestions: shuffleSuggestions([
        `Open your .env.local file and verify your ${provider} API key`,
        `Check that you copied the entire key without extra spaces or line breaks`,
        `Ensure the key starts with the correct prefix (e.g., "sk-" for DeepSeek, "eyJ" for MiniMax)`,
        `Verify the key hasn't been revoked or expired in your ${provider} dashboard`,
        `Try regenerating a new API key from your provider's website`,
        `Make sure you're using the correct environment variable name`,
        `After updating the key, restart the development server: npm run dev`,
      ]),
      retryable: false,
      severity: 'error',
    };
  }

  // Rate limiting (429)
  if (status === 429 || message.toLowerCase().includes('rate limit')) {
    return {
      userMessage: 'Too many requests. Please wait a moment and try again.',
      technicalMessage: isDev ? message : '',
      suggestions: shuffleSuggestions([
        'Wait 1-2 minutes before retrying',
        'Reduce the frequency of your requests',
        'Try generating shorter or simpler presentations',
        `Check your ${provider} dashboard for current rate limit status`,
        'Consider upgrading your API plan if this happens frequently',
        'Switch to a different AI provider temporarily',
      ]),
      examplePrompts: getExamplePrompts(4),
      retryable: true,
      severity: 'warning',
    };
  }

  // Invalid request (400)
  if (status === 400 || message.toLowerCase().includes('invalid request')) {
    return {
      userMessage: 'The request was invalid. Please check your input and try again.',
      technicalMessage: isDev ? message : '',
      suggestions: shuffleSuggestions([
        'Try with a shorter or simpler prompt',
        'Check that your prompt doesn\'t contain special characters or formatting',
        'If using images, verify they are valid formats (PNG, JPG, WebP)',
        'Ensure your presentation HTML is properly formatted',
        'Remove any unusual characters or emojis from your input',
        'Try rephrasing your request using different words',
      ]),
      examplePrompts: getExamplePrompts(5),
      retryable: false,
      severity: 'error',
    };
  }

  // Payload too large (413)
  if (status === 413 || message.toLowerCase().includes('payload') || message.toLowerCase().includes('too large')) {
    return {
      userMessage: 'Your content is too large for the API to process.',
      technicalMessage: isDev ? message : '',
      suggestions: shuffleSuggestions([
        'Try creating a shorter presentation (fewer slides)',
        'Break your content into smaller, separate presentations',
        'Remove or compress images to reduce file sizes',
        'Use shorter prompts with less detail',
        'Remove any large embedded files or media',
        'Switch to a model with a larger context window',
      ]),
      examplePrompts: getExamplePrompts(4),
      retryable: false,
      severity: 'error',
    };
  }

  // Timeout errors
  if (message.toLowerCase().includes('timeout') || message.toLowerCase().includes('timed out')) {
    return {
      userMessage: 'The request took too long and timed out. The model may be busy.',
      technicalMessage: isDev ? message : '',
      suggestions: shuffleSuggestions([
        'Try again in a few moments when the model is less busy',
        'Create a simpler presentation with fewer slides',
        'Reduce the length or complexity of your prompt',
        'Check your internet connection speed',
        'Switch to a faster model from the dropdown',
        'Try generating at a different time of day',
        'Remove images to speed up processing',
      ]),
      examplePrompts: getExamplePrompts(4),
      retryable: true,
      severity: 'warning',
    };
  }

  // Server errors (500+)
  if (status && status >= 500) {
    return {
      userMessage: `The ${provider} service is experiencing issues. This is not your fault.`,
      technicalMessage: isDev ? message : '',
      suggestions: shuffleSuggestions([
        'Try again in a few minutes - this usually resolves quickly',
        `Check if ${provider} has posted about any service disruptions`,
        'Switch to a different AI provider from the model dropdown',
        'Try a different model from the same provider',
        'The issue should resolve itself automatically',
        'Check social media or status pages for updates',
      ]),
      retryable: true,
      severity: 'error',
    };
  }

  // API key missing
  if (message.toLowerCase().includes('not configured') || message.toLowerCase().includes('api key')) {
    return {
      userMessage: `${provider} API key is not configured.`,
      technicalMessage: isDev ? message : '',
      suggestions: shuffleSuggestions([
        'Create a .env.local file in your project root directory',
        'Copy .env.example to .env.local as a starting template',
        `Sign up for a ${provider} account and get an API key`,
        'Add your API key to the .env.local file with the correct variable name',
        'Restart the development server after adding the key: npm run dev',
        'Make sure .env.local is in your .gitignore (don\'t commit API keys)',
        'Check the README.md or SETUP.md for detailed instructions',
      ]),
      retryable: false,
      severity: 'error',
    };
  }

  // Content filtering / moderation
  if (message.toLowerCase().includes('content policy') || message.toLowerCase().includes('filtered')) {
    return {
      userMessage: 'Your request was blocked by content moderation policies.',
      technicalMessage: isDev ? message : '',
      suggestions: shuffleSuggestions([
        'Review your prompt for potentially sensitive or controversial topics',
        'Rephrase your request using more neutral, professional language',
        'Remove any medical/legal advice requests (use educational framing instead)',
        'Ensure your content complies with the provider\'s usage policies',
        'Try a different AI provider with less restrictive policies',
        'Use more general or academic terminology',
      ]),
      examplePrompts: getExamplePrompts(5),
      retryable: false,
      severity: 'warning',
    };
  }

  // Token limit exceeded
  if (message.toLowerCase().includes('token') && (message.toLowerCase().includes('limit') || message.toLowerCase().includes('exceed'))) {
    return {
      userMessage: 'Your request exceeds the model\'s maximum length.',
      technicalMessage: isDev ? message : '',
      suggestions: shuffleSuggestions([
        'Reduce the length of your prompt significantly',
        'Create a presentation with fewer slides (try 5-10 instead of 20+)',
        'Break your content into multiple smaller presentations',
        'Switch to a model with a larger context window (200K tokens)',
        'Remove detailed examples and focus on key points only',
        'Use bullet points instead of long paragraphs',
      ]),
      examplePrompts: getExamplePrompts(4),
      retryable: false,
      severity: 'error',
    };
  }

  // Model not found / unavailable
  if (message.toLowerCase().includes('model') && (message.toLowerCase().includes('not found') || message.toLowerCase().includes('unavailable'))) {
    return {
      userMessage: 'The selected AI model is not available.',
      technicalMessage: isDev ? message : '',
      suggestions: shuffleSuggestions([
        'Select a different model from the dropdown menu',
        'Check if the model has been deprecated or renamed by the provider',
        `Verify the model is available in your ${provider} account tier`,
        'Try switching to a different AI provider entirely',
        'Check the provider\'s documentation for available models',
        'Some models may require special access or subscription levels',
      ]),
      retryable: false,
      severity: 'error',
    };
  }

  // Unknown error
  return {
    userMessage: isDev
      ? `An unexpected error occurred: ${message.substring(0, 100)}`
      : 'An unexpected error occurred. Please try again.',
    technicalMessage: isDev ? message : '',
    suggestions: shuffleSuggestions([
      'Try refreshing the page (Cmd/Ctrl + R)',
      'Check the browser console for more details (press F12)',
      'Clear your browser cache and cookies',
      'Ensure your API key is properly configured in .env.local',
      'Try again in a few moments',
      'Switch to a different browser (Chrome recommended)',
      'Check if there are known issues on the GitHub repository',
      'Try with a simpler prompt to see if the issue persists',
    ]),
    examplePrompts: getExamplePrompts(5),
    retryable: true,
    severity: 'error',
  };
}

/**
 * Format error for display to user
 */
export function formatErrorMessage(error: UserFriendlyError): string {
  const parts = [error.userMessage];

  // Add troubleshooting suggestions
  if (error.suggestions.length > 0) {
    parts.push('\n\nTroubleshooting steps:');
    error.suggestions.forEach((suggestion, index) => {
      parts.push(`${index + 1}. ${suggestion}`);
    });
  }

  // Add example prompts
  if (error.examplePrompts && error.examplePrompts.length > 0) {
    parts.push('\n\nOr try these example prompts:');
    error.examplePrompts.forEach((prompt, index) => {
      parts.push(`${index + 1}. "${prompt}"`);
    });
  }

  // Add technical details in dev mode
  if (error.technicalMessage && import.meta.env.DEV) {
    parts.push(`\n\nTechnical details: ${error.technicalMessage}`);
  }

  return parts.join('\n');
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: UserFriendlyError): boolean {
  return error.retryable;
}

/**
 * Get retry delay with exponential backoff
 */
export function getRetryDelay(attempt: number, baseDelay = 1000): number {
  // Exponential backoff: 1s, 2s, 4s, 8s (capped at 30s)
  const delay = Math.min(baseDelay * Math.pow(2, attempt), 30000);
  // Add jitter to prevent thundering herd (±20%)
  const jitter = delay * 0.2 * (Math.random() - 0.5);
  return Math.floor(delay + jitter);
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
  PAYLOAD_TOO_LARGE = 'payload_too_large',
  UNKNOWN = 'unknown',
}

/**
 * Convert UserFriendlyError to legacy OpenRouterError format
 */
export function toLegacyError(error: UserFriendlyError, statusCode?: number): {
  type: OpenRouterErrorType;
  message: string;
  statusCode?: number;
  retryable: boolean;
  suggestions: string[];
} {
  let type: OpenRouterErrorType = OpenRouterErrorType.UNKNOWN;

  if (error.userMessage.includes('Network')) type = OpenRouterErrorType.NETWORK_ERROR;
  else if (error.userMessage.includes('API key')) type = OpenRouterErrorType.AUTH_ERROR;
  else if (error.userMessage.includes('Too many requests')) type = OpenRouterErrorType.RATE_LIMIT;
  else if (error.userMessage.includes('invalid')) type = OpenRouterErrorType.INVALID_REQUEST;
  else if (error.userMessage.includes('service is experiencing')) type = OpenRouterErrorType.SERVER_ERROR;
  else if (error.userMessage.includes('timed out')) type = OpenRouterErrorType.TIMEOUT;
  else if (error.userMessage.includes('too large')) type = OpenRouterErrorType.PAYLOAD_TOO_LARGE;

  return {
    type,
    message: error.userMessage,
    statusCode,
    retryable: error.retryable,
    suggestions: error.suggestions,
  };
}
