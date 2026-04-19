import { useState } from 'react';
import { z } from 'zod';
import { Flag, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const REASONS = [
  { key: 'inappropriate', label: 'Inappropriate behavior' },
  { key: 'unsafe',        label: 'Unsafe location or plan' },
  { key: 'spam',          label: 'Spam or scam' },
  { key: 'no_show',       label: 'Host or attendees no-show' },
  { key: 'other',         label: 'Something else' },
] as const;

const reportSchema = z.object({
  reason: z.string().min(1).max(40),
  details: z.string().trim().max(500).optional(),
});

interface Props {
  open: boolean;
  onClose: () => void;
  meetupId: string;
  meetupTitle: string;
}

export function ReportMeetupSheet({ open, onClose, meetupId, meetupTitle }: Props) {
  const { user } = useAuth();
  const [reason, setReason] = useState<string>('inappropriate');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!user?.id) {
      toast.error('Sign in to report');
      return;
    }
    const parsed = reportSchema.safeParse({ reason, details });
    if (!parsed.success) {
      toast.error('Please choose a reason');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('meetup_reports').insert({
        meetup_id: meetupId,
        reporter_id: user.id,
        reason: parsed.data.reason,
        details: parsed.data.details || null,
      });
      if (error) {
        if (error.code === '23505') {
          toast('You already reported this meetup');
        } else {
          throw error;
        }
      } else {
        toast.success('Thanks — our team will review.');
      }
      onClose();
      setDetails('');
      setReason('inappropriate');
    } catch {
      toast.error("Couldn't submit report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <Flag className="h-5 w-5 text-destructive" /> Report this meetup
          </SheetTitle>
          <SheetDescription className="text-xs">
            Reports about <span className="font-semibold">{meetupTitle}</span> are confidential.
            Our team reviews every report.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              What's the issue?
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {REASONS.map(r => (
                <button
                  key={r.key}
                  onClick={() => setReason(r.key)}
                  className={`text-left px-3 py-2.5 rounded-xl border text-sm transition min-h-[44px] ${
                    reason === r.key
                      ? 'bg-primary text-primary-foreground border-primary font-semibold'
                      : 'bg-card text-foreground border-border hover:bg-muted'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              Details (optional)
            </p>
            <Textarea
              value={details}
              onChange={e => setDetails(e.target.value.slice(0, 500))}
              placeholder="What happened? (max 500 chars)"
              className="rounded-xl text-sm min-h-[88px]"
              maxLength={500}
            />
            <p className="text-[10px] text-muted-foreground mt-1 text-right">{details.length}/500</p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={onClose} variant="outline" className="flex-1 rounded-full h-11">
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={submitting}
              variant="destructive"
              className="flex-1 rounded-full h-11 font-bold"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit report'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
