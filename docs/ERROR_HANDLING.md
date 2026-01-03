# Error Handling Documentation

## Overview

PresentGenius implements comprehensive, user-friendly error handling throughout the application. All errors are transformed into actionable messages that help users resolve issues quickly.

## Error Handler (`services/error-handler.ts`)

The central error handling utility provides:

### Features

1. **User-Friendly Messages**: Technical errors are converted to plain language
2. **Actionable Suggestions**: Every error includes specific steps to resolve it
3. **Dev/Prod Modes**: Technical details shown only in development
4. **Retry Logic**: Automatic classification of retryable vs. non-retryable errors
5. **Severity Levels**: Errors, warnings, and info messages

### Error Categories

#### Network Errors
**Triggers**: `TypeError`, fetch failures, connection refused
**User Message**: "Network connection failed. Please check your internet connection and try again."
**Suggestions**:
- Check your internet connection
- Verify you can access the internet in your browser
- Disable any VPN or proxy that might be blocking the connection
- Check your firewall settings

**Retryable**: Yes

---

#### Authentication Errors (401)
**Triggers**: HTTP 401, "unauthorized" in message
**User Message**: "Your [Provider] API key is invalid or has expired."
**Suggestions**:
- Open your .env.local file and verify your API key
- Ensure the key starts with the correct prefix (e.g., "sk-" for DeepSeek, "eyJ" for MiniMax)
- Check that you copied the entire key without extra spaces
- Verify the key hasn't expired in your provider dashboard
- After updating the key, restart the development server: npm run dev

**Retryable**: No

---

#### Rate Limit Errors (429)
**Triggers**: HTTP 429, "rate limit" in message
**User Message**: "Too many requests. Please wait a moment and try again."
**Suggestions**:
- Wait 1-2 minutes before retrying
- Reduce the frequency of your requests
- Consider upgrading your API plan if this happens frequently
- Check your provider dashboard for rate limit details

**Retryable**: Yes

---

#### Invalid Request (400)
**Triggers**: HTTP 400, "invalid request" in message
**User Message**: "The request was invalid. Please check your input and try again."
**Suggestions**:
- Ensure your prompt is properly formatted
- Try with a shorter or simpler prompt
- If using images, verify they are valid image files
- Check that your presentation HTML is not corrupted

**Retryable**: No

---

#### Payload Too Large (413)
**Triggers**: HTTP 413, "payload" or "too large" in message
**User Message**: "Your content is too large for the API to process."
**Suggestions**:
- Try creating a shorter presentation
- Break your content into smaller sections
- Remove unnecessary images or reduce image sizes
- Simplify your prompt and try again

**Retryable**: No

---

#### Timeout Errors
**Triggers**: "timeout" or "timed out" in message
**User Message**: "The request took too long and timed out. The model may be busy."
**Suggestions**:
- Try again in a few moments
- Reduce the length or complexity of your prompt
- Create a smaller presentation
- Check your internet connection speed
- Switch to a faster model if available

**Retryable**: Yes

---

#### Server Errors (500+)
**Triggers**: HTTP 500, 502, 503, 504
**User Message**: "The [Provider] service is experiencing issues. This is not your fault."
**Suggestions**:
- Try again in a few minutes
- Check the provider status page for any known outages
- Switch to a different AI provider in the settings
- The problem should resolve automatically

**Retryable**: Yes

---

#### API Key Missing
**Triggers**: "not configured" or "api key" in message
**User Message**: "[Provider] API key is not configured."
**Suggestions**:
- Create a .env.local file in your project root
- Copy .env.example to .env.local as a template
- Add your API key to the .env.local file
- Restart the development server: npm run dev
- See the README.md for detailed setup instructions

**Retryable**: No

---

#### Content Moderation
**Triggers**: "content policy" or "filtered" in message
**User Message**: "Your request was blocked by content moderation policies."
**Suggestions**:
- Review your prompt for potentially sensitive content
- Rephrase your request using different terminology
- Ensure your content complies with the provider's usage policies

**Retryable**: No

---

#### Token Limit Exceeded
**Triggers**: "token" and "limit"/"exceed" in message
**User Message**: "Your request exceeds the model's maximum length."
**Suggestions**:
- Reduce the length of your prompt
- Create a shorter presentation
- Break your content into smaller parts
- Switch to a model with a larger context window

**Retryable**: No

---

#### Model Not Available
**Triggers**: "model" and "not found"/"unavailable" in message
**User Message**: "The selected AI model is not available."
**Suggestions**:
- Try a different model from the dropdown
- Check if the model is deprecated or renamed
- Verify the model is available in your provider account
- Switch to a different AI provider

**Retryable**: No

---

## Implementation

### Provider-Level Error Handling

All providers (DeepSeek, MiniMax, GLM) use the `BaseProvider.handleProviderError()` method:

```typescript
protected handleProviderError(error: any, providerName: string): never {
  const { createUserFriendlyError, formatErrorMessage } = require('../error-handler');

  const userFriendlyError = createUserFriendlyError(error, {
    provider: providerName,
    statusCode: error.status,
  });

  const formattedMessage = formatErrorMessage(userFriendlyError);

  const enhancedError: any = new Error(userFriendlyError.userMessage);
  enhancedError.validation = {
    isValid: false,
    suggestions: userFriendlyError.suggestions,
    retryable: userFriendlyError.retryable,
    severity: userFriendlyError.severity,
    technicalMessage: userFriendlyError.technicalMessage,
  };

  throw enhancedError;
}
```

