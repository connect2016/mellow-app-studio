import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Shield, Eye, Ban, Flag, LogOut, Trash2, Accessibility, AlertTriangle, Loader2, MapPin } from 'lucide-react';
import { StatsCustomizer } from '@/components/StatsCustomizer';
import { NotificationPreferencesPanel } from '@/components/NotificationPreferencesPanel';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGeolocation } from '@/hooks/useGeolocation';
import { GeolocationModal } from '@/components/GeolocationModal';
import bgSettings from '@/assets/bg-settings-cubs-hallway.jpg';

export default function Settings() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const geo = useGeolocation();
  const [hideFromDiscover, setHideFromDiscover] = useState(false);
  const [seatPrivacy, setSeatPrivacy] = useState('MatchesOnly');
  const [barPrivacy, setBarPrivacy] = useState('MatchesOnly');
  const [reducedMotion, setReducedMotion] = useState(() => {
    return localStorage.getItem('reduce-motion') === 'true';
  });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke('delete-account');
      if (error) throw error;
      await supabase.auth.signOut();
      toast({ title: 'Your account has been deleted.' });
      navigate('/', { replace: true });
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Couldn't delete account",
        description: e?.message ?? 'Please try again or contact support.',
        variant: 'destructive',
      });
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (reducedMotion) {
      document.documentElement.classList.add('reduce-motion');
      localStorage.setItem('reduce-motion', 'true');
    } else {
      document.documentElement.classList.remove('reduce-motion');
      localStorage.setItem('reduce-motion', 'false');
    }
  }, [reducedMotion]);

  return (
    <div className="min-h-screen bg-background pb-24 relative">
      <div className="fixed inset-0 z-0" style={{ backgroundImage: `url(${bgSettings})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div className="fixed inset-0 z-0" style={{ backgroundColor: 'hsla(222, 47%, 8%, 0.55)' }} />
      <div className="relative z-10">
      <AppHeader />
      <div className="mx-auto max-w-lg px-4 pt-4 space-y-6">
        <h2 className="text-lg font-bold text-white drop-shadow-lg">Front Office</h2>

        {/* Privacy */}
        <div className="rounded-xl border border-white/20 bg-black/60 backdrop-blur-md p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Eye className="h-4 w-4 text-primary" /> Privacy
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Hide from Discover</p>
              <p className="text-xs text-white/70">Your profile won't appear to others</p>
            </div>
            <Switch checked={hideFromDiscover} onCheckedChange={setHideFromDiscover} />
          </div>

          <Separator className="bg-white/20" />

          <div className="space-y-2">
            <Label className="text-sm text-white">Seat location visibility</Label>
            <Select value={seatPrivacy} onValueChange={setSeatPrivacy}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Public">Everyone</SelectItem>
                <SelectItem value="MatchesOnly">Matches Only</SelectItem>
                <SelectItem value="Hidden">Hidden</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-white">Bar location visibility</Label>
            <Select value={barPrivacy} onValueChange={setBarPrivacy}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Public">Everyone</SelectItem>
                <SelectItem value="MatchesOnly">Matches Only</SelectItem>
                <SelectItem value="Hidden">Hidden</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator className="bg-white/20" />

          <div className="flex items-center justify-between">
            <div className="pr-3">
              <p className="text-sm font-medium text-white flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" /> Location services
              </p>
              <p className="text-xs text-white/70">
                {geo.permission === 'granted'
                  ? `On${geo.zip ? ` · ZIP ${geo.zip}` : ''}`
                  : geo.permission === 'declined'
                  ? 'Off — using ZIP only'
                  : 'Not set'}
              </p>
            </div>
            <Switch
              checked={geo.permission === 'granted'}
              onCheckedChange={(checked) => {
                if (checked) {
                  geo.reopenModal();
                } else {
                  geo.stop();
                  geo.decline();
                }
              }}
            />
          </div>
        </div>

        <GeolocationModal
          open={geo.showModal}
          onOpenChange={geo.setShowModal}
          controller={geo}
        />

        {/* Safety */}
        <div className="rounded-xl border border-white/20 bg-black/60 backdrop-blur-md p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Shield className="h-4 w-4 text-primary" /> Safety
          </div>

          <Button variant="outline" className="w-full justify-start gap-2 rounded-xl" onClick={() => toast({ title: 'Blocked users list coming with backend' })}>
            <Ban className="h-4 w-4" /> Blocked Users
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2 rounded-xl" onClick={() => toast({ title: 'Report history coming with backend' })}>
            <Flag className="h-4 w-4" /> Report History
          </Button>
        </div>

        {/* Accessibility */}
        <div className="rounded-xl border border-white/20 bg-black/60 backdrop-blur-md p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Accessibility className="h-4 w-4 text-primary" /> Accessibility
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Reduce Motion</p>
              <p className="text-xs text-white/70">Disable animations and transitions</p>
            </div>
            <Switch checked={reducedMotion} onCheckedChange={setReducedMotion} />
          </div>
        </div>

        {/* Notifications */}
        <NotificationPreferencesPanel />

        {/* Stats Customization */}
        <div className="rounded-xl border border-white/20 bg-black/60 backdrop-blur-md p-4">
          <StatsCustomizer />
        </div>

        {/* Account */}
        <div className="rounded-xl border border-white/20 bg-black/60 backdrop-blur-md p-4 space-y-3">
          <div className="text-sm font-semibold text-white">Account</div>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 rounded-xl"
            onClick={async () => {
              await signOut();
              navigate('/', { replace: true });
            }}
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>

        {/* Danger Zone */}
        <div className="rounded-xl border-2 border-destructive/70 bg-destructive/10 backdrop-blur-md p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-destructive-foreground">
            <AlertTriangle className="h-4 w-4" /> Delete Account
          </div>
          <p className="text-xs text-white/85">
            This permanently deletes your profile, photo, and all your connections. This cannot be undone.
          </p>
          <Button
            variant="outline"
            className="w-full justify-center gap-2 rounded-xl border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => {
              setDeleteText('');
              setDeleteOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4" /> Delete my account
          </Button>
        </div>

        <Dialog open={deleteOpen} onOpenChange={(o) => !deleting && setDeleteOpen(o)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you absolutely sure?</DialogTitle>
              <DialogDescription>
                This will permanently delete your profile, photo, messages, and all
                connections. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="delete-confirm">Type <span className="font-mono font-bold">DELETE</span> to confirm</Label>
              <Input
                id="delete-confirm"
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value)}
                placeholder="DELETE"
                autoComplete="off"
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={deleteText !== 'DELETE' || deleting}
                onClick={handleDeleteAccount}
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete forever'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      </div>
    </div>
  );
}
