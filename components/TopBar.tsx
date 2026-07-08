import React from 'react';
import { Download, Leaf, Moon, Sun } from 'lucide-react';
import { APP_NAME } from '../constants';
import { useTheme } from './ThemeProvider';
import { useInstallPrompt } from './InstallPrompt';

export const TopBar: React.FC = () => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const { canInstall, promptInstall } = useInstallPrompt();

  return (
    <header className="sticky top-0 z-30 glass safe-top px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="bg-gradient-to-br from-accent to-accent2 p-2 rounded-xl shadow-[0_0_16px_rgb(var(--accent)/0.35)]">
          <Leaf className="w-4 h-4 text-bg" />
        </div>
        <h1 className="font-display text-base font-bold text-fg tracking-tight">
          {APP_NAME}
        </h1>
      </div>

      <div className="flex items-center gap-1">
        {canInstall && (
          <button
            onClick={promptInstall}
            aria-label="Install app"
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-accent text-bg text-xs font-bold transition-all active:scale-95 shadow-[0_0_14px_rgb(var(--accent)/0.35)]"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Install</span>
          </button>
        )}

        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2.5 rounded-full text-muted hover:text-fg hover:bg-surface2/10 transition-colors"
        >
          {resolvedTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
};
