
import React, { useState } from 'react';
import { simulateDraft } from '../services/geminiService';
import { SimResult } from '../types';

interface SimulatorProps {
  onPivotToInvestigator: () => void;
}

const CONTEXTS = ["CRUSH", "SITUATIONSHIP", "EX", "DATE", "BOSS", "FRIEND"];

export const Simulator: React.FC<SimulatorProps> = ({ onPivotToInvestigator }) => {
  const [draft, setDraft] = useState('');
  const [context, setContext] = useState('CRUSH');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimResult | null>(null);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;

    setLoading(true);
    setResult(null);

    // Simulate "thinking" time for effect
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const data = await simulateDraft(draft, context);
    setResult(data);
    setLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl min-h-[400px] flex flex-col items-center justify-center bg-black border-4 border-zinc-800 p-8 shadow-hard relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(41,152,255,0.05)_25%,rgba(41,152,255,0.05)_50%,transparent_50%,transparent_75%,rgba(41,152,255,0.05)_75%,rgba(41,152,255,0.05)_100%)] bg-[size:20px_20px] animate-[scan_0.5s_linear_infinite]"></div>
        <h2 className="text-3xl font-impact text-white animate-pulse mb-4">RUNNING SIMULATION...</h2>
        <div className="font-mono text-hard-blue">CALCULATING RIZZ COEFFICIENT</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl space-y-6">
      
      {!result ? (
        // INPUT MODE
        <div className="bg-hard-gray border-4 border-white p-6 shadow-hard relative">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-black px-4 border border-white">
            <span className="text-hard-blue font-impact tracking-widest text-lg">UNSEND SENTINEL v1.0</span>
          </div>

          <form onSubmit={handleSimulate} className="mt-4 space-y-6">
            
            {/* Context Selector */}
            <div>
              <label className="text-zinc-500 font-mono text-xs font-bold mb-2 block tracking-wider">TARGET RELATIONSHIP</label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {CONTEXTS.map(ctx => (
                  <button
                    key={ctx}
                    type="button"
                    onClick={() => setContext(ctx)}
                    className={`font-impact text-sm md:text-lg py-2 border-2 transition-all ${
                      context === ctx 
                        ? 'bg-hard-blue text-black border-black shadow-[4px_4px_0_#000]' 
                        : 'bg-black text-zinc-500 border-zinc-700 hover:border-white hover:text-white'
                    }`}
                  >
                    {ctx}
                  </button>
                ))}
              </div>
            </div>

            {/* Draft Input */}
            <div>
              <label className="text-zinc-500 font-mono text-xs font-bold mb-2 block tracking-wider">PASTE DRAFT HERE</label>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ex: Hey, are you up? I miss you..."
                className="w-full bg-black border-2 border-zinc-500 p-4 text-white text-lg font-mono focus:border-hard-blue focus:outline-none min-h-[150px] placeholder-zinc-700"
              />
            </div>

            <button 
              type="submit"
              disabled={!draft.trim()}
              className="w-full bg-hard-blue text-black font-impact text-4xl py-4 border-4 border-black hover:bg-white transition-all shadow-hard-white uppercase disabled:opacity-50 disabled:cursor-not-allowed"
            >
              SIMULATE SEND
            </button>
            <p className="text-center font-mono text-xs text-zinc-500">
              AI WILL JUDGE YOUR TEXT BEFORE THEY DO.
            </p>
          </form>
        </div>
      ) : (
        // RESULTS MODE
        <div className="space-y-6 animate-fadeIn">
          
          {/* REGRET RADAR HERO */}
          <div className="bg-black border-4 border-white p-6 md:p-8 shadow-hard relative overflow-hidden">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              
              {/* Gauge */}
              <div className="w-full md:w-1/3 flex flex-col items-center">
                <div className="relative w-40 h-40 flex items-center justify-center border-4 rounded-full border-zinc-800 bg-zinc-900">
                  <span className={`font-impact text-6xl ${result.regretLevel > 50 ? 'text-hard-red' : 'text-green-500'}`}>
                    {result.regretLevel}%
                  </span>
                  <svg className="absolute inset-0 transform -rotate-90 w-full h-full p-2" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#333" strokeWidth="8" />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="45" 
                      fill="none" 
                      stroke={result.regretLevel > 50 ? '#FF3333' : '#22c55e'} 
                      strokeWidth="8" 
                      strokeDasharray="283" 
                      strokeDashoffset={283 - (283 * result.regretLevel / 100)} 
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                </div>
                <span className="mt-4 font-mono font-bold text-zinc-400">REGRET PROBABILITY</span>
              </div>

              {/* Verdict & Feedback */}
              <div className="w-full md:w-2/3 text-left">
                <h2 className={`text-4xl md:text-5xl font-impact leading-none mb-4 ${result.regretLevel > 50 ? 'text-hard-red' : 'text-hard-blue'}`}>
                  {result.verdict}
                </h2>
                <div className="space-y-2">
                  {result.feedback.map((item, idx) => (
                    <div key={idx} className="bg-zinc-900 border-l-4 border-zinc-500 p-2 font-mono text-sm text-zinc-300">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* REWRITES */}
          <div className="grid md:grid-cols-3 gap-4">
            
            {/* Safe */}
            <div className="bg-zinc-900 border-2 border-green-500/50 p-4 flex flex-col hover:border-green-500 transition-colors">
              <div className="flex justify-between items-center mb-3">
                <span className="font-impact text-green-500 text-xl">SAFE MODE</span>
                <span className="text-xs font-mono text-zinc-500">LOW RISK</span>
              </div>
              <p className="font-mono text-white text-sm flex-grow mb-4">"{result.rewrites.safe}"</p>
              <button 
                onClick={() => copyToClipboard(result.rewrites.safe)}
                className="w-full border border-green-500 text-green-500 font-bold text-xs py-2 hover:bg-green-500 hover:text-black transition-colors uppercase"
              >
                COPY TEXT
              </button>
            </div>

            {/* Bold */}
            <div className="bg-zinc-900 border-2 border-hard-blue/50 p-4 flex flex-col hover:border-hard-blue transition-colors">
              <div className="flex justify-between items-center mb-3">
                <span className="font-impact text-hard-blue text-xl">BOLD MOVE</span>
                <span className="text-xs font-mono text-zinc-500">CONFIDENT</span>
              </div>
              <p className="font-mono text-white text-sm flex-grow mb-4">"{result.rewrites.bold}"</p>
              <button 
                onClick={() => copyToClipboard(result.rewrites.bold)}
                className="w-full border border-hard-blue text-hard-blue font-bold text-xs py-2 hover:bg-hard-blue hover:text-black transition-colors uppercase"
              >
                COPY TEXT
              </button>
            </div>

            {/* Spicy */}
            <div className="bg-zinc-900 border-2 border-hard-red/50 p-4 flex flex-col hover:border-hard-red transition-colors">
              <div className="flex justify-between items-center mb-3">
                <span className="font-impact text-hard-red text-xl">SPICY / TOXIC</span>
                <span className="text-xs font-mono text-zinc-500">HIGH RISK</span>
              </div>
              <p className="font-mono text-white text-sm flex-grow mb-4">"{result.rewrites.spicy}"</p>
              <button 
                onClick={() => copyToClipboard(result.rewrites.spicy)}
                className="w-full border border-hard-red text-hard-red font-bold text-xs py-2 hover:bg-hard-red hover:text-black transition-colors uppercase"
              >
                COPY TEXT
              </button>
            </div>

          </div>

          {/* ACTIONS */}
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => setResult(null)}
              className="w-full bg-zinc-800 text-white font-impact text-xl py-3 hover:bg-zinc-700 transition-colors"
            >
              TRY ANOTHER DRAFT
            </button>
            
            <div className="relative mt-4 border-t border-zinc-800 pt-6 text-center">
              <p className="font-mono text-zinc-400 text-sm mb-4">Sim passed but they still not replying?</p>
              <button 
                onClick={onPivotToInvestigator}
                className="bg-black text-hard-gold border-2 border-hard-gold px-8 py-3 font-impact text-xl hover:bg-hard-gold hover:text-black transition-all shadow-[4px_4px_0_#FFD700]"
              >
                RUN GHOST INVESTIGATION &rarr;
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
