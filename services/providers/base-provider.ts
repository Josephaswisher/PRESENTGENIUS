/**
 * Base Provider Class for Direct AI API Access
 * Shared optimization logic extracted from openrouter.ts
 * Preserves all 4 optimization strategies from OPTIMIZATION_COMPLETE.md
 */

import { createUserFriendlyError, formatErrorMessage } from '../error-handler';

export interface FileInput {
  base64: string;
  mimeType: string;
}

export interface GenerationOptions {
  activityId?: string;
  learnerLevel?: string;
  modelId?: string;
  useCitations?: boolean; // Enable Perplexity citation enhancement
  outputFormat?: 'html' | 'json' | 'text'; // Expected output format (default: 'html')
}

export type ProgressCallback = (
  phase: string,
  progress: number,
  message?: string,
  error?: any,
  partialContent?: string // Streaming HTML content for real-time preview
) => void;

export interface ProviderConfig {
  endpoint: string;
  getApiKey: () => string;
  modelId: string;
  maxRetries?: number;
  timeout?: number;
}

/**
 * Abstract base class for all AI providers
 * Implements shared optimizations: compression, truncation, retry, warnings
 */
export abstract class BaseProvider {
  protected config: ProviderConfig;
  protected readonly MAX_RETRIES: number;
  protected readonly TIMEOUT_MS: number;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.MAX_RETRIES = config.maxRetries || 3;
    this.TIMEOUT_MS = config.timeout || 300000; // 5 minutes default timeout
  }

  // ===== OPTIMIZATION 1: HTML COMPRESSION & TRUNCATION =====
  // Copied from openrouter.ts lines 312-322

  /**
   * Compress HTML to reduce token usage (20-40% savings)
   */
  protected compressHtml(html: string): string {
    return html
      // Remove HTML comments
      .replace(/<!--[\s\S]*?-->/g, '')
      // Remove extra whitespace between tags
      .replace(/>\s+</g, '><')
      // Collapse multiple spaces to single space
      .replace(/\s{2,}/g, ' ')
      // Remove leading/trailing whitespace
      .trim();
  }

  /**
   * Smart HTML truncation to prevent 413 errors
   * Copied from openrouter.ts lines 329-381
   * Keeps <head> section intact, truncates <body> content to fit within size limits
   * Target: Keep total message under 80 KB to avoid API payload errors
   */
  protected truncateHtmlForRefinement(
    html: string,
    maxBytes: number = 80000
  ): { html: string; wasTruncated: boolean } {
    const compressed = this.compressHtml(html);

    // If already small enough, return as-is
    if (compressed.length <= maxBytes) {
      return { html: compressed, wasTruncated: false };
    }

    console.warn(
      `⚠️ [${this.config.modelId}] HTML too large (${compressed.length} bytes), truncating to ${maxBytes} bytes`
    );

    // Extract <head> section (essential for styles/scripts)
    const headMatch = compressed.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    const headSection = headMatch ? headMatch[0] : '';

    // Extract opening tags
    const htmlOpenMatch = compressed.match(/^<!DOCTYPE[^>]*>[\s]*<html[^>]*>/i);
    const htmlOpen = htmlOpenMatch ? htmlOpenMatch[0] : '<!DOCTYPE html><html>';

    const bodyOpenMatch = compressed.match(/<body[^>]*>/i);
    const bodyOpen = bodyOpenMatch ? bodyOpenMatch[0] : '<body>';

    // Calculate how much space we have for body content
    const overhead =
      htmlOpen.length +
      headSection.length +
      bodyOpen.length +
      '</body></html>'.length +
      200; // 200 byte safety margin
    const availableBodyBytes = maxBytes - overhead;

    // Extract body content and truncate
    const bodyMatch = compressed.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const fullBodyContent = bodyMatch ? bodyMatch[1] : '';

    // Smart truncation: Try to keep complete sections
    let truncatedBody = fullBodyContent.substring(0, availableBodyBytes);

    // Try to end at a closing tag to maintain HTML validity
    const lastClosingTag = truncatedBody.lastIndexOf('</');
    if (lastClosingTag > availableBodyBytes * 0.8) {
      // Only if we're not losing too much
      truncatedBody = truncatedBody.substring(0, lastClosingTag);
    }

    // Add truncation notice
    const truncationNotice =
      '<div class="truncated-notice" style="display:none;"><!-- Content truncated for API transmission --></div>';

    const result = `${htmlOpen}${headSection}${bodyOpen}${truncatedBody}${truncationNotice}</body></html>`;

    console.log(`📊 [${this.config.modelId}] Truncation results:`, {
      originalSize: compressed.length,
      truncatedSize: result.length,
      reduction: `${((1 - result.length / compressed.length) * 100).toFixed(1)}%`,
      keptHeadSection: !!headSection,
      bodyContentKept: `${((truncatedBody.length / fullBodyContent.length) * 100).toFixed(1)}%`,
    });

    return { html: result, wasTruncated: true };
  }

  // ===== OPTIMIZATION 2: USAGE WARNINGS & MONITORING =====

  /**
   * Log context usage warnings to help users avoid errors
   * Thresholds: 80% warning, 90% error
   */
  protected logUsageWarnings(
    htmlLength: number,
    instructionLength: number,
    modelLimit: number,
    modelId: string
  ): void {
    const estimatedTokens = Math.ceil((htmlLength + instructionLength) / 4);
    const contextUsage = (estimatedTokens / modelLimit) * 100;

    console.log(`📊 [${modelId}] Request details:`, {
      htmlLength,
      instructionLength,
      estimatedTokens,
      modelLimit,
      contextUsage: `${contextUsage.toFixed(1)}%`,
    });

    if (contextUsage > 90) {
      console.error(
        `❌ [${modelId}] Using ${contextUsage.toFixed(1)}% of model context! Likely to fail!`
      );
      console.error(`💡 [${modelId}] Content too large - try a shorter presentation`);
    } else if (contextUsage > 80) {
      console.warn(
        `⚠️ [${modelId}] Using ${contextUsage.toFixed(1)}% of model context! Risk of errors.`
      );
      console.warn(`💡 [${modelId}] Consider: Shorter presentations or smaller refinements`);
    }
  }

  // ===== RETRY LOGIC WITH EXPONENTIAL BACKOFF =====
  // Copied from openrouter.ts makeOpenRouterRequest retry logic

  /**
   * Create timeout promise to prevent hanging requests
   * Copied from openrouter.ts lines 99-111
   */
  protected createTimeoutPromise<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Request timed out'));
      }, timeout);

      promise
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timeoutId));
    });
  }

  /**
   * Calculate exponential backoff delay with jitter
   */
  protected getRetryDelay(attempt: number, baseDelay = 1000): number {
    // Exponential backoff: 1s, 2s, 4s, 8s (capped at 30s)
    const delay = Math.min(baseDelay * Math.pow(2, attempt), 30000);
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  }

  /**
   * Check if error is retryable (network, rate limit, server errors)
   */
  protected isRetryableError(error: any): boolean {
    const message = error?.message?.toLowerCase() || '';
    const status = error?.status || error?.statusCode;

    return (
      status === 429 || // Rate limit
      status >= 500 || // Server errors
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('econnrefused') ||
      message.includes('enotfound')
    );
  }

  /**
   * Make API request with automatic retry on transient failures
   */
  protected async makeRequestWithRetry<T>(
    requestFn: () => Promise<T>,
    onProgress?: ProgressCallback,
    attempt = 1
  ): Promise<T> {
    try {
      return await this.createTimeoutPromise(requestFn(), this.TIMEOUT_MS);
    } catch (error: any) {
      const isRetryable = this.isRetryableError(error);

      if (isRetryable && attempt < this.MAX_RETRIES) {
        const delay = this.getRetryDelay(attempt);
        const seconds = Math.ceil(delay / 1000);
        onProgress?.(
          'retrying',
          0,
          `⏳ Retrying in ${seconds}s... (${attempt}/${this.MAX_RETRIES})`
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.makeRequestWithRetry(requestFn, onProgress, attempt + 1);
      }

      throw error;
    }
  }

  // ===== PROVIDER-SPECIFIC ERROR HANDLING =====

  /**
   * Handle provider-specific errors with user-friendly messages
   * Uses the error-handler utility for consistent, actionable error messages
   */
  protected handleProviderError(error: any, providerName: string): never {
    const status = error?.status || error?.statusCode;

    console.error(`❌ [${providerName}] Error:`, {
      message: error?.message,
      status,
      error,
    });

    // Use error handler to create user-friendly error messages
    const userFriendlyError = createUserFriendlyError(error, {
      provider: providerName,
      statusCode: status,
    });

    const formattedMessage = formatErrorMessage(userFriendlyError);

    // Create enhanced error with validation property for backwards compatibility
    const enhancedError: any = new Error(userFriendlyError.userMessage);
    enhancedError.validation = {
      isValid: false,
      suggestions: userFriendlyError.suggestions,
      retryable: userFriendlyError.retryable,
      severity: userFriendlyError.severity,
      technicalMessage: userFriendlyError.technicalMessage,
    };
    enhancedError.formattedMessage = formattedMessage;
    enhancedError.status = status;

    throw enhancedError;
  }

  // ===== ABSTRACT METHODS (MUST BE IMPLEMENTED BY SUBCLASSES) =====

  /**
   * Generate new presentation from prompt
   */
  abstract generate(
    prompt: string,
    files: FileInput[],
    options: GenerationOptions,
    onProgress?: ProgressCallback
  ): Promise<string>;

  /**
   * Refine existing presentation with instructions
   */
  abstract refine(
    currentHtml: string,
    instruction: string,
    modelId?: string,
    onProgress?: ProgressCallback
  ): Promise<string>;
}
