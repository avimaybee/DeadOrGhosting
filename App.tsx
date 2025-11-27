import React, { useState, useRef, useEffect } from 'react';
import { analyzeGhosting } from './services/geminiService';
import { LoadingScreen } from './components/LoadingScreen';
import { ResultCard } from './components/ResultCard';
import { Simulator } from './components/Simulator';
import { AppState, GhostResult } from './types';

type Module = 'standby' | 'simulator' | 'investigator';

// --- VISUAL ASSETS ---
const StarBurst = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
  </svg>
);

const AbstractGrid = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.5" className={className}>
    <path d="M0 20H100 M0 40H100 M0 60H100 M0 80H100" opacity="0.3"/>
    <path d="M20 0V100 M40 0V100 M60 0V100 M80 0V100" opacity="0.3"/>
    <circle cx="50" cy="50" r="30" strokeWidth="1" />
    <path d="M50 20V80 M20 50H80" />
  </svg>
);

const ArrowIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const CornerNodes = ({ className }: { className?: string }) => (
  <div className={`pointer-events-none absolute inset-0 z-50 ${className}`}>
    {/* Top Left */}
    <div className="absolute top-0 left-0">
      <div className="w-2 h-2 border-t border-l border-zinc-500"></div>
      <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 text-zinc-600 text-[8px]">+</div>
    </div>
    {/* Top Right */}
    <div className="absolute top-0 right-0">
       <div className="w-2 h-2 border-t border-r border-zinc-500"></div>
       <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 text-zinc-600 text-[8px]">+</div>
    </div>
    {/* Bottom Left */}
    <div className="absolute bottom-0 left-0">
       <div className="w-2 h-2 border-b border-l border-zinc-500"></div>
       <div className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 text-zinc-600 text-[8px]">+</div>
    </div>
    {/* Bottom Right */}
    <div className="absolute bottom-0 right-0">
       <div className="w-2 h-2 border-b border-r border-zinc-500"></div>
       <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 text-zinc-600 text-[8px]">+</div>
    </div>
  </div>
);

const SystemTicker = () => (
  <div className="w-full bg-black border-t border-zinc-800 py-1 overflow-hidden shrink-0 flex items-center relative z-50">
    <div className="whitespace-nowrap animate-marquee flex gap-8">
      {[...Array(5)].map((_, i) => (
        <React.Fragment key={i}>
          <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
             <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse"></span>
             SYSTEM: ONLINE
          </span>
          <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-[0.2em]">
             // TARGET: LOCKED
          </span>
          <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-[0.2em]">
             // DETECTING LIES
          </span>
          <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-[0.2em]">
             // PROTOCOL: ROAST
          </span>
          <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-[0.2em] text-hard-gold">
             *** DO NOT TEXT BACK ***
          </span>
        </React.Fragment>
      ))}
    </div>
  </div>
);

// --- COMPONENT: SIDE DOCK ---
const SideDock = ({ activeModule, setModule }: { activeModule: Module, setModule: (m: Module) => void }) => {
  return (
    <div className="w-16 md:w-20 border-r border-zinc-800 bg-matte-base flex flex-col items-center py-6 z-50 h-full relative">
      <div className="mb-10">
        <StarBurst className="w-6 h-6 text-white animate-spin-slow" />
      </div>
      
      <div className="flex-1 flex flex-col gap-8 w-full px-2">
        <DockItem 
          active={activeModule === 'standby'} 
          onClick={() => setModule('standby')}
          label="SYS"
          index="01"
        />
        <DockItem 
          active={activeModule === 'investigator'} 
          onClick={() => setModule('investigator')}
          label="SCAN"
          index="02"
        />
        <DockItem 
          active={activeModule === 'simulator'} 
          onClick={() => setModule('simulator')}
          label="SIM"
          index="03"
        />
      </div>

      <div className="mt-auto flex flex-col items-center gap-4 text-[9px] font-mono text-zinc-600">
        <div className="writing-vertical-lr tracking-widest uppercase opacity-30 hover:opacity-100 transition-opacity cursor-default">
            THE BLOCK V3.1
        </div>
      </div>
    </div>
  );
};

