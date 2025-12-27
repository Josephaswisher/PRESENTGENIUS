/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { AcademicCapIcon, BoltIcon } from '@heroicons/react/24/solid';

export const Hero: React.FC = () => {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-32">
      {/* Hero Text Content */}
      <div className="text-center relative z-10 max-w-5xl mx-auto px-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-morphism mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-cyan-400/90 font-bold text-xs tracking-widest uppercase">PresentsGenius Elite</span>
          <span className="text-white/20">|</span>
          <span className="text-zinc-400 text-xs">Medical OS</span>
        </div>

        <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-white mb-8 leading-[0.9] animate-reveal">
          Medical Learning <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-br from-white via-cyan-200 to-cyan-500 drop-shadow-[0_0_30px_rgba(34,211,238,0.3)]">
            Elevated
          </span>.
        </h1>

        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-16 leading-relaxed font-medium animate-reveal animate-stagger-1">
          The world's first medical workspace powered by <span className="text-cyan-400">Gemini 2.0</span> and <span className="text-purple-400">Claude 3.5</span>.
          Turn clinical chaos into teaching pearls in seconds.
        </p>

        {/* Bento Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="md:col-span-2 glass-morphism p-6 rounded-3xl text-left border-cyan-500/20 hover:border-cyan-500/40 transition-all group animate-reveal animate-stagger-2">
            <div className="p-3 bg-cyan-500/10 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform">
              <SparklesIcon className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Perplexity Intelligence</h3>
            <p className="text-sm text-zinc-400">Live medical research integration from UpToDate, MKSAP, and PubMed.</p>
          </div>

          <div className="glass-morphism p-6 rounded-3xl text-left border-purple-500/10 hover:border-purple-500/30 transition-all group animate-reveal animate-stagger-3">
            <div className="p-3 bg-purple-500/10 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform">
              <AcademicCapIcon className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Board-Level</h3>
            <p className="text-sm text-zinc-400">Auto-generate USMLE questions.</p>
          </div>

          <div className="glass-morphism p-6 rounded-3xl text-left border-pink-500/10 hover:border-pink-500/30 transition-all group animate-reveal animate-stagger-4">
            <div className="p-3 bg-pink-500/10 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform">
              <BoltIcon className="w-6 h-6 text-pink-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Case Sim</h3>
            <p className="text-sm text-zinc-400">Interactive patient encounters.</p>
          </div>

          <div className="md:col-span-4 glass-morphism p-1 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-[2rem]">
            <div className="bg-zinc-950/90 rounded-[1.8rem] p-6 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
              <div className="absolute inset-0 bg-grid-white opacity-[0.05]" />
              <div className="relative z-10 text-left">
                <h3 className="text-xl font-bold text-white mb-1">Unleash Your Imagination</h3>
                <p className="text-sm text-zinc-500">Dual AI processing: Synthesis via Claude + Creativity via Gemini.</p>
              </div>
              <div className="relative z-10 flex gap-2">
                <div className="px-4 py-2 bg-white text-black font-bold text-xs rounded-full cursor-pointer hover:scale-105 transition-transform">Get Started</div>
                <div className="px-4 py-2 border border-white/10 text-white font-bold text-xs rounded-full cursor-pointer hover:bg-white/5 transition-colors">Documentation</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