### API Key Validation

The `api-key-validation.ts` module provides user-friendly validation messages:

```typescript
// DeepSeek
if (!key.startsWith('sk-')) {
  return {
    isValid: false,
    error: 'Your DeepSeek API key appears incorrect. It should start with "sk-". Please check your .env.local file.',
  };
}

// MiniMax
if (!key.startsWith('eyJ')) {
  return {
    isValid: false,
    error: 'Your MiniMax API key appears incorrect. It should be in JWT format starting with "eyJ". Please check your .env.local file.',
  };
}
```

### Retry Logic

The error handler includes exponential backoff for retryable errors:

```typescript
export function getRetryDelay(attempt: number, baseDelay = 1000): number {
  // Exponential backoff: 1s, 2s, 4s, 8s (capped at 30s)
  const delay = Math.min(baseDelay * Math.pow(2, attempt), 30000);
  // Add jitter to prevent thundering herd (±20%)
  const jitter = delay * 0.2 * (Math.random() - 0.5);
  return Math.floor(delay + jitter);
}
```

Retry delays:
- Attempt 1: ~1-2s
- Attempt 2: ~2-4s
- Attempt 3: ~4-8s
- Attempt 4+: ~30s (capped)

### Dev vs Production Mode

In development mode (`import.meta.env.DEV === true`):
- Full technical error messages are included
- Stack traces are preserved in console
- Error details shown in formatted messages

In production mode:
- Only user-friendly messages are shown
- Technical details are hidden
- Focus on actionable suggestions

## Usage

### Creating User-Friendly Errors

```typescript
import { createUserFriendlyError, formatErrorMessage } from './error-handler';

try {
  // API call
} catch (error) {
  const userError = createUserFriendlyError(error, {
    provider: 'DeepSeek',
    operation: 'generate',
    statusCode: error.status,
  });

  const message = formatErrorMessage(userError);
  console.error(message);

  // Show to user in UI
  showErrorToast(message);
}
```

### Checking Retryability

```typescript
import { createUserFriendlyError, isRetryableError, getRetryDelay } from './error-handler';

try {
  // API call
} catch (error) {
  const userError = createUserFriendlyError(error);

  if (isRetryableError(userError) && attempt < maxRetries) {
    const delay = getRetryDelay(attempt);
    await new Promise(resolve => setTimeout(resolve, delay));
    // Retry the operation
  }
}
```

### Legacy Compatibility

For backwards compatibility with existing code:

```typescript
import { createUserFriendlyError, toLegacyError } from './error-handler';

const userError = createUserFriendlyError(error);
const legacyError = toLegacyError(userError, statusCode);

// legacyError.type === OpenRouterErrorType.NETWORK_ERROR
// legacyError.retryable === true
// legacyError.suggestions === [...]
```

## Testing

Run error handling tests:

```bash
npm test tests/error-handler.test.ts
```

Tests verify:
- Correct classification of all error types
- User-friendly messages are generated
- Suggestions are provided
- Retryability is correctly determined
- Dev/prod mode behavior
- Exponential backoff calculation

## Best Practices

1. **Always use `createUserFriendlyError()`**: Don't throw raw errors to users
2. **Provide context**: Include provider name and operation type
3. **Preserve status codes**: Attach `error.status` or `error.statusCode`
4. **Log technical details**: Keep full error in console for debugging
5. **Show suggestions**: Always include actionable next steps
6. **Check retryability**: Use `isRetryableError()` before retry logic
7. **Use exponential backoff**: Call `getRetryDelay()` for retry delays
8. **Test error paths**: Verify error messages in both dev and prod modes

## Common Error Scenarios

### Scenario 1: User Forgets API Key

**Error**: Missing environment variable
**User Sees**: "DeepSeek API key is not configured."
**Suggestions**:
- Create a .env.local file in your project root
- Copy .env.example to .env.local as a template
- Add your API key to the .env.local file
- Restart the development server: npm run dev

### Scenario 2: Invalid API Key

**Error**: HTTP 401 from provider
**User Sees**: "Your MiniMax API key is invalid or has expired."
**Suggestions**:
- Open your .env.local file and verify your API key
- Ensure the key starts with "eyJ" (JWT format)
- Check that you copied the entire key without extra spaces
- Verify the key hasn't expired in your provider dashboard

### Scenario 3: Rate Limiting

**Error**: HTTP 429 from provider
**User Sees**: "Too many requests. Please wait a moment and try again."
**Auto-Retry**: Yes, with exponential backoff
**User Action**: Wait or reduce request frequency

### Scenario 4: Content Too Large

**Error**: HTTP 413 or context limit exceeded
**User Sees**: "Your content is too large for the API to process."
**Suggestions**:
- Try creating a shorter presentation
- Break your content into smaller sections
- Simplify your prompt and try again

## Future Improvements

- [ ] Add telemetry to track common error patterns
- [ ] Implement user-friendly error UI component
- [ ] Add "Report this error" button for unknown errors
- [ ] Create provider-specific troubleshooting guides
- [ ] Add error recovery suggestions based on user's environment
- [ ] Implement automatic health checks for provider APIs
