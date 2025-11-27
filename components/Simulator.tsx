
import React, { useState, useRef, useEffect } from 'react';
import { generatePersona, simulateDraft, analyzeSimulation } from '../services/geminiService';
import { SimResult, Persona, SimAnalysisResult } from '../types';

interface SimulatorProps {
  onPivotToInvestigator: () => void;
}

type View = 'setup' | 'chat' | 'analysis';

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
    
    // Override name if user provided one
    if (customName.trim()) {
      persona.name = customName.trim();
    }
    
    setActivePersona(persona);
    setSetupLoading(false);
    setView('chat');
  };

  const savePersona = () => {
    if (!activePersona) return;
    const newSaved = [...savedPersonas, activePersona];
    setSavedPersonas(newSaved);
    localStorage.setItem('unsend_personas', JSON.stringify(newSaved));
    alert(`Persona '${activePersona.name}' saved!`);
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

  // --- RENDER HELPERS ---

  if (setupLoading || analyzing) {
    return (
      <div className="w-full max-w-4xl min-h-[500px] flex flex-col items-center justify-center bg-black border-4 border-zinc-800 p-8 shadow-hard relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(41,152,255,0.05)_25%,rgba(41,152,255,0.05)_50%,transparent_50%,transparent_75%,rgba(41,152,255,0.05)_75%,rgba(41,152,255,0.05)_100%)] bg-[size:20px_20px] animate-[scan_0.5s_linear_infinite]"></div>
        <div className="w-16 h-16 border-4 border-t-hard-blue border-r-transparent border-b-hard-blue border-l-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-3xl font-impact text-white animate-pulse mb-2">
          {analyzing ? "CALCULATING GHOST RISK..." : "BUILDING TARGET PERSONA..."}
        </h2>
        <div className="font-mono text-hard-blue text-sm">
          {analyzing ? "ANALYZING TONE SHIFTS & RESPONSE LATENCY" : "ANALYZING TONE, HABITS & RED FLAGS"}
        </div>
      </div>
    );
  }

  // --- SETUP VIEW ---
  if (view === 'setup') {
    return (
      <div className="w-full max-w-4xl bg-hard-gray border-4 border-white p-6 shadow-hard relative animate-fadeIn">
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-black px-4 border border-white z-10">
          <span className="text-hard-blue font-impact tracking-widest text-lg">TARGET IDENTIFICATION</span>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mt-4">
          
          {/* LEFT: Saved Personas */}
          <div className="border-r-0 md:border-r-2 border-zinc-800 pr-0 md:pr-8">
            <h3 className="font-impact text-xl text-white mb-4">LOAD SAVED TARGET</h3>
            {savedPersonas.length === 0 ? (
              <p className="font-mono text-zinc-600 text-sm">No saved profiles. Build one first.</p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {savedPersonas.map((p, idx) => (
                  <button 
                    key={idx}
                    onClick={() => loadPersona(p)}
                    className="w-full text-left bg-zinc-900 border border-zinc-700 p-3 hover:border-hard-gold hover:bg-black transition-all group"
                  >
                    <div className="flex justify-between">
                      <span className="font-bold text-white group-hover:text-hard-gold">{p.name}</span>
                      <span className="text-[10px] bg-zinc-800 px-1 text-zinc-400">{p.tone}</span>
                    </div>
                    <div className="text-xs text-zinc-500 mt-1 truncate">{p.description || "No description"}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: New Persona */}
          <div>
            <h3 className="font-impact text-xl text-white mb-4">BUILD NEW PROFILE</h3>
            
            {/* Name Input */}
            <div className="mb-4">
               <label className="text-zinc-500 font-mono text-xs font-bold mb-1 block">TARGET NAME (OPTIONAL)</label>
               <input
                 type="text"
                 className="w-full bg-black border-2 border-zinc-600 p-3 text-white text-sm focus:border-hard-blue focus:outline-none placeholder-zinc-700"
                 placeholder="EX: ALEX"
                 value={customName}
                 onChange={(e) => setCustomName(e.target.value)}
               />
            </div>

            {/* Description Input */}
            <div className="mb-4">
               <label className="text-zinc-500 font-mono text-xs font-bold mb-1 block">DESCRIBE THE VIBE</label>
               <textarea
                 className="w-full bg-black border-2 border-zinc-600 p-3 text-white text-sm focus:border-hard-blue focus:outline-none placeholder-zinc-700 min-h-[100px]"
                 placeholder="Hint: 'She's witty, uses memes to flirt, but fades if I don't reply fast. Loves puns, hates boring 'hey' texts.'"
                 value={personaDescription}
                 onChange={(e) => setPersonaDescription(e.target.value)}
               />
            </div>

            {/* Screenshot Upload */}
            <div className="mb-6">
              <label className="text-zinc-500 font-mono text-xs font-bold mb-1 block">UPLOAD CHAT RECEIPTS (OPTIONAL)</label>
              <div 
                 onClick={() => fileInputRef.current?.click()}
                 className="border-2 border-dashed border-zinc-600 bg-zinc-900 p-4 text-center cursor-pointer hover:border-hard-blue hover:bg-black transition-all"
              >
                <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                <span className="text-2xl">📸</span>
                <p className="font-mono text-xs text-zinc-400 mt-1">Screenshots help AI learn their style.</p>
                {previewUrls.length > 0 && (
                  <div className="flex gap-2 justify-center mt-2">
                    {previewUrls.slice(0, 3).map((url, i) => (
                      <img key={i} src={url} alt="preview" className="w-8 h-8 object-cover border border-white" />
                    ))}
                    {previewUrls.length > 3 && <span className="text-xs self-center">+{previewUrls.length - 3}</span>}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={buildPersona}
              disabled={!personaDescription && screenshots.length === 0}
              className="w-full bg-hard-blue text-black font-impact text-2xl py-3 border-4 border-black hover:bg-white transition-all shadow-hard-white uppercase disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ENTER SIMULATOR
            </button>
          </div>

        </div>
      </div>
    );
  }

  // --- ANALYSIS RESULTS VIEW ---
  if (view === 'analysis' && analysisResult) {
    return (
      <div className="w-full max-w-4xl bg-hard-gray border-4 border-black p-0 shadow-hard animate-fadeIn relative">
        <div className="bg-hard-gold text-black p-4 font-impact text-2xl border-b-4 border-black flex justify-between items-center">
          <span>RELATIONSHIP DIAGNOSTIC</span>
          <span className="text-sm font-mono tracking-widest">SESSION COMPLETE</span>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          
          {/* MAIN VERDICT */}
          <div className="text-center">
             <div className="inline-block bg-black text-hard-gold px-2 font-mono font-bold mb-2 uppercase tracking-wide">
               AI ASSESSMENT
             </div>
             <h2 className="text-3xl md:text-5xl font-impact text-white mb-1 leading-tight text-outline">
               {analysisResult.headline.toUpperCase()}
             </h2>
             <div className="w-full max-w-md mx-auto h-8 bg-zinc-900 border-2 border-white relative mt-4">
                <div 
                  className={`h-full ${analysisResult.ghostRisk > 60 ? 'bg-hard-red' : analysisResult.ghostRisk > 30 ? 'bg-hard-gold' : 'bg-green-500'}`}
                  style={{ width: `${analysisResult.ghostRisk}%` }}
                ></div>
                <div className="absolute inset-0 flex justify-between items-center px-2 font-mono text-xs font-bold text-white mix-blend-difference">
                  <span>SAFE</span>
                  <span>RISK: {analysisResult.ghostRisk}%</span>
                  <span>COOKED</span>
                </div>
             </div>
          </div>

          {/* METRICS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* LEFT: METRICS */}
            <div className="bg-black border-2 border-zinc-700 p-4 shadow-[4px_4px_0_#333]">
              <h3 className="text-hard-blue font-impact text-xl mb-4">VIBE METRICS</h3>
              
              {/* VIBE MATCH */}
              <div className="mb-4">
                <div className="flex justify-between text-xs font-mono text-zinc-400 mb-1">
                  <span>VIBE MATCH (MIRRORING)</span>
                  <span className="text-white">{analysisResult.vibeMatch}%</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full">
                   <div className="h-full bg-hard-blue" style={{ width: `${analysisResult.vibeMatch}%` }}></div>
                </div>
              </div>

              {/* EFFORT BALANCE */}
              <div className="mb-2">
                <div className="flex justify-between text-xs font-mono text-zinc-400 mb-1">
                  <span>EFFORT BALANCE (YOU VS THEM)</span>
                  <span className="text-white">{analysisResult.effortBalance > 60 ? "YOU'RE SIMPING" : "BALANCED"}</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full relative">
                   <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white z-10"></div>
                   <div 
                      className={`h-full ${Math.abs(analysisResult.effortBalance - 50) > 20 ? 'bg-hard-red' : 'bg-green-500'}`} 
                      style={{ width: `${analysisResult.effortBalance}%` }}
                   ></div>
                </div>
                <div className="flex justify-between text-[10px] text-zinc-600 mt-1 font-mono">
                   <span>THEY CARRY</span>
                   <span>YOU CARRY</span>
                </div>
              </div>
            </div>

            {/* RIGHT: INSIGHTS */}
            <div className="bg-zinc-900 border-2 border-zinc-700 p-4">
               <h3 className="text-hard-gold font-impact text-xl mb-4">KEY INSIGHTS</h3>
               <ul className="space-y-3">
                 {analysisResult.insights.map((insight, i) => (
                   <li key={i} className="flex gap-2 text-sm font-mono text-zinc-300 border-b border-zinc-800 pb-2 last:border-0">
                     <span className="text-hard-red font-bold">{'>'}</span>
                     {insight}
                   </li>
                 ))}
               </ul>
               {analysisResult.turningPoint !== "Unknown" && (
                 <div className="mt-4 bg-black/50 p-2 border border-hard-red/50 text-xs text-zinc-400 font-mono">
                   <span className="text-hard-red font-bold">⚠ TURNING POINT:</span> {analysisResult.turningPoint}
                 </div>
               )}
            </div>
          </div>

          {/* FINAL ADVICE */}
          <div className="bg-white text-black border-4 border-black p-6 relative">
            <div className="absolute -top-3 left-6 bg-black text-white px-2 font-impact tracking-wider">RECOMMENDED MOVE</div>
            <p className="font-mono text-lg font-bold mt-2">"{analysisResult.advice}"</p>
          </div>

          {/* ACTIONS */}
          <div className="flex gap-4">
            <button onClick={resetSim} className="flex-1 bg-black text-white font-impact text-xl py-4 border-4 border-white hover:bg-white hover:text-black transition-all">
              START NEW SIM
            </button>
            <button onClick={() => setView('chat')} className="flex-1 bg-hard-gray text-white font-impact text-xl py-4 border-4 border-black hover:bg-zinc-800 transition-all">
               BACK TO HISTORY
            </button>
          </div>

        </div>
      </div>
    );
  }

  // --- CHAT VIEW ---
  return (
    <div className="w-full max-w-4xl flex flex-col gap-4 animate-fadeIn">
      
      {/* HEADER BAR */}
      <div className="bg-black border-4 border-white p-3 flex justify-between items-center shadow-hard relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-hard-blue to-purple-600 rounded-full border-2 border-white flex items-center justify-center font-bold text-lg">
            {activePersona?.name.charAt(0) || "?"}
          </div>
          <div className="leading-tight">
            <h2 className="font-impact text-xl text-white tracking-wide">{activePersona?.name.toUpperCase()}</h2>
            <div className="text-[10px] font-mono text-zinc-400 flex gap-2">
              <span className="text-hard-blue">{activePersona?.tone}</span>
              <span className="text-hard-red">{activePersona?.redFlags[0]}</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          {simHistory.length > 0 && (
            <button 
              onClick={handleEndSim} 
              className="bg-hard-red text-black px-4 py-1 font-impact tracking-wide text-sm border-2 border-black hover:bg-white hover:text-red-600 transition-colors shadow-[2px_2px_0_#fff]"
            >
              TERMINATE & ANALYZE
            </button>
          )}
          <button onClick={() => setView('setup')} className="bg-zinc-900 text-white px-3 py-1 text-xs font-mono border border-zinc-700 hover:bg-zinc-800">
            EXIT
          </button>
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="bg-hard-gray border-4 border-zinc-800 min-h-[400px] max-h-[600px] overflow-y-auto p-4 flex flex-col gap-6 relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

        {simHistory.length === 0 && !chatLoading && (
          <div className="text-center text-zinc-600 font-mono text-sm mt-10">
            <p className="mb-2">START A NEW SIMULATION</p>
            <p className="text-xs">Type a draft below to see how {activePersona?.name} reacts.</p>
          </div>
        )}

        {/* Existing History */}
        {simHistory.map((entry, index) => (
          <div key={index} className="flex flex-col gap-4 animate-slideUp">
            
            {/* USER DRAFT (RIGHT) */}
            <div className="self-end max-w-[80%]">
              <div className="bg-hard-blue text-black p-3 rounded-t-2xl rounded-bl-2xl border-2 border-transparent font-sans font-bold text-sm shadow-[4px_4px_0_rgba(0,0,0,0.5)]">
                {entry.draft}
              </div>
              <div className="text-right text-[10px] text-zinc-500 font-mono mt-1">DRAFT</div>
            </div>

            {/* SIMULATOR ANALYSIS (CENTER/FULL) */}
            <div className="bg-black border border-zinc-700 p-4 rounded-lg self-center w-full shadow-lg">
               
               {/* Regret Bar */}
               <div className="flex items-center gap-3 mb-3">
                 <span className="text-[10px] font-mono text-zinc-500">REGRET LEVEL</span>
                 <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                   <div 
                      className={`h-full ${entry.result.regretLevel > 50 ? 'bg-hard-red' : 'bg-green-500'}`} 
                      style={{ width: `${entry.result.regretLevel}%` }}
                   ></div>
                 </div>
                 <span className={`text-xs font-bold ${entry.result.regretLevel > 50 ? 'text-hard-red' : 'text-green-500'}`}>
                    {entry.result.regretLevel}%
                 </span>
               </div>

               {/* Feedback */}
               <div className="mb-3 text-xs font-mono text-zinc-300 border-l-2 border-hard-gold pl-2">
                 <span className="text-hard-gold font-bold">{entry.result.verdict}: </span>
                 {entry.result.feedback[0]}
               </div>

               {/* REWRITES CAROUSEL */}
               <div className="text-[10px] font-mono text-zinc-500 mb-1 tracking-wider">SUGGESTED REPLIES TO TARGET</div>
               <div className="flex gap-2 overflow-x-auto pb-2">
                 {Object.entries(entry.result.rewrites).map(([key, text]) => (
                   <button 
                     key={key}
                     onClick={() => copyToDraft(text as string)}
                     className={`flex-shrink-0 w-[200px] text-left p-2 border ${key === 'safe' ? 'border-green-800 bg-green-900/20' : key === 'bold' ? 'border-blue-800 bg-blue-900/20' : 'border-red-800 bg-red-900/20'} rounded hover:bg-zinc-800 transition-colors`}
                   >
                     <div className="text-[10px] uppercase font-bold mb-1 opacity-70">{key}</div>
                     <div className="text-xs text-white line-clamp-2">"{text as string}"</div>
                   </button>
                 ))}
               </div>
            </div>

            {/* PREDICTED REPLY (LEFT) */}
            <div className="self-start max-w-[80%] flex items-end gap-2">
              <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-400 border border-zinc-600">
                {activePersona?.name.charAt(0)}
              </div>
              <div>
                <div className="bg-zinc-900 text-zinc-300 p-3 rounded-t-2xl rounded-br-2xl border border-zinc-700 font-sans text-sm shadow-[4px_4px_0_rgba(0,0,0,0.5)] italic">
                  "{entry.result.predictedReply}"
                </div>
                <div className="text-left text-[10px] text-zinc-500 font-mono mt-1">PREDICTED REPLY</div>
              </div>
            </div>

          </div>
        ))}

        {/* INLINE LOADING STATE */}
        {chatLoading && (
          <div className="flex flex-col gap-4 animate-slideUp">
            {/* Optimistic User Draft */}
            <div className="self-end max-w-[80%]">
              <div className="bg-hard-blue text-black p-3 rounded-t-2xl rounded-bl-2xl border-2 border-transparent font-sans font-bold text-sm shadow-[4px_4px_0_rgba(0,0,0,0.5)] opacity-70">
                {draft}
              </div>
              <div className="text-right text-[10px] text-zinc-500 font-mono mt-1">ANALYZING...</div>
            </div>
            {/* Loading Indicator */}
            <div className="self-center bg-black border border-zinc-700 p-4 rounded-lg w-full shadow-lg opacity-50 animate-pulse flex items-center justify-center gap-2">
               <div className="w-2 h-2 bg-hard-gold rounded-full animate-bounce"></div>
               <div className="w-2 h-2 bg-hard-gold rounded-full animate-bounce delay-75"></div>
               <div className="w-2 h-2 bg-hard-gold rounded-full animate-bounce delay-150"></div>
               <span className="text-xs font-mono text-zinc-400 ml-2">RUNNING RIZZ SIMULATION...</span>
            </div>
          </div>
        )}

      </div>

      {/* INPUT AREA */}
      <form onSubmit={runSimulation} className="relative">
         <div className="flex gap-0 border-4 border-white shadow-hard">
           <input
             type="text"
             value={draft}
             onChange={(e) => setDraft(e.target.value)}
             placeholder={chatLoading ? "Please wait..." : `Draft message to ${activePersona?.name}...`}
             disabled={chatLoading}
             className="flex-1 bg-black text-white p-4 focus:outline-none font-mono placeholder-zinc-600 disabled:opacity-50"
           />
           <button 
             type="submit" 
             disabled={!draft.trim() || chatLoading}
             className="bg-hard-blue text-black font-impact text-xl px-6 hover:bg-white transition-colors uppercase disabled:opacity-50"
           >
             SEND
           </button>
         </div>
      </form>

      {/* FOOTER LINK */}
      <div className="text-center mt-2">
        <button onClick={onPivotToInvestigator} className="text-xs font-mono text-zinc-500 hover:text-hard-red underline decoration-dashed">
          STILL GHOSTING? SWITCH TO INVESTIGATOR MODE
        </button>
      </div>

    </div>
  );
};