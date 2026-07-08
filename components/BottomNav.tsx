import React from 'react';
import { LayoutDashboard, Mic, ScanLine } from 'lucide-react';

interface BottomNavProps {
  navigate: (path: string) => void;
  currentPath: string;
}

const NAV_ITEMS = [
  { label: 'Home', icon: LayoutDashboard, path: '#/dashboard' },
  { label: 'Identify', icon: ScanLine, path: '#/identify' },
  { label: 'Talk', icon: Mic, path: '#/voice' },
];

export const BottomNav: React.FC<BottomNavProps> = ({ navigate, currentPath }) => {
  const isActive = (path: string) => currentPath.startsWith(path);

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 flex justify-center px-4 pb-4 safe-bottom pointer-events-none">
      <div className="glass pointer-events-auto flex items-center gap-1 rounded-full p-1.5 shadow-2xl">
        {NAV_ITEMS.map(item => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm transition-all duration-300 ${
                active ? 'bg-accent text-bg shadow-[0_0_20px_rgb(var(--accent)/0.5)]' : 'text-muted hover:text-fg'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className={`overflow-hidden transition-all duration-300 whitespace-nowrap ${active ? 'max-w-[6rem] ml-0' : 'max-w-0'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
