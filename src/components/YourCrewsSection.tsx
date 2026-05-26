import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCrews, useCreateCrew } from '@/hooks/useCrews';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { MessageCircle, Plus, Users } from 'lucide-react';
import { toast } from 'sonner';

const EMOJI_OPTIONS = ['⚾', '🏆', '🍺', '🔵', '🏟', '❤️'];
const CUBS_BLUE = '#0E3386';

export function YourCrewsSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: crews = [] } = useCrews();
  const createCrew = useCreateCrew();

  const myCrews = crews.filter((c) => c.is_member);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('⚾');
  const [homeBar, setHomeBar] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  if (!user) return null;

  const reset = () => {
    setName(''); setEmoji('⚾'); setHomeBar(''); setIsPublic(true);
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      const desc = homeBar.trim() ? `Home bar: ${homeBar.trim()}` : '';
      const data = await createCrew.mutateAsync({
        name: name.trim().slice(0, 30),
        description: desc,
        badge_emoji: emoji,
      });
      // is_public stored only if column accepts (it does). Update separately.
      if (!isPublic) {
        const { supabase } = await import('@/integrations/supabase/client');
        await supabase.from('crews').update({ is_public: false }).eq('id', (data as any).id);
      }
      toast.success('Crew started! ⚾');
      setOpen(false);
      reset();
      navigate(`/crews/${(data as any).id}`);
    } catch (e: any) {
      toast.error(e.message || 'Could not create crew');
    }
  };

  return (
    <section className="mb-6">
      <h2
        className="mb-3 text-sm font-extrabold tracking-wider text-white/90"
        style={{ fontFamily: 'Norwester, sans-serif', letterSpacing: '0.08em' }}
      >
        YOUR CREWS
      </h2>

      {myCrews.length === 0 ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold text-white shadow-md transition-all active:scale-[0.98]"
          style={{ background: CUBS_BLUE, fontFamily: 'Norwester, sans-serif', letterSpacing: '0.03em' }}
        >
          <Plus className="h-4 w-4" />
          Start a Crew
        </button>
      ) : (
        <div className="space-y-2">
          {myCrews.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/95 p-3 shadow-sm"
            >
              <div className="text-[32px] leading-none">{c.badge_emoji}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-bold text-[#1a1f2e]">{c.name}</p>
                <p className="text-[11px] text-[#6b7280] flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {c.member_count} {c.member_count === 1 ? 'member' : 'members'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/crews/${c.id}?tab=chat`)}
                className="flex h-11 min-w-[44px] items-center gap-1 rounded-lg px-3 text-xs font-bold text-white"
                style={{ background: CUBS_BLUE }}
              >
                <MessageCircle className="h-4 w-4" />
                Chat
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/40 px-3 py-2 text-xs font-bold text-white/90 transition-all active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" /> Start another crew
          </button>
        </div>
      )}

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start a Crew</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="crew-name">Crew name</Label>
              <Input
                id="crew-name"
                maxLength={30}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Bleacher Bums"
              />
              <p className="mt-1 text-[10px] text-muted-foreground">{name.length}/30</p>
            </div>
            <div>
              <Label>Pick an emoji</Label>
              <div className="mt-2 grid grid-cols-6 gap-2">
                {EMOJI_OPTIONS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`h-11 rounded-lg border text-xl transition-all ${
                      emoji === e ? 'border-[#0E3386] bg-[#0E3386]/10 scale-105' : 'border-border'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="crew-bar">Home bar (optional)</Label>
              <Input
                id="crew-bar"
                value={homeBar}
                onChange={(e) => setHomeBar(e.target.value)}
                placeholder="e.g. Murphy's Bleachers"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">{isPublic ? 'Public crew' : 'Private crew'}</p>
                <p className="text-xs text-muted-foreground">
                  {isPublic ? 'Anyone can find and join.' : 'Invite only.'}
                </p>
              </div>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleCreate}
              disabled={!name.trim() || createCrew.isPending}
              className="w-full min-h-[44px] font-bold text-white"
              style={{ background: CUBS_BLUE }}
            >
              {createCrew.isPending ? 'Starting...' : 'Start this Crew'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
