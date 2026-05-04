import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';

const STORAGE_KEY = 'cb_push_prompt_v1';

/**
 * Custom modal that asks the user before triggering the browser's native
 * Notification.requestPermission() prompt. Shows once per device per user
 * after sign-in (skipped if already granted/denied or dismissed).
 */
export function PushPermissionPrompt() {
  const { user } = useAuth();
  const { permission, subscribe, isSubscribing, isSupported } = usePushNotifications();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user || !isSupported) return;
    if (permission !== 'default') return;
    const dismissed = localStorage.getItem(`${STORAGE_KEY}:${user.id}`);
    if (dismissed) return;
    const t = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(t);
  }, [user, permission, isSupported]);

  const dismiss = (remember = true) => {
    if (user && remember) localStorage.setItem(`${STORAGE_KEY}:${user.id}`, '1');
    setOpen(false);
  };

  const handleEnable = async () => {
    const res = await subscribe();
    if (res.ok) {
      toast.success("You're in. We'll ping you for big game-day moments.");
      dismiss();
    } else {
      toast.error(res.error || 'Could not enable push notifications');
      dismiss();
    }
  };

  if (!user || !isSupported) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && dismiss(false)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">Get game-day alerts?</DialogTitle>
          <DialogDescription className="text-center">
            We'll ping you for new buddy requests, meetup invites, and live moments at Wrigley —
            even when the app is closed.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center gap-2">
          <Button variant="ghost" onClick={() => dismiss()} disabled={isSubscribing}>
            Not now
          </Button>
          <Button onClick={handleEnable} disabled={isSubscribing}>
            {isSubscribing ? 'Enabling…' : 'Turn on alerts'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
