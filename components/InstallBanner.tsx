import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, X } from 'lucide-react';
import { useInstallPrompt } from './InstallPrompt';

const DISMISS_KEY = 'installBannerDismissedAt';
const DISMISS_FOR_MS = 7 * 24 * 60 * 60 * 1000;

function wasRecentlyDismissed(): boolean {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const dismissedAt = Number(raw);
  return !Number.isNaN(dismissedAt) && Date.now() - dismissedAt < DISMISS_FOR_MS;
}

export const InstallBanner: React.FC = () => {
  const { canInstall, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(wasRecentlyDismissed);

  useEffect(() => {
    if (canInstall) setDismissed(wasRecentlyDismissed());
  }, [canInstall]);

  if (!canInstall || dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  };

  const handleInstall = async () => {
    await promptInstall();
  };

  return createPortal(
    <div
      role="dialog"
      aria-label="Install AI Plant Doctor"
      className="fixed inset-x-4 z-50 flex justify-center animate-fade-in-up"
      style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}
    >
      <div className="glass w-full max-w-md rounded-2xl p-3.5 shadow-2xl flex items-center gap-2.5">
        <img src="/icons/icon-192.png" alt="" className="w-10 h-10 rounded-xl flex-shrink-0" />

        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-sm text-fg truncate">Install App</p>
          <p className="text-xs text-muted truncate">Add to home screen</p>
        </div>

        <button
          onClick={handleInstall}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-accent text-bg text-xs font-bold transition-all active:scale-95 shadow-[0_0_14px_rgb(var(--accent)/0.35)] flex-shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          Install
        </button>

        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="p-1 rounded-full text-muted hover:text-fg hover:bg-surface2/10 transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>,
    document.body
  );
};
