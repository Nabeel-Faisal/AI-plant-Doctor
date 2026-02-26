import React from 'react';
import { Leaf, PlusCircle } from 'lucide-react';
import { APP_NAME } from '../constants';

interface HeaderProps {
  onAddClick: () => void;
  showAdd?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onAddClick, showAdd = true }) => {
  return (
    <header className="sticky top-0 z-50 bg-[#0f172a]/90 backdrop-blur-md border-b border-gray-800 px-4 py-4 flex justify-between items-center shadow-lg">
      <div className="flex items-center gap-2" onClick={() => window.location.hash = ''} role="button">
        <div className="bg-green-500 p-2 rounded-lg shadow-[0_0_15px_rgba(34,197,94,0.3)]">
          <Leaf className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">
          {APP_NAME}
        </h1>
      </div>
      
      {showAdd && (
        <button 
          onClick={onAddClick}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-full text-sm font-medium transition-all active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="hidden sm:inline">New Plant</span>
        </button>
      )}
    </header>
  );
};
