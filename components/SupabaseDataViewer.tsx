/**
 * Supabase Data Viewer
 * View saved presentations directly in the app
 */
import React, { useState, useEffect } from 'react';
import { XMarkIcon, ArrowPathIcon, CloudIcon } from '@heroicons/react/24/outline';
import { getPresentations, getPromptHistory, Presentation, PromptHistory } from '../services/supabase';

interface SupabaseDataViewerProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadPresentation?: (presentation: Presentation) => void;
}

export const SupabaseDataViewer: React.FC<SupabaseDataViewerProps> = ({
  isOpen,
  onClose,
  onLoadPresentation
}) => {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [promptHistory, setPromptHistory] = useState<PromptHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'presentations' | 'history'>('presentations');

  const loadData = async () => {
    setLoading(true);
    try {
      const [pres, hist] = await Promise.all([
        getPresentations(),
        getPromptHistory()
      ]);
      setPresentations(pres);
      setPromptHistory(hist);
    } catch (error) {
      console.error('Failed to load Supabase data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col border border-zinc-800">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <CloudIcon className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Supabase Cloud Storage</h2>
              <p className="text-xs text-zinc-500">View your saved presentations</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 hover:bg-zinc-800 rounded-lg transition text-zinc-400 hover:text-white"
              title="Refresh"
            >
              <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-lg transition text-zinc-400 hover:text-white"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800">
          <button
            onClick={() => setActiveTab('presentations')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
              activeTab === 'presentations'
                ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/5'
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            Presentations ({presentations.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
              activeTab === 'history'
                ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/5'
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            Prompt History ({promptHistory.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <ArrowPathIcon className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-2" />
                <p className="text-zinc-400 text-sm">Loading data...</p>
              </div>
            </div>
          ) : activeTab === 'presentations' ? (
            <div className="space-y-3">
              {presentations.length === 0 ? (
                <div className="text-center py-12">
                  <CloudIcon className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500">No presentations saved yet</p>
                  <p className="text-zinc-600 text-sm mt-1">
                    Generate a presentation to see it here
                  </p>
                </div>
              ) : (
                presentations.map((pres) => (
                  <div
                    key={pres.id}
                    className="bg-zinc-800/50 rounded-xl p-4 hover:bg-zinc-800 transition-all cursor-pointer group"
                    onClick={() => onLoadPresentation?.(pres)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-white group-hover:text-cyan-400 transition">
                        {pres.name}
                      </h3>
                      <span className="text-xs text-zinc-500 shrink-0">
                        {new Date(pres.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {pres.prompt && (
                      <p className="text-sm text-zinc-400 mb-2 line-clamp-2">
                        {pres.prompt}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-xs">
                      {pres.provider && (
                        <span className="px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded">
                          {pres.provider}
                        </span>
                      )}
                      <span className="text-zinc-600">
                        {new Date(pres.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {promptHistory.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-zinc-500">No prompt history yet</p>
                </div>
              ) : (
                promptHistory.map((hist) => (
                  <div
                    key={hist.id}
                    className="bg-zinc-800/50 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm text-white flex-1">{hist.prompt}</p>
                      <span className="text-xs text-zinc-500 shrink-0 ml-3">
                        {new Date(hist.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {hist.response_preview && (
                      <p className="text-xs text-zinc-500 mb-2 line-clamp-2">
                        {hist.response_preview}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-xs">
                      {hist.provider && (
                        <span className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded">
                          {hist.provider}
                        </span>
                      )}
                      {hist.tokens_used && (
                        <span className="text-zinc-600">
                          {hist.tokens_used} tokens
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center justify-between text-xs">
            <div className="text-zinc-500">
              <span className="text-cyan-400 font-semibold">{presentations.length}</span> presentations •
              <span className="text-purple-400 font-semibold ml-1">{promptHistory.length}</span> prompts
            </div>
            <a
              href="https://supabase.com/dashboard/project/vvvywosopdzgoeubpddg"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-cyan-400 transition"
            >
              Open in Supabase →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
