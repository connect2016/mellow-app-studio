import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapPin, Users, Beer, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface WatchParty {
  id: string;
  host_id: string;
  venue_name: string;
  city: string;
  address: string | null;
  game_label: string;
  start_time: string;
  max_attendees: number;
  rsvps: string[];
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export function WatchPartyMode() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: parties = [], isLoading } = useQuery({
    queryKey: ['watch-parties'],
    queryFn: async (): Promise<WatchParty[]> => {
      const { data, error } = await supabase
        .from('watch_parties' as any)
        .select('*')
        .gte('start_time', new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString())
        .order('start_time', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as WatchParty[];
    },
  });

  const rsvp = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('toggle_watch_party_rsvp' as any, { _party_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['watch-parties'] });
    },
    onError: (e: any) => toast.error(e.message || 'Could not update RSVP'),
  });

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-secondary/40 bg-primary/90 p-4 text-primary-foreground shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold uppercase tracking-wide" style={{ fontFamily: 'Norwester, sans-serif' }}>
              <MapPin className="inline h-4 w-4 mr-1 text-secondary" />
              Find a Watch Party Near You 📍
            </h2>
            <p className="text-xs text-primary-foreground/80 mt-1">
              Cubs fans watching the game together — anywhere outside Wrigleyville.
            </p>
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              className="mt-3 w-full min-h-12 bg-secondary text-secondary-foreground font-extrabold hover:bg-secondary/90"
            >
              <Beer className="h-4 w-4 mr-2" /> Host a Watch Party 🍺
            </Button>
          </DialogTrigger>
          <HostWatchPartyDialog
            onClose={() => setOpen(false)}
            onCreated={() => {
              qc.invalidateQueries({ queryKey: ['watch-parties'] });
              setOpen(false);
            }}
          />
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-secondary" />
        </div>
      ) : parties.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 p-6 text-center">
          <p className="text-sm text-muted-foreground">No watch parties scheduled yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Be the first to host one! 🍺</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {parties.map((p) => {
            const count = p.rsvps?.length ?? 0;
            const full = count >= p.max_attendees;
            const joined = user?.id ? p.rsvps?.includes(user.id) : false;
            return (
              <li
                key={p.id}
                className="rounded-2xl border border-white/10 bg-primary/90 p-4 text-primary-foreground shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-extrabold truncate" style={{ fontFamily: 'Norwester, sans-serif' }}>
                      {p.venue_name}
                    </h3>
                    <p className="text-xs text-primary-foreground/80 truncate">
                      <MapPin className="inline h-3 w-3 mr-1" />{p.city}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-secondary/15 px-2 py-0.5 text-[10px] font-bold uppercase text-secondary">
                    Watch Party
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-primary-foreground/90">
                  <span><Calendar className="inline h-3 w-3 mr-1" />{formatDateTime(p.start_time)}</span>
                  <span className="font-semibold">vs {p.game_label}</span>
                  <span><Users className="inline h-3 w-3 mr-1" />{count}/{p.max_attendees}</span>
                </div>

                <Button
                  onClick={() => rsvp.mutate(p.id)}
                  disabled={rsvp.isPending || (full && !joined)}
                  className={`mt-3 w-full min-h-12 font-extrabold ${
                    joined
                      ? 'bg-white/15 hover:bg-white/20 text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/90'
                  }`}
                >
                  {joined ? '✓ You’re in — Tap to leave' : full ? 'Party Full' : 'RSVP'}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function HostWatchPartyDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    venue_name: '',
    city: '',
    address: '',
    game_label: '',
    start_time: '',
    max_attendees: 20,
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Sign in to host a watch party');
      return;
    }
    if (!form.venue_name || !form.city || !form.game_label || !form.start_time) {
      toast.error('Please fill out the required fields');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('watch_parties' as any).insert({
      host_id: user.id,
      venue_name: form.venue_name,
      city: form.city,
      address: form.address || null,
      game_label: form.game_label,
      start_time: new Date(form.start_time).toISOString(),
      max_attendees: Number(form.max_attendees) || 20,
      rsvps: [user.id],
    } as any);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Watch party posted! 🍺');
    onCreated();
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="font-extrabold" style={{ fontFamily: 'Norwester, sans-serif' }}>
          Host a Watch Party 🍺
        </DialogTitle>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <Label htmlFor="venue">Venue name *</Label>
          <Input id="venue" value={form.venue_name} onChange={e => setForm({ ...form, venue_name: e.target.value })} placeholder="The Cubby Bear North" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="city">City *</Label>
            <Input id="city" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Naperville, IL" />
          </div>
          <div>
            <Label htmlFor="max">Max attendees</Label>
            <Input id="max" type="number" min={2} max={500} value={form.max_attendees}
              onChange={e => setForm({ ...form, max_attendees: Number(e.target.value) })} />
          </div>
        </div>
        <div>
          <Label htmlFor="addr">Address</Label>
          <Input id="addr" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="123 Main St" />
        </div>
        <div>
          <Label htmlFor="game">Which game? *</Label>
          <Input id="game" value={form.game_label} onChange={e => setForm({ ...form, game_label: e.target.value })} placeholder="Cubs vs Cardinals" />
        </div>
        <div>
          <Label htmlFor="start">Start time *</Label>
          <Input id="start" type="datetime-local" value={form.start_time}
            onChange={e => setForm({ ...form, start_time: e.target.value })} />
        </div>
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving} className="flex-1 bg-secondary text-secondary-foreground font-extrabold hover:bg-secondary/90">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post it'}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}
