import React, { useState, useRef, useEffect } from 'react';
import { generatePersona, simulateDraft, analyzeSimulation } from '../services/geminiService';
import { SimResult, Persona, SimAnalysisResult } from '../types';

interface SimulatorProps {
  onPivotToInvestigator: () => void;
}

type View = 'setup' | 'chat' | 'analysis';

const CornerNodes = ({ className }: { className?: string }) => (
  <div className={`pointer-events-none absolute inset-0 z-50 ${className}`}>
    <div className="absolute top-0 left-0">
      <div className="w-2 h-2 border-t border-l border-zinc-500"></div>
    </div>
    <div className="absolute top-0 right-0">
       <div className="w-2 h-2 border-t border-r border-zinc-500"></div>
    </div>
    <div className="absolute bottom-0 left-0">
       <div className="w-2 h-2 border-b border-l border-zinc-500"></div>
    </div>
    <div className="absolute bottom-0 right-0">
       <div className="w-2 h-2 border-b border-r border-zinc-500"></div>
    </div>
  </div>
);

export const Simulator: React.FC<SimulatorProps> = ({ onPivotToInvestigator }) => {
  const [view, setView] = useState<View>('setup');
  
  // Loading States
  const [setupLoading, setSetupLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  
  // Setup State
  const [personaDescription, setPersonaDescription] = useState('');
  const [customName, setCustomName] = useState('');
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chat State
  const [activePersona, setActivePersona] = useState<Persona | null>(null);
  const [draft, setDraft] = useState('');
  const [simHistory, setSimHistory] = useState<{draft: string, result: SimResult}[]>([]);
  
  // Analysis State
  const [analysisResult, setAnalysisResult] = useState<SimAnalysisResult | null>(null);
  
  // Saved Personas (Local Storage Mock)
  const [savedPersonas, setSavedPersonas] = useState<Persona[]>(() => {
    const saved = localStorage.getItem('unsend_personas');
    return saved ? JSON.parse(saved) : [];
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (view === 'chat') {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [simHistory, view, chatLoading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setPreviewUrls(prev => [...prev, base64]);
          setScreenshots(prev => [...prev, base64.split(',')[1]]);
        };
        reader.readAsDataURL(file as Blob);
      });
    }
  };

  const buildPersona = async () => {
    if (!personaDescription && screenshots.length === 0) return;
    setSetupLoading(true);
    const persona = await generatePersona(personaDescription, screenshots);
    if (customName.trim()) persona.name = customName.trim();
    setActivePersona(persona);
    setSetupLoading(false);
    setView('chat');
  };

  const loadPersona = (p: Persona) => {
    setActivePersona(p);
    setView('chat');
  };

  const runSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !activePersona) return;
    setChatLoading(true);
    const result = await simulateDraft(draft, activePersona);
    setSimHistory(prev => [...prev, { draft, result }]);
    setDraft('');
    setChatLoading(false);
  };

  const handleEndSim = async () => {
    if (!activePersona || simHistory.length === 0) return;
    setAnalyzing(true);
    const result = await analyzeSimulation(simHistory, activePersona);
    setAnalysisResult(result);
    setAnalyzing(false);
    setView('analysis');
  };

  const copyToDraft = (text: string) => {
    setDraft(text);
  };

  const resetSim = () => {
    setSimHistory([]);
    setAnalysisResult(null);
    setView('chat');
  };

  // --- LOADING STATES ---
  if (setupLoading || analyzing) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-matte-panel border border-zinc-800 max-w-2xl mx-auto p-12 relative">
         <CornerNodes />
         <div className="relative mb-8">
             <div className="w-16 h-16 border-4 border-zinc-800 border-t-hard-blue animate-spin rounded-full"></div>
         </div>
         <h2 className="text-4xl font-impact text-white mb-2 uppercase tracking-wide">
           {analyzing ? "Running Diagnostics" : "Building Profile"}
         </h2>
         <p className="label-sm text-zinc-500 animate-pulse">
           {analyzing ? "CALCULATING SIMP COEFFICIENT..." : "DECODING BEHAVIORAL PATTERNS..."}
         </p>
      </div>
    );
  }

  // --- SETUP VIEW ---
  if (view === 'setup') {
    return (
      <div className="w-full h-full max-w-6xl mx-auto bg-matte-panel border border-zinc-800 flex flex-col md:flex-row shadow-2xl relative">
        <CornerNodes />
        
        {/* LEFT: SAVED PROFILES */}
        <div className="w-full md:w-1/3 border-r border-zinc-800 bg-zinc-900 p-8 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h4 className="label-sm text-zinc-500">Archive</h4>
            <span className="font-mono text-xs text-zinc-400">{savedPersonas.length}</span>
          </div>
          
          <div className="space-y-2 overflow-y-auto flex-1 scrollbar-hide">
            {savedPersonas.length === 0 ? (
               <div className="text-center py-20 opacity-30">
                  <p className="label-sm text-zinc-500">NO RECORDS FOUND</p>
               </div>
            ) : (
                savedPersonas.map((p, idx) => (
                    <button 
                      key={idx}
                      onClick={() => loadPersona(p)}
                      className="w-full text-left p-4 border border-zinc-800 hover:border-white hover:bg-zinc-800 transition-all group"
                    >
                      <div className="font-bold text-sm text-zinc-300 group-hover:text-white uppercase tracking-wider mb-1">{p.name}</div>
                      <div className="text-[10px] text-zinc-600 font-mono truncate">{p.tone}</div>
                    </button>
                ))
            )}
          </div>
        </div>

        {/* RIGHT: BUILDER */}
        <div className="w-full md:w-2/3 p-8 md:p-16 relative flex flex-col justify-center bg-matte-panel">
          <div className="max-w-xl mx-auto w-full">
             <div className="mb-10">
               <div className="label-sm text-hard-blue mb-2">SETUP WIZARD</div>
               <h3 className="font-impact text-5xl text-white tracking-wide mb-4">TARGET CONFIG</h3>
               <p className="text-zinc-500 font-editorial text-sm">Configure the behavioral model for accurate simulation.</p>
             </div>

             <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <label className="label-sm text-zinc-400">Name</label>
                     <input
                       type="text"
                       className="w-full bg-zinc-900 border border-zinc-700 p-3 text-white text-xs font-mono focus:border-white focus:outline-none uppercase"
                       placeholder="ALEX"
                       value={customName}
                       onChange={(e) => setCustomName(e.target.value)}
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="label-sm text-zinc-400">Context</label>
                     <div className="bg-zinc-900 border border-zinc-700 p-3 text-zinc-500 text-xs font-mono uppercase text-center cursor-not-allowed">
                        TALKING_STAGE
                     </div>
                   </div>
                </div>

                <div className="space-y-2">
                  <label className="label-sm text-zinc-400">Behavioral Profile</label>
                  <textarea
                    className="w-full bg-zinc-900 border border-zinc-700 p-4 text-white text-sm focus:border-white focus:outline-none h-32 resize-none leading-relaxed"
                    placeholder="Describe their vibe. Dry texter? Love bomber? Emojis? Detail matters."
                    value={personaDescription}
                    onChange={(e) => setPersonaDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                   <label className="label-sm text-zinc-400">Evidence (Optional)</label>
                   <div 
                     onClick={() => fileInputRef.current?.click()}
                     className="border border-dashed border-zinc-700 bg-zinc-900/50 p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-800 transition-all group"
                   >
                     <div className="flex items-center gap-4">
                       <span className="text-zinc-500 text-lg group-hover:text-white">📎</span>
                       <span className="text-xs font-bold text-zinc-400 group-hover:text-white uppercase tracking-wider">Upload Screenshots</span>
                     </div>
                     <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                     {previewUrls.length > 0 && <span className="text-[10px] font-bold text-hard-blue border border-hard-blue/30 px-2 py-0.5 rounded-sm">{previewUrls.length} FILES</span>}
                   </div>
                </div>

                <button
                   onClick={buildPersona}
                   disabled={!personaDescription && screenshots.length === 0}
                   className="w-full bg-white text-black font-impact text-xl py-4 hover:bg-zinc-200 transition-all disabled:opacity-50 mt-6 border border-white tracking-wide uppercase"
                 >
                   Initialize System
                 </button>
             </div>
          </div>
        </div>
      </div>
    );
  }

  // --- ANALYSIS VIEW ---
  if (view === 'analysis' && analysisResult) {
    return (
      <div className="w-full h-full max-w-5xl mx-auto bg-matte-panel border border-zinc-800 flex flex-col relative">
         <CornerNodes />
         <div className="bg-zinc-900 p-6 border-b border-zinc-800 flex justify-between items-center shrink-0">
            <div>
               <h2 className="font-impact text-2xl text-white tracking-wide uppercase">Post-Mortem</h2>
               <p className="label-sm text-zinc-500 mt-1">SESSION_ID: {Date.now().toString().slice(-6)}</p>
            </div>
            <button onClick={() => setView('chat')} className="text-xs font-mono text-zinc-400 hover:text-white underline">CLOSE</button>
         </div>

         <div className="flex-1 overflow-y-auto p-12 bg-matte-base">
            <div className="max-w-3xl mx-auto text-center">
               <div className="mb-12">
                  <h3 className="text-4xl md:text-6xl font-impact text-white mb-8 uppercase leading-tight">
                    {analysisResult.headline}
                  </h3>
                  
                  {/* MAIN GAUGE */}
                  <div className="inline-block bg-zinc-900 border border-zinc-800 p-8 min-w-[300px]">
                    <span className="label-sm text-zinc-500 block mb-4">GHOST RISK PROBABILITY</span>
                    <span className={`font-mono font-bold text-6xl ${analysisResult.ghostRisk > 60 ? 'text-red-500' : 'text-white'}`}>{analysisResult.ghostRisk}%</span>
                    <div className="w-full h-2 bg-black mt-4">
                       <div 
                         className={`h-full ${analysisResult.ghostRisk > 60 ? 'bg-red-500' : 'bg-white'}`}
                         style={{ width: `${analysisResult.ghostRisk}%` }}
                       ></div>
                    </div>
                  </div>
               </div>

               <div className="grid md:grid-cols-2 gap-8 mb-12 text-left">
                  <div className="border-t border-zinc-800 pt-6">
                     <h4 className="label-sm text-hard-blue mb-4">METRICS</h4>
                     <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm border-b border-zinc-900 pb-2">
                           <span className="text-zinc-400 font-bold uppercase tracking-wider">Vibe Match</span>
                           <span className="font-mono text-white">{analysisResult.vibeMatch}%</span>
                        </div>
                        <div className="flex justify-between items-center text-sm border-b border-zinc-900 pb-2">
                           <span className="text-zinc-400 font-bold uppercase tracking-wider">Effort</span>
                           <span className="font-mono text-white">{analysisResult.effortBalance}%</span>
                        </div>
                     </div>
                  </div>

                  <div className="border-t border-zinc-800 pt-6">
                     <h4 className="label-sm text-hard-gold mb-4">INSIGHTS</h4>
                     <ul className="space-y-3">
                       {analysisResult.insights.map((insight, i) => (
                         <li key={i} className="text-sm text-zinc-300 leading-relaxed list-disc list-inside marker:text-zinc-600">
                            {insight}
                         </li>
                       ))}
                     </ul>
                  </div>
               </div>

               <div className="bg-white text-black p-8 text-left">
                  <h4 className="font-impact text-xl mb-2 uppercase">Strategic Advice</h4>
                  <p className="font-editorial text-lg leading-relaxed">"{analysisResult.advice}"</p>
               </div>
            </div>
         </div>
         
         <div className="p-4 border-t border-zinc-800 bg-zinc-900 flex justify-center shrink-0">
           <button onClick={resetSim} className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">Start New Simulation</button>
         </div>
      </div>
    );
  }

  // --- CHAT VIEW ---
  return (
    <div className="w-full h-full max-w-4xl mx-auto bg-matte-panel border border-zinc-800 flex flex-col relative shadow-2xl">
      <CornerNodes />
      
      {/* CHAT HEADER */}
      <div className="bg-zinc-900 p-4 border-b border-zinc-800 flex justify-between items-center z-20 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white font-bold text-lg font-mono">
             {activePersona?.name.charAt(0)}
          </div>
          <div>
             <h2 className="font-bold text-white text-sm uppercase tracking-wider mb-0.5">{activePersona?.name}</h2>
             <span className="label-sm text-zinc-500">
                {activePersona?.tone}
             </span>
          </div>
        </div>
        <div className="flex gap-4">
           {simHistory.length > 0 && (
             <button onClick={handleEndSim} className="label-sm text-red-500 hover:text-red-400 border border-red-900/30 px-3 py-1 bg-red-900/10">
               END SESSION
             </button>
           )}
           <button onClick={() => setView('setup')} className="label-sm text-zinc-500 hover:text-white">
             EXIT
           </button>
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-matte-base custom-scrollbar relative">
        <div className="absolute inset-0 bg-scan-lines opacity-5 pointer-events-none"></div>

        {simHistory.length === 0 && !chatLoading && (
          <div className="h-full flex flex-col items-center justify-center text-zinc-800 relative z-10">
            <div className="text-6xl mb-4 opacity-20">✉</div>
            <p className="label-sm">READY TO SIMULATE</p>
          </div>
        )}

        {simHistory.map((entry, idx) => (
          <div key={idx} className="space-y-4 relative z-10">
             {/* USER MESSAGE */}
             <div className="flex justify-end">
                <div className="max-w-[80%] bg-white text-black px-6 py-4 text-sm font-medium leading-relaxed border border-zinc-200 shadow-[4px_4px_0px_rgba(0,0,0,0.5)]">
                  {entry.draft}
                </div>
             </div>

             {/* ANALYSIS WIDGET (Block Style) */}
             <div className="mx-auto w-full max-w-lg bg-zinc-900 border border-zinc-800 p-4 relative group">
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-zinc-800">
                   <span className="label-sm text-zinc-500">ANALYSIS</span>
                   <span className={`label-sm ${entry.result.regretLevel > 50 ? 'text-red-500' : 'text-green-500'}`}>
                      RISK: {entry.result.regretLevel}%
                   </span>
                </div>
                <p className="text-xs text-zinc-300 mb-4 font-mono leading-relaxed">
                   "{entry.result.feedback[0]}"
                </p>
                
                {/* SUGGESTIONS */}
                <div className="grid grid-cols-3 gap-2">
                   {Object.entries(entry.result.rewrites).map(([key, text]) => (
                     <button 
                       key={key} 
                       onClick={() => copyToDraft(text as string)}
                       className={`p-2 border text-[10px] text-left hover:bg-zinc-800 transition-colors h-full flex flex-col justify-between ${key === 'safe' ? 'border-zinc-800 text-zinc-400' : key === 'bold' ? 'border-zinc-700 text-zinc-300' : 'border-red-900/30 text-red-400'}`}
                     >
                        <span className="block font-bold uppercase mb-1">{key}</span>
                        <div className="truncate opacity-70 italic font-serif">"{text as string}"</div>
                     </button>
                   ))}
                </div>
             </div>

             {/* PREDICTED REPLY */}
             <div className="flex justify-start">
                <div className="flex items-end gap-3 max-w-[85%]">
                   <div className="w-8 h-8 bg-zinc-800 flex-shrink-0 flex items-center justify-center text-xs text-zinc-500 font-mono border border-zinc-700">
                      {activePersona?.name.charAt(0)}
                   </div>
                   <div className="bg-zinc-800 text-zinc-200 px-6 py-4 text-sm leading-relaxed border border-zinc-700">
                      {entry.result.predictedReply}
                   </div>
                </div>
             </div>
          </div>
        ))}

        {chatLoading && (
           <div className="flex justify-start relative z-10">
               <div className="bg-zinc-900 px-4 py-3 border border-zinc-800">
                  <span className="label-sm text-zinc-500 animate-pulse">TYPING...</span>
               </div>
           </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="p-4 bg-zinc-900 border-t border-zinc-800 relative z-20 shrink-0">
         <form onSubmit={runSimulation} className="flex gap-0 border border-zinc-700">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="TYPE DRAFT..."
              disabled={chatLoading}
              className="flex-1 bg-black px-6 py-4 text-white focus:outline-none placeholder-zinc-700 text-xs font-mono uppercase"
            />
            <button
               type="submit"
               disabled={!draft.trim() || chatLoading}
               className="bg-white text-black font-bold px-8 hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-[10px]"
            >
               SEND
            </button>
         </form>
      </div>

    </div>
  );
};