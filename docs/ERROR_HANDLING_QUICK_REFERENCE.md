# Error Handling - Quick Reference Card

## Import

```typescript
import {
  createUserFriendlyError,
  formatErrorMessage,
  isRetryableError,
  getRetryDelay
} from './services/error-handler';
```

## Basic Usage

```typescript
try {
  await someOperation();
} catch (error) {
  const userError = createUserFriendlyError(error, {
    provider: 'DeepSeek',  // Optional: Provider name
    operation: 'generate', // Optional: Operation type
    statusCode: error.status // Optional: HTTP status
  });

  // Show to user
  showError(formatErrorMessage(userError));
}
```

## With Retry Logic

```typescript
async function withRetry(fn: () => Promise<T>, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const userError = createUserFriendlyError(error);

      if (isRetryableError(userError) && attempt < maxAttempts) {
        const delay = getRetryDelay(attempt);
        await sleep(delay);
        continue;
      }

      throw error;
    }
  }
}
```

## Error Types (Automatic Detection)

| Type | Detected By | Retryable | Delay |
|------|-------------|-----------|-------|
| Network | `TypeError`, "fetch", "network" | ✅ Yes | 1-2s |
| Auth (401) | Status 401, "unauthorized" | ❌ No | - |
| Rate Limit (429) | Status 429, "rate limit" | ✅ Yes | 1-30s |
| Invalid (400) | Status 400, "invalid" | ❌ No | - |
| Payload (413) | Status 413, "too large" | ❌ No | - |
| Timeout | "timeout", "timed out" | ✅ Yes | 1-8s |
| Server (500+) | Status 500-599 | ✅ Yes | 1-30s |
| No API Key | "not configured", "api key" | ❌ No | - |

## Error Object Structure

```typescript
interface UserFriendlyError {
  userMessage: string;        // User-friendly message
  technicalMessage: string;   // Full error (dev mode only)
  suggestions: string[];      // Actionable steps
  retryable: boolean;        // Can this be retried?
  severity: 'error' | 'warning' | 'info';
}
```

## Enhanced Error Properties

Errors thrown by providers now include:

```typescript
error.formattedMessage      // Ready to display to user
error.validation.suggestions // Array of suggestions
error.validation.retryable  // Boolean
error.validation.severity   // 'error' | 'warning' | 'info'
error.status                // HTTP status code
```

## Display in App

### Toast Notification
```typescript
catch (error) {
  if (error.formattedMessage) {
    showError(error.formattedMessage);
  } else if (error.validation?.suggestions) {
    const msg = `${error.message}\n\nWhat you can try:\n${error.validation.suggestions.join('\n')}`;
    showError(msg);
  } else {
    showError(error.message);
  }
}
```

### Chat Message
```typescript
catch (error) {
  const msg = error.formattedMessage || error.message;
  setChatMessages(prev => [...prev, {
    role: 'assistant',
    text: `❌ Error:\n${msg}`
  }]);
}
```

## Common Patterns

### Pattern 1: API Call with Auto-Retry
```typescript
try {
  await makeRequestWithRetry(async () => {
    const response = await fetch(url, options);
    if (!response.ok) {
      const error: any = new Error('API error');
      error.status = response.status;
      throw error;
    }
    return response.json();
  });
} catch (error) {
  // Already retried, show final error
  showError(formatErrorMessage(
    createUserFriendlyError(error, { provider: 'DeepSeek' })
  ));
}
```

### Pattern 2: Validation Before Operation
```typescript
import { validateAPIKeys } from './services/api-key-validation';

const validation = validateAPIKeys();
if (!validation.isValid) {
  showError(validation.error);
  showSuggestions(validation.suggestions);
  return;
}

// Proceed with operation
```

### Pattern 3: Progress Callback with Errors
```typescript
onProgress?.('error', 0, userError.userMessage, {
  suggestions: userError.suggestions,
  retryable: userError.retryable,
  severity: userError.severity
});
```

## Dev vs Production

```typescript
// Automatically handled by import.meta.env.DEV

// Development shows:
// "Network error
//  Suggestions: ...
//  Technical: TypeError: fetch failed at ..."

// Production shows:
// "Network error
//  Suggestions: ..."
```

## Retry Delays

```typescript
getRetryDelay(1) // ~1000-2000ms
getRetryDelay(2) // ~2000-4000ms
getRetryDelay(3) // ~4000-8000ms
getRetryDelay(4) // ~8000-16000ms
getRetryDelay(5) // ~30000ms (capped)
```

## Best Practices

1. ✅ **DO** use `createUserFriendlyError()` for all errors shown to users
2. ✅ **DO** include provider name and operation context
3. ✅ **DO** preserve HTTP status codes on errors
4. ✅ **DO** check `isRetryableError()` before retry logic
5. ✅ **DO** use `getRetryDelay()` for exponential backoff
6. ❌ **DON'T** show raw error messages to users in production
7. ❌ **DON'T** retry non-retryable errors
8. ❌ **DON'T** use fixed retry delays

## Testing

```typescript
import { describe, it, expect } from 'vitest';

it('should handle network errors', () => {
  const error = new TypeError('fetch failed');
  const result = createUserFriendlyError(error);

  expect(result.userMessage).toContain('Network connection');
  expect(result.retryable).toBe(true);
  expect(result.suggestions.length).toBeGreaterThan(0);
});
```

## Cheat Sheet: Error Status Codes

| Code | Type | User Message | Retry |
|------|------|--------------|-------|
| 400 | Bad Request | "Request was invalid..." | No |
| 401 | Unauthorized | "API key is invalid..." | No |
| 403 | Forbidden | "Access denied..." | No |
| 413 | Payload Too Large | "Content is too large..." | No |
| 429 | Rate Limited | "Too many requests..." | Yes |
| 500 | Server Error | "Service experiencing issues..." | Yes |
| 502 | Bad Gateway | "Service experiencing issues..." | Yes |
| 503 | Service Unavailable | "Service experiencing issues..." | Yes |
| 504 | Gateway Timeout | "Request timed out..." | Yes |

## Quick Troubleshooting

| Symptom | Likely Cause | Check |
|---------|--------------|-------|
| "API key is invalid" | Wrong key format | .env.local, key prefix |
| "Too many requests" | Rate limit hit | Wait 1-2 minutes |
| "Network connection failed" | No internet | Connection, firewall |
| "Content is too large" | HTML too big | Shorten presentation |
| "Request timed out" | Model busy | Try again, use faster model |

## Links

- Full Documentation: `docs/ERROR_HANDLING.md`
- Implementation Guide: `docs/ERROR_HANDLING_CHANGES.md`
- Test Suite: `tests/error-handler.test.ts`
- Main Handler: `services/error-handler.ts`
