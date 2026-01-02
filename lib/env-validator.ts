/**
 * Environment Variable Validator
 * Checks required and optional env vars on startup
 */

export interface EnvValidationResult {
  isValid: boolean;
  hasAnyProvider: boolean;
  hasSupabase: boolean;
  hasResearch: boolean;
  missing: string[];
  warnings: string[];
  configured: string[];
}

const REQUIRED_PROVIDERS = [
  { key: 'VITE_GEMINI_API_KEY', name: 'Gemini' },
  { key: 'VITE_OPENROUTER_API_KEY', name: 'OpenRouter' },
  { key: 'VITE_ANTHROPIC_API_KEY', name: 'Anthropic Claude' },
];

const OPTIONAL_SERVICES = [
  { key: 'VITE_SUPABASE_URL', name: 'Supabase URL' },
  { key: 'VITE_SUPABASE_ANON_KEY', name: 'Supabase Key' },
  { key: 'VITE_PERPLEXITY_API_KEY', name: 'Perplexity Research' },
  { key: 'VITE_FAL_KEY', name: 'FAL Image Generation' },
  { key: 'VITE_SCRAPER_URL', name: 'Medical Scraper Service' },
];

/**
 * Validate all environment variables
 */
export function validateEnv(): EnvValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];
  const configured: string[] = [];

  // Check AI providers (at least one required)
  const availableProviders = REQUIRED_PROVIDERS.filter(p => {
    const value = import.meta.env[p.key];
    if (value && value.length > 10) {
      configured.push(p.name);
      return true;
    }
    return false;
  });

  const hasAnyProvider = availableProviders.length > 0;

  if (!hasAnyProvider) {
    missing.push('At least one AI provider API key (VITE_GEMINI_API_KEY, VITE_OPENROUTER_API_KEY, or VITE_ANTHROPIC_API_KEY)');
  }

  // Check Supabase
  const hasSupabaseUrl = !!import.meta.env.VITE_SUPABASE_URL;
  const hasSupabaseKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;
  const hasSupabase = hasSupabaseUrl && hasSupabaseKey;

  if (hasSupabaseUrl && !hasSupabaseKey) {
    warnings.push('VITE_SUPABASE_URL is set but VITE_SUPABASE_ANON_KEY is missing');
  }
  if (!hasSupabaseUrl && hasSupabaseKey) {
    warnings.push('VITE_SUPABASE_ANON_KEY is set but VITE_SUPABASE_URL is missing');
  }
  if (!hasSupabase) {
    warnings.push('Supabase not configured - cloud save disabled, using local storage only');
  } else {
    configured.push('Supabase');
  }

  // Check research services
  const hasPerplexity = !!import.meta.env.VITE_PERPLEXITY_API_KEY;
  const hasResearch = hasPerplexity;

  if (hasPerplexity) configured.push('Perplexity Research');

  // Check optional services
  if (import.meta.env.VITE_FAL_KEY) configured.push('FAL Image Generation');
  if (import.meta.env.VITE_SCRAPER_URL) configured.push('Medical Scraper');

  return {
    isValid: hasAnyProvider,
    hasAnyProvider,
    hasSupabase,
    hasResearch,
    missing,
    warnings,
    configured,
  };
}

/**
 * Log validation results to console
 */
export function logEnvStatus(): void {
  const result = validateEnv();

  console.group('🔧 Environment Configuration');

  if (result.configured.length > 0) {
    console.log('✅ Configured:', result.configured.join(', '));
  }

  if (result.warnings.length > 0) {
    result.warnings.forEach(w => console.warn('⚠️', w));
  }

  if (result.missing.length > 0) {
    result.missing.forEach(m => console.error('❌ Missing:', m));
  }

  if (!result.isValid) {
    console.error('🚫 App cannot generate presentations without at least one AI provider');
  }

  console.groupEnd();
}

/**
 * Get user-friendly error message for missing config
 */
export function getMissingConfigMessage(): string | null {
  const result = validateEnv();

  if (!result.isValid) {
    return `Missing required configuration:\n\n${result.missing.join('\n')}\n\nPlease add API keys to your environment variables (Vercel dashboard or .env.local file).`;
  }

  return null;
}

/**
 * Check if a specific provider is available
 */
export function isProviderConfigured(provider: 'gemini' | 'openrouter' | 'anthropic' | 'perplexity'): boolean {
  const keyMap = {
    gemini: 'VITE_GEMINI_API_KEY',
    openrouter: 'VITE_OPENROUTER_API_KEY',
    anthropic: 'VITE_ANTHROPIC_API_KEY',
    perplexity: 'VITE_PERPLEXITY_API_KEY',
  };

  const value = import.meta.env[keyMap[provider]];
  return !!(value && value.length > 10);
}
