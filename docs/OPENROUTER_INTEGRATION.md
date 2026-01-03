# OpenRouter API Integration for PresentGenius

This document describes the comprehensive OpenRouter API integration implemented in PresentGenius, including configuration, error handling, and best practices.

## Table of Contents

1. [Overview](#overview)
2. [Configuration](#configuration)
3. [Error Handling](#error-handling)
4. [API Reference](#api-reference)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

## Overview

PresentGenius uses OpenRouter as its primary AI provider for generating interactive medical education content. OpenRouter provides access to multiple AI models through a unified API, supporting models from OpenAI, Anthropic, Google, Meta, DeepSeek, and more.

### Key Features

- **Unified API**: Single interface for multiple AI models
- **Automatic Retry**: Exponential backoff for transient errors
- **Comprehensive Error Handling**: User-friendly error messages with suggestions
- **Progress Tracking**: Real-time progress callbacks during generation
- **Caching**: Automatic response caching for improved performance
- **Fallback Support**: Graceful fallback to alternative providers

## Configuration

### Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# OpenRouter API Key (Recommended - Primary Provider)
VITE_OPENROUTER_API_KEY=sk-your-openrouter-key-here

# Anthropic API Key (Optional - Fallback Provider)
VITE_ANTHROPIC_API_KEY=sk-your-anthropic-key-here

# Google Gemini API Key (Optional - Alternative Provider)
VITE_GEMINI_API_KEY=your-gemini-key-here
```

### Getting an OpenRouter API Key

1. Visit [OpenRouter Keys](https://openrouter.ai/keys)
2. Sign up or log in to your account
3. Generate a new API key
4. Copy the key and add it to your `.env.local` file

### Key Format Requirements

- OpenRouter keys must start with `sk-`
- Keys must be at least 20 characters long
- Keys should be kept secure and never committed to version control

## Error Handling

### Error Types

The system classifies errors into the following types:

| Error Type | Status Code | Retryable | Description |
|------------|-------------|-----------|-------------|
| `NETWORK_ERROR` | - | Yes | Network connectivity issues |
| `AUTH_ERROR` | 401 | No | Invalid or expired API key |
| `RATE_LIMIT` | 429 | Yes | Too many requests |
| `INVALID_REQUEST` | 400/422 | No | Malformed request |
| `SERVER_ERROR` | 500+ | Yes | Server-side errors |
| `TIMEOUT` | - | Yes | Request timed out |
| `UNKNOWN` | - | No | Unclassified errors |

### Error Response Format

All errors include:

```typescript
interface OpenRouterError {
  type: OpenRouterErrorType;  // Error classification
  message: string;             // User-friendly error message
  statusCode?: number;         // HTTP status code if applicable
  retryable: boolean;          // Whether the error is retryable
  suggestions: string[];       // Actionable suggestions for the user
}
```

### Retry Logic

The system implements automatic retry with exponential backoff:

- **Max Retries**: 3 attempts
- **Base Delay**: 1 second
- **Backoff**: Exponential (2^n)
- **Jitter**: Random delay added to prevent thundering herd
- **Max Delay**: 30 seconds cap

### Example Error Handling

```typescript
try {
  const result = await generateWithProvider(
    'openrouter',
    'Create a medical presentation about cardiology',
    [],
    {},
    (phase, progress, message, error) => {
      if (phase === 'error' && error) {
        console.error('Error:', error.message);
        console.error('Suggestions:', error.suggestions);
      }
    }
  );
} catch (error) {
  console.error('Generation failed:', error.message);
}
```

## API Reference

### Services

#### `services/api-key-validation.ts`

Core validation and error handling utilities.

```typescript
// Validate API keys
function validateAPIKeys(): APIKeyValidationResult;

// Classify OpenRouter errors
function classifyOpenRouterError(error: any, statusCode?: number): OpenRouterError;

// Check if error is retryable
function isRetryableError(error: OpenRouterError): boolean;

// Calculate retry delay with exponential backoff
function getRetryDelay(attempt: number, baseDelay?: number): number;

// Get comprehensive setup instructions
function getSetupInstructions(): string;

// Validate environment setup
function validateEnvironmentSetup(): { hasOpenRouter, hasAnthropic, isValid, issues };
```

#### `services/openrouter.ts`

OpenRouter API integration.

```typescript
// Generate content using OpenRouter
async function generateWithOpenRouter(
  prompt: string,
  modelId?: OpenRouterModelId,
  files?: FileInput[],
  options?: GenerationOptions,
  onProgress?: EnhancedProgressCallback
): Promise<string>;

// Refine existing content
async function refineWithOpenRouter(
  currentHtml: string,
  instruction: string,
  modelId?: OpenRouterModelId,
  onProgress?: EnhancedProgressCallback
): Promise<string>;

// Compatibility wrappers
async function bringToLife(
  prompt: string,
  files?: FileInput[],
  options?: GenerationOptions & { model?: OpenRouterModelId },
  onProgress?: EnhancedProgressCallback
): Promise<string>;

async function refineArtifact(
  currentHtml: string,
  instruction: string,
  model?: OpenRouterModelId,
  onProgress?: EnhancedProgressCallback
): Promise<string>;

// Utility functions
function getAvailableModels(): { id, name, icon, tier }[];
function isOpenRouterConfigured(): boolean;
```

#### `services/ai-provider.ts`

Unified AI provider interface.

```typescript
// Check provider availability
function isProviderAvailable(provider: AIProvider): boolean;

// Get detailed provider status
function getProviderStatus(provider: AIProvider): {
  available: boolean;
  status: 'configured' | 'missing_key' | 'invalid_key' | 'network_error';
  message: string;
  suggestions?: string[];
};

// Get setup instructions
function getProviderSetupInstructions(provider: AIProvider): string;

// Main generation function
async function generateWithProvider(
  provider: AIProvider,
  prompt: string,
  files?: FileInput[],
  options?: GenerationOptions,
  onProgress?: ProgressCallback
): Promise<string>;

// Refinement function
async function refineWithProvider(
  provider: AIProvider,
  currentHtml: string,
  instruction: string,
  onProgress?: ProgressCallback
): Promise<string>;
```

### Model Configuration

The following models are available through OpenRouter:

```typescript
const OPENROUTER_MODELS = {
  // OpenAI
  'openai/gpt-4o': { name: 'GPT-4o', icon: '🟢', tier: 'premium' },
  'openai/gpt-4o-mini': { name: 'GPT-4o Mini', icon: '🟢', tier: 'fast' },
  
  // Anthropic Claude
  'anthropic/claude-opus-4-20250514': { name: 'Claude Opus 4', icon: '🟠', tier: 'premium' },
  'anthropic/claude-sonnet-4-20250514': { name: 'Claude Sonnet 4', icon: '🟠', tier: 'premium' },
  'anthropic/claude-3.5-sonnet': { name: 'Claude 3.5 Sonnet', icon: '🟠', tier: 'standard' },
  
  // Meta Llama
  'meta-llama/llama-3.3-70b-instruct': { name: 'Llama 3.3 70B', icon: '🦙', tier: 'standard' },
  
  // Google
  'google/gemini-2.0-flash-001': { name: 'Gemini 2.0 Flash', icon: '💎', tier: 'premium' },
  
  // DeepSeek (Default - Best Value)
  'deepseek/deepseek-chat': { name: 'DeepSeek V3', icon: '🔵', tier: 'fast' },
  'deepseek/deepseek-r1': { name: 'DeepSeek R1', icon: '🔵', tier: 'premium' },
} as const;
```

**Default Model**: `deepseek/deepseek-chat` (Best value at $0.30/$1.20 per 1M tokens)

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/api-key-validation.test.ts

# Run OpenRouter-specific tests
npm test -- tests/openrouter.test.ts

# Run in watch mode
npm test -- --watch
```

### Test Coverage

The test suite includes:

1. **API Key Validation Tests**
   - Missing key detection
   - Key format validation
   - Provider fallback logic

2. **Error Classification Tests**
   - Network error detection
   - Authentication error handling
   - Rate limit classification
   - Server error handling

3. **Retry Logic Tests**
   - Retryable error identification
   - Exponential backoff calculation
   - Delay capping

4. **Integration Tests**
   - End-to-end generation flow
   - Error recovery scenarios
   - Progress callback verification

## Troubleshooting

### Common Issues

#### 1. "No API keys configured"

**Cause**: Missing `VITE_OPENROUTER_API_KEY` in `.env.local`

**Solution**:
```bash
# Create .env.local if it doesn't exist
cp .env.example .env.local

# Edit the file and add your API key
# VITE_OPENROUTER_API_KEY=sk-your-key-here

# Restart the development server
npm run dev
```

#### 2. "Invalid API key format"

**Cause**: API key doesn't match expected format

**Solution**:
- Ensure key starts with `sk-`
- Verify key is at least 20 characters
- Check for accidental whitespace
- Regenerate key if needed

#### 3. "Rate limit exceeded"

**Cause**: Too many requests in a short time

**Solution**:
- Wait a few minutes before retrying
- Consider upgrading your OpenRouter plan
- Implement request batching

#### 4. "Network error"

**Cause**: Internet connectivity issues

**Solution**:
- Check internet connection
- Verify OpenRouter status at [status.openrouter.ai](https://status.openrouter.ai)
- Try again later

### Debug Mode

Enable debug logging by setting:

```typescript
// In your component or service
const originalConsoleLog = console.log;
console.log = (...args) => {
  if (args[0]?.includes?.('[OpenRouter]')) {
    originalConsoleLog(...args);
  }
};
```

### Getting Help

1. Check the [OpenRouter Documentation](https://openrouter.ai/docs)
2. Review [GitHub Issues](https://github.com/openrouter/openrouter-api/issues)
3. Contact OpenRouter support
4. Check PresentGenius documentation

## Best Practices

1. **Use Environment Variables**: Never hardcode API keys
2. **Handle Errors Gracefully**: Always use try-catch blocks
3. **Implement Retry Logic**: Handle transient failures automatically
4. **Cache Responses**: Use caching for repeated requests
5. **Monitor Usage**: Track API key usage and costs
6. **Keep Keys Secure**: Rotate keys periodically
7. **Test Thoroughly**: Verify integration works in all scenarios

## Performance Considerations

- **Request Timeout**: 60 seconds default
- **Max Tokens**: 16,000 tokens per request
- **Response Caching**: Automatic caching for identical prompts
- **Concurrent Requests**: Supported but rate-limited by OpenRouter

## Security Notes

- API keys are stored in environment variables only
- Keys are never logged or exposed in error messages
- Use `.env.local` which is gitignored
- Rotate keys immediately if compromised
- Implement proper access controls in production

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed changes.

## License

This integration is part of PresentGenius. See LICENSE file for details.
