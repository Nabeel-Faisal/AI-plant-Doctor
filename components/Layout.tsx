import React from 'react';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';

interface LayoutProps {
  children: React.ReactNode;
  navigate: (path: string) => void;
  currentPath: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, navigate, currentPath }) => {
  return (
    <div className="min-h-screen bg-bg text-fg relative overflow-x-hidden">
      {/* Ambient background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-15%] right-[-15%] w-[420px] h-[420px] bg-accent/10 rounded-full blur-[110px] animate-blob" />
        <div className="absolute bottom-[-15%] left-[-15%] w-[420px] h-[420px] bg-accent2/10 rounded-full blur-[110px] animate-blob" style={{ animationDelay: '3s' }} />
      </div>

      <TopBar />

      <main className="relative max-w-3xl mx-auto px-4 pt-6 safe-pb">
        {children}
      </main>

      <BottomNav navigate={navigate} currentPath={currentPath} />
    </div>
  );
};
