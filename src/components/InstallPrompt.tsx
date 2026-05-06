import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Share } from 'lucide-react';

const DISMISS_KEY = 'pwa_dismissed';
const IOS_DISMISS_KEY = 'pwa_ios_dismissed';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function isInStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // @ts-ignore - iOS Safari
    window.navigator.standalone === true
  );
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showAndroid, setShowAndroid] = useState(false);
  const [showIOS, setShowIOS] = useState(false);

  useEffect(() => {
    if (isInStandaloneMode()) return;

    // Android / Chrome flow
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!localStorage.getItem(DISMISS_KEY)) {
        setTimeout(() => setShowAndroid(true), 3000);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);

    // iOS Safari fallback (no beforeinstallprompt)
    if (isIOS() && !localStorage.getItem(IOS_DISMISS_KEY)) {
      const t = setTimeout(() => setShowIOS(true), 3000);
      return () => {
        clearTimeout(t);
        window.removeEventListener('beforeinstallprompt', handler);
      };
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowAndroid(false);
    localStorage.setItem(DISMISS_KEY, '1');
  };

  const dismissAndroid = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setShowAndroid(false);
  };

  const dismissIOS = () => {
    localStorage.setItem(IOS_DISMISS_KEY, '1');
    setShowIOS(false);
  };

  if (!showAndroid && !showIOS) return null;

  return (
    <div
      role="dialog"
      aria-label="Install Cubbies Buddies"
      className="fixed left-2 right-2 z-[60] md:left-auto md:right-4 md:max-w-sm rounded-xl shadow-2xl border border-white/10 bg-[#0E3386] text-white"
      style={{ bottom: 'calc(64px + env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-start gap-3 p-3">
        <img src="/icon-192.png" alt="" className="h-12 w-12 rounded-lg flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight">Add to Home Screen</p>
          {showAndroid ? (
            <p className="text-xs text-white/80 mt-0.5">Get game-day alerts instantly.</p>
          ) : (
            <p className="text-xs text-white/80 mt-0.5 flex items-center gap-1 flex-wrap">
              Tap <Share className="h-3.5 w-3.5 inline" aria-label="Share" /> then{' '}
              <span className="font-medium">Add to Home Screen</span>.
            </p>
          )}
          {showAndroid && (
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                onClick={handleInstall}
                className="bg-white text-[#0E3386] hover:bg-white/90 h-8 px-3"
              >
                Add
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={dismissAndroid}
                className="text-white hover:bg-white/10 h-8 px-3"
              >
                Not now
              </Button>
            </div>
          )}
        </div>
        <button
          onClick={showAndroid ? dismissAndroid : dismissIOS}
          aria-label="Dismiss install prompt"
          className="text-white/70 hover:text-white p-1 -m-1 min-h-[48px] min-w-[48px] flex items-center justify-center"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
