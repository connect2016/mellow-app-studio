import { useState } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Shield, Eye, Ban, Flag, LogOut, Trash2 } from 'lucide-react';
import bgCubsFansCelebrating from '@/assets/bg-cubs-fans-celebrating.png';

export default function Settings() {
  const { toast } = useToast();
  const [hideFromDiscover, setHideFromDiscover] = useState(false);
  const [seatPrivacy, setSeatPrivacy] = useState('MatchesOnly');
  const [barPrivacy, setBarPrivacy] = useState('MatchesOnly');

  return (
    <div className="min-h-screen bg-background pb-24 relative">
      <div className="fixed inset-0 z-0" style={{ backgroundImage: `url(${bgCubsFansCelebrating})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div className="fixed inset-0 z-0" style={{ backgroundColor: 'hsla(222, 47%, 11%, 0.25)' }} />
      <div className="relative z-10">
      <AppHeader />
      <div className="mx-auto max-w-lg px-4 pt-4 space-y-6">
        <h2 className="text-lg font-bold">Front Office</h2>

        {/* Privacy */}
        <div className="rounded-xl border bg-card p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Eye className="h-4 w-4 text-primary" /> Privacy
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Hide from Discover</p>
              <p className="text-xs text-muted-foreground">Your profile won't appear to others</p>
            </div>
            <Switch checked={hideFromDiscover} onCheckedChange={setHideFromDiscover} />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-sm">Seat location visibility</Label>
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
            <Label className="text-sm">Bar location visibility</Label>
            <Select value={barPrivacy} onValueChange={setBarPrivacy}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Public">Everyone</SelectItem>
                <SelectItem value="MatchesOnly">Matches Only</SelectItem>
                <SelectItem value="Hidden">Hidden</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Safety */}
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Shield className="h-4 w-4 text-primary" /> Safety
          </div>

          <Button variant="outline" className="w-full justify-start gap-2 rounded-xl" onClick={() => toast({ title: 'Blocked users list coming with backend' })}>
            <Ban className="h-4 w-4" /> Blocked Users
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2 rounded-xl" onClick={() => toast({ title: 'Report history coming with backend' })}>
            <Flag className="h-4 w-4" /> Report History
          </Button>
        </div>

        {/* Account */}
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="text-sm font-semibold">Account</div>
          <Button variant="outline" className="w-full justify-start gap-2 rounded-xl" onClick={() => toast({ title: 'Logged out' })}>
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2 rounded-xl text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" /> Delete Account
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
}
