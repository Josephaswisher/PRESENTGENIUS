/**
 * Safe IFrame Access Helpers
 * Provides safe methods for accessing iframe content with CSP and cross-origin error handling
 */

export interface IFrameResult<T = any> {
  success: boolean;
  data?: T;
  error?: Error;
  errorType?: 'csp' | 'cross-origin' | 'timeout' | 'not-ready' | 'unknown';
  message?: string;
}

/**
 * Safely gets the document from an iframe with CSP error handling
 */
export function getIFrameDocument(
  iframe: HTMLIFrameElement
): IFrameResult<Document> {
  try {
    // Check if iframe exists
    if (!iframe) {
      return {
        success: false,
        errorType: 'not-ready',
        message: 'IFrame element not found',
      };
    }

    // Check if iframe has contentDocument or contentWindow
    const doc = iframe.contentDocument || iframe.contentWindow?.document;

    if (!doc) {
      return {
        success: false,
        errorType: 'not-ready',
        message: 'IFrame content not ready',
      };
    }

    // Try to access the document body to verify we have permission
    const _ = doc.body;

    return {
      success: true,
      data: doc,
    };
  } catch (error) {
    const err = error as Error;

    // Detect error type
    let errorType: IFrameResult['errorType'] = 'unknown';
    let message = 'Could not access iframe content';

    if (
      err.name === 'SecurityError' ||
      err.message?.includes('cross-origin') ||
      err.message?.includes('different origin')
    ) {
      errorType = 'cross-origin';
      message = 'Cannot access iframe from different origin';
    } else if (
      err.message?.includes('CSP') ||
      err.message?.includes('Content Security Policy')
    ) {
      errorType = 'csp';
      message = 'Content Security Policy blocks iframe access';
    }

    return {
      success: false,
      error: err,
      errorType,
      message,
    };
  }
}

/**
 * Safely queries elements inside an iframe
 */
export function queryIFrameElements(
  iframe: HTMLIFrameElement,
  selector: string
): IFrameResult<NodeListOf<Element>> {
  const docResult = getIFrameDocument(iframe);

  if (!docResult.success || !docResult.data) {
    return {
      success: false,
      error: docResult.error,
      errorType: docResult.errorType,
      message: docResult.message,
    };
  }

  try {
    const elements = docResult.data.querySelectorAll(selector);

    return {
      success: true,
      data: elements,
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: err,
      errorType: 'unknown',
      message: `Could not query selector "${selector}"`,
    };
  }
}

/**
 * Waits for iframe to be ready with a timeout
 * Returns a promise that resolves when the iframe is ready or rejects on timeout
 */
export function waitForIFrameReady(
  iframe: HTMLIFrameElement,
  timeoutMs: number = 5000
): Promise<IFrameResult<Document>> {
  return new Promise((resolve) => {
    // Check if already ready
    const initialCheck = getIFrameDocument(iframe);
    if (initialCheck.success) {
      resolve(initialCheck);
      return;
    }

    let timeoutId: NodeJS.Timeout | null = null;
    let resolved = false;

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      iframe.removeEventListener('load', onLoad);
    };

    const onLoad = () => {
      if (resolved) return;
      resolved = true;
      cleanup();

      const result = getIFrameDocument(iframe);
      resolve(result);
    };

    // Set up timeout
    timeoutId = setTimeout(() => {
      if (resolved) return;
      resolved = true;
      cleanup();

      resolve({
        success: false,
        errorType: 'timeout',
        message: `IFrame did not load within ${timeoutMs}ms`,
      });
    }, timeoutMs);

    // Listen for load event
    iframe.addEventListener('load', onLoad);

    // Also check periodically in case load event was missed
    const checkInterval = setInterval(() => {
      if (resolved) {
        clearInterval(checkInterval);
        return;
      }

      const check = getIFrameDocument(iframe);
      if (check.success) {
        resolved = true;
        cleanup();
        clearInterval(checkInterval);
        resolve(check);
      }
    }, 100);

    // Clean up interval on timeout
    if (timeoutId) {
      const originalTimeout = timeoutId;
      timeoutId = setTimeout(() => {
        clearInterval(checkInterval);
        // @ts-ignore
        originalTimeout[Symbol.toPrimitive]();
      }, timeoutMs) as any;
    }
  });
}

/**
 * Safely executes a function within an iframe context
 */
export function executeInIFrame<T>(
  iframe: HTMLIFrameElement,
  fn: (doc: Document) => T
): IFrameResult<T> {
  const docResult = getIFrameDocument(iframe);

  if (!docResult.success || !docResult.data) {
    return {
      success: false,
      error: docResult.error,
      errorType: docResult.errorType,
      message: docResult.message,
    };
  }

  try {
    const result = fn(docResult.data);
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: err,
      errorType: 'unknown',
      message: 'Error executing function in iframe',
    };
  }
}
