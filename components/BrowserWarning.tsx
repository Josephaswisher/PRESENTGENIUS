/**
 * Browser Warning Component
 * Displays a dismissible warning banner for incompatible browsers
 */

import React, { useState, useEffect } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { detectBrowser, checkFeatureSupport } from '../utils/browser-detection';

export const BrowserWarning: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if warning was previously dismissed
    const dismissed = localStorage.getItem('browser-warning-dismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    const browser = detectBrowser();
    const features = checkFeatureSupport();

    // Check for incompatible browsers or missing features
    let message: string | null = null;

    // Check for unsupported browser versions
    if (browser.name === 'safari' && parseFloat(browser.version) < 13) {
      message = 'You are using an older version of Safari. Some features may not work correctly. Please update to Safari 13 or later.';
    } else if (browser.name === 'firefox' && parseFloat(browser.version) < 70) {
      message = 'You are using an older version of Firefox. Some features may not work correctly. Please update to Firefox 70 or later.';
    } else if (browser.name === 'chrome' && parseFloat(browser.version) < 80) {
      message = 'You are using an older version of Chrome. Some features may not work correctly. Please update to Chrome 80 or later.';
    } else if (browser.name === 'edge' && parseFloat(browser.version) < 80) {
      message = 'You are using an older version of Edge. Some features may not work correctly. Please update to Edge 80 or later.';
    }

    // Check for missing critical features
    if (!features.fullscreen && !message) {
      message = 'Your browser does not support fullscreen mode. Presentation features will be limited.';
    }

    // Check for iOS-specific warnings
    if (browser.isIOS && browser.iOSVersion) {
      const iOSVersion = parseFloat(browser.iOSVersion);
      if (iOSVersion < 12) {
        message = 'You are using an older version of iOS. Some features may not work correctly. Please update to iOS 12 or later.';
      }
    }

    if (message) {
      setWarningMessage(message);
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('browser-warning-dismissed', 'true');
  };

  if (!isVisible || isDismissed || !warningMessage) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-slide-down">
      <div className="bg-yellow-500 text-black px-4 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-start gap-3">
          <ExclamationTriangleIcon className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">Browser Compatibility Warning</p>
            <p className="text-sm mt-1 opacity-90">{warningMessage}</p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-black/70 hover:text-black transition-colors flex-shrink-0"
            aria-label="Dismiss warning"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrowserWarning;
