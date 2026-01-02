/**
 * QR Code Display - Shows QR code for audience to join follow-along
 */
import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  XMarkIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  DevicePhoneMobileIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import {
  createSession,
  getFollowAlongUrl,
  SessionState,
} from '../services/audience-sync';

interface QRCodeDisplayProps {
  title: string;
  totalSlides: number;
  onSessionCreated?: (session: SessionState) => void;
  onClose: () => void;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  title,
  totalSlides,
  onSessionCreated,
  onClose,
}) => {
  const [session, setSession] = useState<SessionState | null>(null);
  const [copied, setCopied] = useState(false);
  const [audienceCount, setAudienceCount] = useState(0);

  useEffect(() => {
    const initSession = async () => {
      // Create a new session with a temporary presenter ID if not logged in
      const presenterId = `host-${Date.now()}`;
      const newSession = await createSession(title, totalSlides, presenterId);
      setSession(newSession);
      if (onSessionCreated) {
        onSessionCreated(newSession);
      }
    };
    initSession();
  }, [title, totalSlides, onSessionCreated]);

  const followUrl = session ? getFollowAlongUrl(session.code) : '';

  const copyToClipboard = async () => {
    if (!session) return;
    
    try {
      await navigator.clipboard.writeText(followUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const copyCode = async () => {
    if (!session) return;
    
    try {
      await navigator.clipboard.writeText(session.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 max-w-md w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <DevicePhoneMobileIcon className="w-5 h-5 text-cyan-400" />
            <span className="font-medium text-white">Follow Along</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code */}
        <div className="p-8 flex flex-col items-center">
          <div className="bg-white p-4 rounded-xl mb-6">
            <QRCodeSVG
              value={followUrl}
              size={200}
              level="M"
              includeMargin={false}
            />
          </div>

          {/* Session Code */}
          <div className="text-center mb-4">
            <p className="text-zinc-400 text-sm mb-2">Or enter code:</p>
            <div className="flex items-center gap-2 justify-center">
              <span className="text-4xl font-mono font-bold text-white tracking-widest">
                {session.code}
              </span>
              <button
                onClick={copyCode}
                className="p-2 text-zinc-400 hover:text-cyan-400 transition-colors"
                title="Copy code"
              >
                {copied ? (
                  <CheckIcon className="w-5 h-5 text-green-400" />
                ) : (
                  <ClipboardDocumentIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* URL */}
          <div className="w-full">
            <div className="flex items-center gap-2 p-2 bg-zinc-800 rounded-lg">
              <input
                type="text"
                value={followUrl}
                readOnly
                className="flex-1 bg-transparent text-sm text-zinc-300 outline-none truncate"
              />
              <button
                onClick={copyToClipboard}
                className="p-1.5 text-zinc-400 hover:text-cyan-400 transition-colors"
                title="Copy URL"
              >
                {copied ? (
                  <CheckIcon className="w-4 h-4 text-green-400" />
                ) : (
                  <ClipboardDocumentIcon className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-zinc-800/50 border-t border-zinc-800">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-zinc-400">
              <UsersIcon className="w-4 h-4" />
              <span>{audienceCount} connected</span>
            </div>
            <div className="text-zinc-500">
              {totalSlides} slides • {title}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="px-4 py-3 bg-cyan-500/5 border-t border-cyan-500/20">
          <p className="text-xs text-cyan-400 text-center">
            Audience can scan QR code or visit the URL to follow along on their phones
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRCodeDisplay;
