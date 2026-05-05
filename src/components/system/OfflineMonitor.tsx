import { useEffect } from 'react';
import { toast } from 'sonner';

/**
 * Listens for browser online/offline events and surfaces a single
 * persistent warning toast while offline. Comes back with a confirmation
 * when connectivity returns. Stable IDs prevent duplicate toasts.
 */
export function OfflineMonitor() {
  useEffect(() => {
    const handleOffline = () => {
      toast.warning("You're offline — some features may not work", {
        duration: Infinity,
        id: 'offline-toast',
      });
    };

    const handleOnline = () => {
      toast.dismiss('offline-toast');
      toast.success('Back online!', { id: 'online-toast', duration: 2500 });
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // If we boot while offline, show the banner immediately.
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return null;
}

export default OfflineMonitor;
