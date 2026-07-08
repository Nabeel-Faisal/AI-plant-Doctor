import React, { useEffect } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, children, title }) => {
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-lg bg-surface border-t border-border rounded-t-3xl shadow-2xl safe-bottom animate-sheet-up max-h-[85vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-surface pt-3 pb-2 flex flex-col items-center z-10">
          <div className="w-10 h-1.5 rounded-full bg-border" />
          {title && (
            <h3 className="font-display font-bold text-lg text-fg mt-3 px-6 self-start">{title}</h3>
          )}
        </div>
        <div className="px-6 pb-8 pt-2">{children}</div>
      </div>
    </div>
  );
};
