import React from 'react';
import { Leaf, Moon, Sun } from 'lucide-react';
import { APP_NAME } from '../constants';
import { useTheme } from './ThemeProvider';

export const TopBar: React.FC = () => {
  const { resolvedTheme, toggleTheme } = useTheme();

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

      <button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="p-2.5 rounded-full text-muted hover:text-fg hover:bg-surface2/10 transition-colors"
      >
        {resolvedTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
    </header>
  );
};
