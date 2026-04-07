import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, ArrowRightLeft, Copy, Users } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface MemberProfile {
  user_id: string;
  display_name: string;
  profile_photo: string | null;
}

interface RelayPanelProps {
  sessionId: string;
  inviteCode?: string | null;
  activeScorerId?: string | null;
  members: MemberProfile[];
  userId?: string;
  onPassPencil: (toUserId: string) => void;
  activeBatter: number;
}

export function RelayPanel({ sessionId, inviteCode, activeScorerId, members, userId, onPassPencil, activeBatter }: RelayPanelProps) {
  const { toast } = useToast();
  const isActiveScorer = activeScorerId === userId;
  const activeScorer = members.find(m => m.user_id === activeScorerId);

  const copyInvite = () => {
    const link = `${window.location.origin}/score/${sessionId}`;
    navigator.clipboard.writeText(link);
    toast({ title: '🔗 Link copied!', description: 'Share with friends to co-score' });
  };

  const copyCode = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    toast({ title: '📋 Code copied!', description: inviteCode });
  };

  return (
    <div className="space-y-4">
      {/* Invite Section */}
      <div className="rounded-2xl border-2 p-4 space-y-3" style={{ borderColor: 'hsl(var(--ivy-green) / 0.2)', backgroundColor: '#F9F8F4' }}>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" style={{ color: 'hsl(var(--ivy-green))' }} />
          <span className="text-sm font-bold font-['Graduate']" style={{ color: 'hsl(var(--ivy-green))' }}>
            Invite Co-Scorers
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={copyInvite}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold border-2 transition-all"
            style={{ borderColor: 'hsl(var(--accent) / 0.3)', color: 'hsl(var(--accent))', fontFamily: "'Share Tech Mono', monospace" }}
          >
            🔗 Share Link
          </button>
          {inviteCode && (
            <button
              onClick={copyCode}
              className="flex items-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold border-2"
              style={{ borderColor: 'hsl(var(--ivy-green) / 0.3)', fontFamily: "'Share Tech Mono', monospace" }}
            >
              <Copy className="h-3 w-3" />
              <code className="font-mono">{inviteCode}</code>
            </button>
          )}
        </div>
      </div>

      {/* Active Scorer / Pass the Pencil */}
      <div className="rounded-2xl border-2 p-4 space-y-3" style={{ borderColor: 'hsl(var(--ivy-green) / 0.2)', backgroundColor: '#F9F8F4' }}>
        <div className="flex items-center gap-2">
          <Pencil className="h-4 w-4" style={{ color: 'hsl(var(--secondary))' }} />
          <span className="text-sm font-bold font-['Graduate']" style={{ color: 'hsl(var(--ivy-green))' }}>
            The Pencil
          </span>
        </div>

        {activeScorer ? (
          <div className="flex items-center gap-3 rounded-xl p-3" style={{ backgroundColor: 'hsl(var(--ivy-green) / 0.06)' }}>
            <Avatar className="h-8 w-8 border-2" style={{ borderColor: 'hsl(var(--ivy-green))' }}>
              <AvatarImage src={activeScorer.profile_photo ?? undefined} />
              <AvatarFallback className="text-xs font-bold">{activeScorer.display_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-xs font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                {isActiveScorer ? '✏️ You have the pencil' : `✏️ ${activeScorer.display_name} is scoring`}
              </p>
              <p className="text-[10px] font-['Share_Tech_Mono']" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Batter #{activeBatter}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>No active scorer — anyone can score</p>
        )}

        {/* Pass Pencil buttons */}
        {isActiveScorer && members.length > 1 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Pass the Pencil to:
            </p>
            {members.filter(m => m.user_id !== userId).map(m => (
              <motion.button
                key={m.user_id}
                whileTap={{ scale: 0.97 }}
                onClick={() => onPassPencil(m.user_id)}
                className="w-full flex items-center gap-3 rounded-xl p-2.5 border transition-all"
                style={{ borderColor: 'hsl(var(--ivy-green) / 0.15)' }}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={m.profile_photo ?? undefined} />
                  <AvatarFallback className="text-[8px]">{m.display_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-xs font-semibold flex-1 text-left">{m.display_name}</span>
                <ArrowRightLeft className="h-3.5 w-3.5" style={{ color: 'hsl(var(--ivy-green))' }} />
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
