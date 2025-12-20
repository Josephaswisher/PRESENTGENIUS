/**
 * Retry utility with exponential backoff
 * Used for resilient API calls to AI providers
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  onRetry?: (error: Error, attempt: number) => void;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    onRetry
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Check if error is retryable
      if (!isRetryableError(error)) {
        throw lastError;
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      const jitter = Math.random() * 0.3 * delay; // Add 0-30% jitter
      
      if (onRetry) {
        onRetry(lastError, attempt + 1);
      }

      console.log(`[Retry] Attempt ${attempt + 1}/${maxRetries} failed, retrying in ${Math.round(delay + jitter)}ms...`);
      await sleep(delay + jitter);
    }
  }

  throw lastError!;
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Rate limiting
    if (message.includes('rate limit') || message.includes('429')) return true;
    
    // Temporary server errors
    if (message.includes('500') || message.includes('502') || message.includes('503')) return true;
    
    // Network errors
    if (message.includes('network') || message.includes('timeout') || message.includes('econnreset')) return true;
    
    // Overloaded
    if (message.includes('overloaded') || message.includes('capacity')) return true;
  }
  
  return false;
}

export function createRetryableFunction<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options?: RetryOptions
): T {
  return ((...args: Parameters<T>) => withRetry(() => fn(...args), options)) as T;
}
