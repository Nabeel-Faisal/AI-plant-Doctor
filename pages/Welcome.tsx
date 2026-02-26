import React from 'react';
import { Leaf, ArrowRight, Activity, Sparkles, Mic, Zap, BrainCircuit, ScanLine } from 'lucide-react';
import { APP_NAME } from '../constants';

interface Props {
  onStart: () => void;
}

export const Welcome: React.FC<Props> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col relative overflow-hidden">
      
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Navbar */}
      <nav className="p-6 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2">
           <div className="bg-green-500 p-2 rounded-lg shadow-[0_0_15px_rgba(34,197,94,0.3)]">
             <Leaf className="w-5 h-5 text-white" />
           </div>
           <span className="font-bold text-lg tracking-tight">{APP_NAME}</span>
        </div>
        <div className="text-xs font-mono text-slate-500 border border-slate-800 px-3 py-1 rounded-full">
           v2.0 Beta • Gemini 3 Vision
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 relative z-10 py-12">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700 text-slate-300 text-sm mb-8 animate-fade-in-up">
           <Sparkles className="w-4 h-4 text-yellow-400" />
           <span>Next-Gen AI Plant Care</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 animate-fade-in-up delay-100 max-w-4xl mx-auto">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500">
            Predict Disease
          </span>
          <br />
          <span className="text-white">Before It Happens.</span>
        </h1>

        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up delay-200">
          Most apps react to dead leaves. We use <b>Gemini 3 Vision</b> to detect micro-deviations days before symptoms appear, turning you into a proactive plant parent.
        </p>

        {/* CTA Button */}
        <button 
          onClick={onStart}
          className="group relative inline-flex items-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:shadow-[0_0_50px_rgba(16,185,129,0.6)] transform hover:-translate-y-1 animate-fade-in-up delay-300"
        >
          <span>Get Started</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          <div className="absolute inset-0 rounded-full border border-white/20" />
        </button>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-5xl mx-auto w-full animate-fade-in-up delay-500">
           
           <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-2xl hover:bg-slate-800/60 transition-colors text-left group">
              <div className="w-12 h-12 bg-blue-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                 <ScanLine className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="font-bold text-white text-lg mb-2">Micro-Pattern Vision</h3>
              <p className="text-slate-400 text-sm">
                 Detects fungal spores, chlorosis, and pest patterns invisible to the human eye.
              </p>
           </div>

           <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-2xl hover:bg-slate-800/60 transition-colors text-left group">
              <div className="w-12 h-12 bg-purple-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                 <BrainCircuit className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="font-bold text-white text-lg mb-2">Digital Twin Engine</h3>
              <p className="text-slate-400 text-sm">
                 Simulates your plant's growth 60 days into the future based on environment data.
              </p>
           </div>

           <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-2xl hover:bg-slate-800/60 transition-colors text-left group">
              <div className="w-12 h-12 bg-orange-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                 <Mic className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="font-bold text-white text-lg mb-2">Live Voice Chat</h3>
              <p className="text-slate-400 text-sm">
                 Talk to your plants in real-time. The AI sees what you see and replies instantly.
              </p>
           </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-slate-600 text-xs">
        © 2025 AI Plant Doctor. Powered by Google Gemini 3 Pro.
      </footer>
    </div>
  );
};