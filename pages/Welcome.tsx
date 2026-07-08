import React from 'react';
import { Leaf, ArrowRight, Download, Sparkles, Mic, BrainCircuit, ScanLine, Moon, Sun } from 'lucide-react';
import { APP_NAME } from '../constants';
import { useTheme } from '../components/ThemeProvider';
import { useInstallPrompt } from '../components/InstallPrompt';

interface Props {
  onStart: () => void;
}

export const Welcome: React.FC<Props> = ({ onStart }) => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const { canInstall, promptInstall } = useInstallPrompt();

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col relative overflow-hidden">

      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] max-w-[80vw] bg-accent/15 rounded-full blur-[100px] animate-blob" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] max-w-[80vw] bg-accent2/15 rounded-full blur-[100px] animate-blob" style={{ animationDelay: '3s' }} />
      </div>

      {/* Navbar */}
      <nav className="safe-top p-5 sm:p-6 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-accent to-accent2 p-2 rounded-xl shadow-[0_0_16px_rgb(var(--accent)/0.4)]">
            <Leaf className="w-5 h-5 text-bg" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">{APP_NAME}</span>
        </div>
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="glass p-2.5 rounded-full text-muted hover:text-fg transition-colors"
        >
          {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-5 sm:px-6 relative z-10 py-10">

        {/* Badge */}
        <div className="glass inline-flex items-center gap-2 px-4 py-2 rounded-full text-muted text-sm mb-8 animate-fade-in-up">
          <Sparkles className="w-4 h-4 text-warning" />
          <span>Next-Gen AI Plant Care</span>
        </div>

        {/* Hero Title */}
        <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl mx-auto animate-fade-in-up [animation-delay:100ms]">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent via-emerald-400 to-accent2">
            Predict Disease
          </span>
          <br />
          <span className="text-fg">Before It Happens.</span>
        </h1>

        <p className="text-muted text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up [animation-delay:200ms]">
          Most apps react to dead leaves. We use <b className="text-fg">Groq Vision</b> to detect micro-deviations days before symptoms appear, turning you into a proactive plant parent.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 animate-fade-in-up [animation-delay:300ms]">
          <button
            onClick={onStart}
            className="group relative inline-flex items-center gap-3 bg-accent text-bg px-8 py-4 rounded-full font-bold text-lg transition-all shadow-[0_0_30px_rgb(var(--accent)/0.4)] hover:shadow-[0_0_50px_rgb(var(--accent)/0.6)] transform hover:-translate-y-1 active:scale-95"
          >
            <span>Get Started</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          {canInstall && (
            <button
              onClick={promptInstall}
              className="glass inline-flex items-center gap-2 text-fg px-6 py-4 rounded-full font-semibold transition-all hover:-translate-y-1 active:scale-95"
            >
              <Download className="w-5 h-5" />
              <span>Install App</span>
            </button>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-16 sm:mt-20 max-w-5xl mx-auto w-full animate-fade-in-up [animation-delay:500ms]">

          <div className="glass p-6 rounded-2xl hover:-translate-y-1 transition-transform text-left group">
            <div className="w-12 h-12 bg-accent/15 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ScanLine className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-display font-bold text-fg text-lg mb-2">Micro-Pattern Vision</h3>
            <p className="text-muted text-sm leading-relaxed">
              Detects fungal spores, chlorosis, and pest patterns invisible to the human eye.
            </p>
          </div>

          <div className="glass p-6 rounded-2xl hover:-translate-y-1 transition-transform text-left group">
            <div className="w-12 h-12 bg-purple-500/15 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BrainCircuit className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="font-display font-bold text-fg text-lg mb-2">Digital Twin Engine</h3>
            <p className="text-muted text-sm leading-relaxed">
              Simulates your plant's growth 60 days into the future based on environment data.
            </p>
          </div>

          <div className="glass p-6 rounded-2xl hover:-translate-y-1 transition-transform text-left group">
            <div className="w-12 h-12 bg-accent2/15 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Mic className="w-6 h-6 text-accent2" />
            </div>
            <h3 className="font-display font-bold text-fg text-lg mb-2">Live Voice Chat</h3>
            <p className="text-muted text-sm leading-relaxed">
              Talk to your plants in real-time. The AI sees what you see and replies instantly.
            </p>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="safe-bottom p-6 text-center text-muted text-xs relative z-10">
        © 2026 AI Plant Doctor. Powered by Groq.
      </footer>
    </div>
  );
};
