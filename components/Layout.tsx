import React from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  navigate: (path: string) => void;
  currentPath: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, navigate, currentPath }) => {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <Sidebar navigate={navigate} currentPath={currentPath} />
      
      <div className="lg:ml-64 min-h-screen transition-all duration-300">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8 max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
};