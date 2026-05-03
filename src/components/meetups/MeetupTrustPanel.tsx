import { IconButton } from '@/components/ui/IconButton';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield, ShieldCheck, Trophy, Flag, EyeOff, Eye, Sparkles, Users, Info, ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useHostTrust } from '@/hooks/useHostTrust';
import { ReportMeetupSheet } from './ReportMeetupSheet';
import { QuickBlockButton } from '@/components/QuickBlockButton';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

interface Props {
  meetupId: string;
  meetupTitle: string;
  hostId: string;
  hostIsVerified: boolean;
  mutualCount: number;
  isMember: boolean;
  isHost: boolean;
  myMembershipVisible: boolean;
}

export function MeetupTrustPanel({
  meetupId, meetupTitle, hostId, hostIsVerified, mutualCount,
  isMember, isHost, myMembershipVisible,
}: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showReport, setShowReport] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const trustQ = useHostTrust(hostId);
  const trust = trustQ.data;

  const visibilityMut = useMutation({
    mutationFn: async (next: boolean) => {
      if (!user?.id) throw new Error('Not signed in');
      const { error } = await supabase
        .from('lineup_members')
        .update({ is_visible: next })
        .eq('meetup_id', meetupId)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: (_, next) => {
      qc.invalidateQueries({ queryKey: ['meetup-detail', meetupId] });
      toast.success(next ? ' Visible to everyone' : ' Only RSVPs see you');
    },
    onError: () => toast.error("Couldn't update visibility"),
  });

  return (
    <TooltipProvider delayDuration={200}>
      <section className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-baseline justify-between mb-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Trust & safety
          </p>
          <Tooltip>
            <TooltipTrigger asChild>
              <IconButton
                aria-label="How trust works"
                className="text-muted-foreground hover:text-foreground"
                icon={<Info className="h-3.5 w-3.5" />}
              />
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[240px] text-xs">
              We surface signals — verification, host history, mutual connections — so you can decide for yourself.
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Signal chips */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {trust?.is_trusted && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-primary/10 text-primary px-2 py-1 rounded-full cursor-help">
                  <Trophy className="h-3 w-3" /> Trusted Host
                </span>
              </TooltipTrigger>
              <TooltipContent className="text-xs max-w-[220px]">
                Verified, has hosted {trust.hosted_count}+ meetups, no recent reports.
              </TooltipContent>
            </Tooltip>
          )}
          {hostIsVerified && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-secondary/40 text-foreground/80 px-2 py-1 rounded-full cursor-help">
                  <ShieldCheck className="h-3 w-3 text-primary" /> Verified host
                </span>
              </TooltipTrigger>
              <TooltipContent className="text-xs max-w-[220px]">
                Host completed our selfie verification.
              </TooltipContent>
            </Tooltip>
          )}
          {mutualCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-muted text-foreground/80 px-2 py-1 rounded-full">
              <Users className="h-3 w-3" /> {mutualCount} mutual
            </span>
          )}
          {trust?.is_first_time && !trust?.is_trusted && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-secondary/40 text-secondary-foreground px-2 py-1 rounded-full cursor-help">
                  <Sparkles className="h-3 w-3" /> New host
                </span>
              </TooltipTrigger>
              <TooltipContent className="text-xs max-w-[220px]">
                First time hosting — feel free to ask questions in chat.
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Always-on safety reminders */}
        <ul className="space-y-1.5 text-xs">
          <li className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-foreground/90">Safety timer available after you RSVP</span>
          </li>
          <li className="flex items-center gap-2">
            <EyeOff className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-foreground/90">Your exact location is never shown</span>
          </li>
        </ul>

        {/* Per-meetup visibility (members only) */}
        {isMember && !isHost && (
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                {myMembershipVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                Show me on the attendee list
              </p>
              <p className="text-[11px] text-muted-foreground">
                {myMembershipVisible
                  ? 'Anyone viewing this meetup sees you.'
                  : 'Only other RSVPs see you.'}
              </p>
            </div>
            <Switch
              checked={myMembershipVisible}
              disabled={visibilityMut.isPending}
              onCheckedChange={v => visibilityMut.mutate(v)}
              aria-label="Toggle attendee visibility"
            />
          </div>
        )}

        {/* Expandable actions */}
        <button
          onClick={() => setShowDetails(s => !s)}
          className="mt-3 w-full flex items-center justify-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground py-1.5"
        >
          <ChevronDown className={`h-3 w-3 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
          {showDetails ? 'Hide safety actions' : 'Safety actions'}
        </button>

        <AnimatePresence initial={false}>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-2 grid grid-cols-1 gap-1.5">
                <button
                  onClick={() => setShowReport(true)}
                  className="flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-xs min-h-[44px]"
                >
                  <Flag className="h-4 w-4 text-destructive shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">Report this meetup</p>
                    <p className="text-[10px] text-muted-foreground">Confidential — reviewed by our team</p>
                  </div>
                </button>

                {!isHost && hostId !== user?.id && (
                  <div className="px-3 py-2.5 rounded-xl border border-border bg-card flex items-center gap-2 min-h-[44px]">
                    <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-xs">Block or report the host</p>
                      <p className="text-[10px] text-muted-foreground">You won't see each other again</p>
                    </div>
                    <QuickBlockButton targetUserId={hostId} targetName="this host" />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <ReportMeetupSheet
          open={showReport}
          onClose={() => setShowReport(false)}
          meetupId={meetupId}
          meetupTitle={meetupTitle}
        />
      </section>
    </TooltipProvider>
  );
}
