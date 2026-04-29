import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBarCheckins } from '@/hooks/useBarCheckins';
import { getRandomIcebreaker } from '@/lib/icebreakers';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ConceptIcon } from '@/components/icons/ConceptIcon';
import { ConceptVisual } from '@/components/icons/ConceptThumb';

/**
 * Invisible component that triggers "Social Pulse" icebreaker notifications
 * when the user checks into a bar with 3+ other Buddies present.
 */
export function IcebreakerNotifier() {
  const { user } = useAuth();
  const { myCheckin, visibleCheckins } = useBarCheckins();
  const lastTriggeredBar = useRef<string | null>(null);

  useEffect(() => {
    if (!user || !myCheckin) return;

    const barName = myCheckin.bar_name;

    // Don't re-trigger for the same bar
    if (lastTriggeredBar.current === barName) return;

    // Count other users at this bar (excluding self)
    const othersAtBar = visibleCheckins.filter(
      (c) => c.bar_name === barName && c.user_id !== user.id
    );

    if (othersAtBar.length >= 3) {
      lastTriggeredBar.current = barName;
      const icebreaker = getRandomIcebreaker();

      // Haptic pulse
      if (navigator.vibrate) navigator.vibrate([30, 50, 30]);

      // Show toast
      toast.info(`$<ConceptVisual name={icebreaker.emoji} size="sm" /> Social Pulse`, {
        description: icebreaker.text,
        duration: 8000,
      });

      // Persist as notification
      supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'icebreaker',
          title: `$<ConceptVisual name={icebreaker.emoji} size="sm" /> Social Pulse`,
          body: icebreaker.text,
          emoji: icebreaker.emoji,
          metadata: { bar_name: barName, buddy_count: othersAtBar.length },
        })
        .then(() => {});
    }
  }, [user, myCheckin, visibleCheckins]);

  return null;
}