const DockItem = ({ active, onClick, label, index }: { active: boolean, onClick: () => void, label: string, index: string }) => (
  <button 
    onClick={onClick}
    className="w-full flex flex-col items-center justify-center gap-1 group relative"
  >
    <div className={`w-1 h-1 rounded-full mb-2 transition-all duration-300 ${active ? 'bg-hard-gold w-1.5 h-1.5' : 'bg-zinc-800 group-hover:bg-zinc-600'}`}></div>
    <span className={`text-[10px] font-bold tracking-widest relative z-10 writing-vertical-lr py-2 transition-colors ${active ? 'text-white' : 'text-zinc-600 group-hover:text-zinc-400'}`}>
        {label}
    </span>
    <span className="absolute -right-2 top-0 text-[8px] text-zinc-800 font-mono opacity-0 group-hover:opacity-100 transition-opacity">{index}</span>
  </button>
);

// --- COMPONENT: STANDBY SCREEN (EDITORIAL) ---
const StandbyScreen = ({ onActivate }: { onActivate: (m: Module) => void }) => (
  <div className="h-full w-full flex flex-col relative overflow-hidden bg-matte-base">
    
    {/* Background Decor */}
    <div className="absolute top-0 right-0 w-[50%] h-full border-l border-zinc-900/50 hidden md:block"></div>
    <AbstractGrid className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] text-zinc-800 opacity-20 pointer-events-none animate-spin-slow" />

    {/* CONTENT GRID */}
    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 h-full">
        
        {/* LEFT: HERO */}
        <div className="p-8 md:p-16 flex flex-col justify-center relative z-10 border-b md:border-b-0 md:border-r border-zinc-800">
            <div className="mb-8">
                <span className="label-sm text-hard-gold mb-2 block">RELATIONSHIP FORENSICS UNIT</span>
                <h1 className="text-[5rem] md:text-[8rem] lg:text-[10rem] leading-[0.8] font-impact text-white mb-6">
                    THE<br/>BLOCK
                </h1>
                <p className="text-zinc-500 max-w-sm text-sm leading-relaxed font-editorial">
                    Advanced algorithmic analysis for modern ghosting phenomena. 
                    Identify patterns, predict outcomes, and restore dignity.
                </p>
            </div>
            
            {/* AURA PILL */}
            <div className="flex items-center gap-4">
                <div className="h-12 px-6 rounded-full bg-zinc-900 border border-zinc-800 flex items-center gap-3 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-red-500/10 animate-pulse-glow"></div>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse relative z-10"></div>
                    <span className="font-mono text-xs text-zinc-300 relative z-10 tracking-widest">SYSTEM_ONLINE</span>
                </div>
                <StarBurst className="w-8 h-8 text-zinc-800" />
            </div>
        </div>

        {/* RIGHT: MODULE SELECTOR */}
        <div className="flex flex-col">
            <button 
                onClick={() => onActivate('investigator')}
                className="flex-1 border-b border-zinc-800 p-8 md:p-12 text-left hover:bg-zinc-900/50 transition-all group relative overflow-hidden flex flex-col justify-center"
            >
                <div className="absolute right-8 top-8 opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <ArrowIcon className="w-12 h-12 text-hard-gold -rotate-45" />
                </div>
                <div className="label-sm text-zinc-500 group-hover:text-hard-gold transition-colors mb-2">MODULE 01</div>
                <h2 className="text-5xl md:text-6xl font-impact text-zinc-300 group-hover:text-white transition-colors uppercase">
                    Investigator
                </h2>
                <div className="mt-4 opacity-50 group-hover:opacity-100 transition-opacity max-w-md text-xs font-mono text-zinc-400">
                    // RUN DIAGNOSTICS. DETECT LIES.
                </div>
            </button>

            <button 
                onClick={() => onActivate('simulator')}
                className="flex-1 p-8 md:p-12 text-left hover:bg-zinc-900/50 transition-all group relative overflow-hidden flex flex-col justify-center"
            >
                <div className="absolute right-8 top-8 opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <ArrowIcon className="w-12 h-12 text-hard-blue -rotate-45" />
                </div>
                <div className="label-sm text-zinc-500 group-hover:text-hard-blue transition-colors mb-2">MODULE 02</div>
                <h2 className="text-5xl md:text-6xl font-impact text-zinc-300 group-hover:text-white transition-colors uppercase">
                    Simulator
                </h2>
                <div className="mt-4 opacity-50 group-hover:opacity-100 transition-opacity max-w-md text-xs font-mono text-zinc-400">
                    // TEST SCENARIOS. PREVENT CRINGE.
                </div>
            </button>
        </div>
    </div>
  </div>
);

