import React, { useState, useEffect } from 'react';

const LOADING_PHRASES = [
  "INITIALIZING SCAN",
  "ACCESSING PUBLIC RECORDS",
  "TRIANGULATING SIGNALS",
  "ANALYZING BEHAVIOR",
  "DECODING VIBES",
  "CHECKING ALIBIS",
  "REVIEWING EVIDENCE"
];

export const LoadingScreen: React.FC = () => {
  const [phrase, setPhrase] = useState(LOADING_PHRASES[0]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        const jump = Math.floor(Math.random() * 8) + 1;
        return Math.min(prev + jump, 100);
      });

      if (Math.random() > 0.8) {
        setPhrase(LOADING_PHRASES[Math.floor(Math.random() * LOADING_PHRASES.length)]);
      }

    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-matte-base flex flex-col items-center justify-center p-4">
      
      <div className="w-full max-w-md relative text-center">
        
        <div className="mb-12">
            <h1 className="text-[10rem] font-impact text-zinc-900 leading-none select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap opacity-20 z-0">
                LOADING
            </h1>
            <div className="relative z-10 text-8xl font-impact text-white">
                {progress}%
            </div>
        </div>

        <div className="relative z-10 border-t border-zinc-800 pt-6 inline-block w-full">
            <div className="label-sm text-zinc-500 mb-2">SYSTEM STATUS</div>
            <div className="font-editorial text-xl text-zinc-300 animate-pulse uppercase tracking-widest">
                {phrase}...
            </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="w-full h-1 bg-zinc-900 mt-12 relative overflow-hidden">
            <div 
                className="h-full bg-white transition-all duration-100 ease-out"
                style={{ width: `${progress}%` }}
            ></div>
        </div>

      </div>
    </div>
  );
};