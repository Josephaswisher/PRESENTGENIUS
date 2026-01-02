import React, { useEffect, useState } from 'react';

export const BackgroundEffects: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-background">
      {/* Dynamic Cursor Glow */}
      <div
        className="absolute w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] transition-all duration-300 ease-out -translate-x-1/2 -translate-y-1/2"
        style={{ left: mousePos.x, top: mousePos.y }}
      />

      {/* Strategic Glow Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] animate-glow-pulse" />
      <div className="absolute bottom-[10%] right-[-5%] w-[40%] h-[40%] bg-cyan-600/10 rounded-full blur-[150px] animate-glow-pulse" style={{ animationDelay: '-2s' }} />
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-rose-500/5 rounded-full blur-[100px] animate-glow-pulse" style={{ animationDelay: '-4s' }} />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-grid-white bg-[size:32px_32px] opacity-20" />

      {/* Noise Texture */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
};
