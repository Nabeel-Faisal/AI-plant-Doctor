import React, { useState } from 'react';
import { Leaf, LayoutDashboard, Mic, X, Menu, Flower2, ScanLine } from 'lucide-react';
import { APP_NAME } from '../constants';

interface SidebarProps {
  navigate: (path: string) => void;
  currentPath: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ navigate, currentPath }) => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '#/dashboard' },
    { label: 'Plant Identifier', icon: ScanLine, path: '#/identify' },
    { label: 'AI Voice Interaction', icon: Mic, path: '#/voice' },
  ];

  const handleNav = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const isActive = (path: string) => {
    return currentPath.startsWith(path);
  };

  return (
    <>
      {/* Mobile Trigger */}
      <button 
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-800 rounded-lg text-white shadow-lg border border-slate-700"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-[#0f172a] border-r border-slate-800 z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="bg-green-500 p-2 rounded-lg shadow-[0_0_15px_rgba(34,197,94,0.3)]">
               <Leaf className="w-5 h-5 text-white" />
             </div>
             <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">
               {APP_NAME}
             </h1>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                isActive(item.path) 
                  ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-6 left-0 w-full px-6">
           <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center gap-3 mb-2">
                 <Flower2 className="w-8 h-8 text-pink-400" />
                 <div>
                    <div className="text-xs text-slate-400">Powered by</div>
                    <div className="font-bold text-white text-sm">Gemini 3 Pro</div>
                 </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                 Monitoring plant health with predictive vision AI.
              </p>
           </div>
        </div>
      </aside>
    </>
  );
};