// --- MAIN APP COMPONENT ---
function App() {
  const [activeModule, setActiveModule] = useState<Module>('standby');
  const [state, setState] = useState<AppState>('landing');
  
  // Investigator State
  const [investigateMode, setInvestigateMode] = useState<'text' | 'screenshot'>('screenshot');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [lastMessage, setLastMessage] = useState('');
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [result, setResult] = useState<GhostResult | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      fileArray.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          const base64Data = base64String.split(',')[1];
          setPreviewUrls(prev => [...prev, base64String]);
          setScreenshots(prev => [...prev, base64Data]);
        };
        reader.readAsDataURL(file as Blob);
      });
    }
  };

  const handleSubmitInvestigation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (investigateMode === 'text' && !name) return;
    if (investigateMode === 'screenshot' && screenshots.length === 0) return;
    
    setState('loading');
    
    try {
      const [_, data] = await Promise.all([
        new Promise(resolve => setTimeout(resolve, 3000)),
        analyzeGhosting(name, city, lastMessage, investigateMode === 'screenshot' ? screenshots : undefined)
      ]);
      setResult(data);
      setState('results');
    } catch (error) {
      console.error(error);
      setState('error');
    }
  };

  const resetInvestigation = () => {
    setState('landing');
    setResult(null);
    setScreenshots([]);
    setPreviewUrls([]);
    setLastMessage('');
    setName('');
    setCity('');
  };

  const hasScreenshots = investigateMode === 'screenshot' && screenshots.length > 0;

  return (
    <div className="flex h-screen w-screen bg-matte-base text-zinc-100 overflow-hidden font-sans selection:bg-white selection:text-black">
      
      <SideDock activeModule={activeModule} setModule={setActiveModule} />
      
      {/* MAIN CONTAINER */}
      <div className="flex-1 relative h-full flex flex-col p-2 md:p-4 overflow-hidden">
        
        {/* VIEWPORT FRAME */}
        <div className="relative w-full h-full border border-zinc-800 bg-black/20 overflow-hidden flex flex-col shadow-2xl">
            <CornerNodes />

            {state === 'loading' && <LoadingScreen />}

            {/* STANDBY MODULE */}
            {activeModule === 'standby' && (
                <StandbyScreen onActivate={setActiveModule} />
            )}

            {/* SIMULATOR MODULE */}
            {activeModule === 'simulator' && (
                <div className="h-full w-full flex flex-col animate-fade-in bg-matte-base">
                    <Simulator onPivotToInvestigator={() => setActiveModule('investigator')} />
                </div>
            )}

            {/* INVESTIGATOR MODULE */}
            {activeModule === 'investigator' && (
                <div className="h-full w-full flex flex-col animate-fade-in bg-matte-base">
                
                {state === 'landing' && (
                    <div className="h-full flex items-center justify-center p-6 relative">
                        {/* Background Topo */}
                        <div className="absolute inset-0 bg-topo-pattern opacity-10 pointer-events-none"></div>

                        <div className="w-full max-w-5xl bg-zinc-900 border border-zinc-800 shadow-2xl relative overflow-hidden group">
                             <CornerNodes className="opacity-50" />
                            <div className="grid md:grid-cols-2 h-full min-h-[500px]">
                                {/* Left Panel */}
                                <div className="p-10 border-r border-zinc-800 flex flex-col justify-between bg-zinc-900 relative">
                                    <div className="absolute inset-0 bg-scan-lines opacity-10 pointer-events-none"></div>
                                    <div className="relative z-10">
                                        <div className="label-sm text-hard-gold mb-4 border border-zinc-700 w-fit px-2 py-1 flex items-center gap-2">
                                          <div className="w-1.5 h-1.5 bg-hard-gold animate-pulse"></div>
                                          CASE FILE #001
                                        </div>
                                        <h2 className="text-5xl font-impact text-white mb-6 leading-none">INITIATE<br/>SCAN</h2>
                                        <p className="text-zinc-400 text-sm font-editorial leading-relaxed max-w-sm">
                                            Upload chat logs or manually input data to run a full forensic analysis. The truth hurts, but ambiguity kills.
                                        </p>
                                    </div>
                                    <div className="space-y-4 mt-12 relative z-10">
                                        <button 
                                            onClick={() => setInvestigateMode('screenshot')}
                                            className={`w-full p-4 border text-left transition-all relative group ${investigateMode === 'screenshot' ? 'bg-white text-black border-white' : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'}`}
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <div className="font-bold text-xs uppercase tracking-wider">Method A: OCR</div>
                                                {investigateMode === 'screenshot' && <StarBurst className="w-4 h-4" />}
                                            </div>
                                            <div className={`text-[10px] uppercase tracking-widest ${investigateMode === 'screenshot' ? 'opacity-100' : 'opacity-50'}`}>Upload Evidence</div>
                                        </button>
                                        <button 
                                            onClick={() => setInvestigateMode('text')}
                                            className={`w-full p-4 border text-left transition-all relative group ${investigateMode === 'text' ? 'bg-white text-black border-white' : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'}`}
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <div className="font-bold text-xs uppercase tracking-wider">Method B: Manual</div>
                                                {investigateMode === 'text' && <StarBurst className="w-4 h-4" />}
                                            </div>
                                            <div className={`text-[10px] uppercase tracking-widest ${investigateMode === 'text' ? 'opacity-100' : 'opacity-50'}`}>Input Text</div>
                                        </button>
                                    </div>
                                </div>

                                {/* Right Form */}
                                <div className="p-10 flex flex-col justify-center bg-zinc-900/50">
                                    <form onSubmit={handleSubmitInvestigation} className="space-y-6">
                                        {investigateMode === 'screenshot' ? (
                                            <div 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="border border-dashed border-zinc-700 bg-zinc-900/50 h-48 flex flex-col items-center justify-center cursor-pointer hover:border-white transition-all group relative overflow-hidden"
                                            >
                                            {previewUrls.length > 0 ? (
                                                <div className="absolute inset-0 p-4 flex gap-2 overflow-x-auto items-center bg-black/80">
                                                    {previewUrls.map((url, i) => (
                                                        <img key={i} src={url} className="h-full border border-zinc-700" />
                                                    ))}
                                                    <div className="h-12 w-12 flex items-center justify-center bg-zinc-800 text-white font-bold">+</div>
                                                </div>
                                            ) : (
                                                <>
                                                <div className="w-12 h-12 bg-zinc-800 flex items-center justify-center mb-3 group-hover:bg-white group-hover:text-black transition-colors">
                                                    <span className="text-xl">↓</span>
                                                </div>
                                                <span className="label-sm">DROP SCREENSHOTS</span>
                                                </>
                                            )}
                                            <input 
                                                type="file" 
                                                multiple 
                                                accept="image/*"
                                                ref={fileInputRef}
                                                className="hidden"
                                                onChange={handleFileChange}
                                            />
                                            </div>
                                        ) : (
                                            <textarea
                                            required
                                            placeholder="PASTE THE LAST MESSAGE..."
                                            className="w-full bg-zinc-900 border border-zinc-700 p-4 text-white focus:border-white focus:outline-none h-48 resize-none font-mono text-xs uppercase placeholder-zinc-700"
                                            value={lastMessage}
                                            onChange={e => setLastMessage(e.target.value)}
                                            />
                                        )}

                                        <div className="grid grid-cols-2 gap-4">
                                            <input 
                                            type="text" 
                                            required={!hasScreenshots}
                                            placeholder="TARGET NAME"
                                            className="bg-zinc-900 border border-zinc-700 p-3 text-white focus:border-white focus:outline-none text-xs font-mono uppercase"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            />
                                            <input 
                                            type="text" 
                                            required={!hasScreenshots}
                                            placeholder="CITY"
                                            className="bg-zinc-900 border border-zinc-700 p-3 text-white focus:border-white focus:outline-none text-xs font-mono uppercase"
                                            value={city}
                                            onChange={e => setCity(e.target.value)}
                                            />
                                        </div>

                                        <button 
                                        type="submit"
                                        className="w-full bg-white text-black font-impact text-2xl py-4 hover:bg-zinc-200 transition-all uppercase tracking-wide border border-white"
                                        >
                                        Run Diagnostic
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {state === 'results' && result && (
                    <div className="h-full w-full overflow-hidden p-2 md:p-6 bg-matte-base">
                        <ResultCard 
                        result={result} 
                        onReset={resetInvestigation} 
                        targetName={result.identifiedName || name || "UNKNOWN"} 
                        />
                    </div>
                )}

                {state === 'error' && (
                    <div className="flex h-full items-center justify-center">
                    <div className="bg-zinc-900 border border-red-900 p-10 text-center max-w-lg">
                        <h2 className="text-4xl font-impact text-red-600 mb-2">SYSTEM ERROR</h2>
                        <p className="font-mono text-zinc-500 mb-6 text-sm">CONNECTION DROPPED.</p>
                        <button onClick={resetInvestigation} className="bg-white text-black font-bold py-3 px-8 hover:bg-zinc-200 uppercase tracking-widest text-xs">Reboot</button>
                    </div>
                    </div>
                )}
                </div>
            )}
        </div>
        
        {/* SYSTEM TICKER */}
        <SystemTicker />

      </div>
    </div>
  );
}

export default App;