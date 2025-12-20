/**
 * AuthModal Component
 *
 * Modal for user authentication with:
 * - Magic link email sign-in
 * - OAuth providers (Google, GitHub)
 * - Clean, dark-themed UI matching the app design
 */

import React, { useState } from 'react';
import {
  XMarkIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signInWithEmail, signInWithOAuth, isConfigured } = useAuth();

  if (!isOpen) return null;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setError(null);

    const { error } = await signInWithEmail(email);

    if (error) {
      setError(error.message);
    } else {
      setEmailSent(true);
    }
    setIsSubmitting(false);
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    setError(null);
    const { error } = await signInWithOAuth(provider);
    if (error) {
      setError(error.message);
    }
  };

  const handleClose = () => {
    setEmail('');
    setEmailSent(false);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-violet-500/20 mb-4">
            <span className="text-2xl">🧬</span>
          </div>
          <h2 className="text-xl font-semibold text-zinc-100">
            Sign in to VibePresenterPro
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Save, sync, and share your medical education content
          </p>
        </div>

        {!isConfigured ? (
          <div className="text-center py-6">
            <ExclamationCircleIcon className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <p className="text-zinc-300">Cloud features not configured</p>
            <p className="text-sm text-zinc-500 mt-2">
              Add Supabase credentials to enable sign-in
            </p>
          </div>
        ) : emailSent ? (
          <div className="text-center py-6">
            <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-zinc-100 font-medium">Check your email!</p>
            <p className="text-sm text-zinc-400 mt-2">
              We sent a magic link to <span className="text-zinc-200">{email}</span>
            </p>
            <button
              onClick={() => setEmailSent(false)}
              className="mt-4 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <>
            {/* Email form */}
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !email.trim()}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:from-zinc-700 disabled:to-zinc-700 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Continue with Email'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-700" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-zinc-900 text-zinc-500">or continue with</span>
              </div>
            </div>

            {/* OAuth buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleOAuth('google')}
                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-zinc-200 text-sm font-medium transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </button>
              <button
                onClick={() => handleOAuth('github')}
                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-zinc-200 text-sm font-medium transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
                GitHub
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                {error}
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <p className="mt-6 text-xs text-center text-zinc-500">
          By signing in, you agree to our terms of service and privacy policy
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
