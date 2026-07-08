import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextType {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const VARIANT_STYLES: Record<ToastVariant, { icon: React.ElementType; accent: string }> = {
  success: { icon: CheckCircle2, accent: 'text-success' },
  error: { icon: XCircle, accent: 'text-danger' },
  info: { icon: Info, accent: 'text-accent' },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, variant }]);
    window.setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed inset-x-0 bottom-24 safe-bottom z-[200] flex flex-col items-center gap-2 px-4 pointer-events-none">
        {toasts.map(toast => {
          const { icon: Icon, accent } = VARIANT_STYLES[toast.variant];
          return (
            <div
              key={toast.id}
              role="status"
              className="glass pointer-events-auto w-full max-w-sm rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-3 animate-fade-in-up"
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${accent}`} />
              <p className="text-sm text-fg flex-1 leading-snug">{toast.message}</p>
              <button
                onClick={() => dismiss(toast.id)}
                className="text-muted hover:text-fg transition-colors flex-shrink-0"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};
