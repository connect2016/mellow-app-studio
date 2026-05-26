import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Pin, Pencil, X, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface Props {
  crewId: string;
  isOwner: boolean;
}

export function PinnedMessageBar({ crewId, isOwner }: Props) {
  const qc = useQueryClient();
  const { data: pinned } = useQuery({
    queryKey: ['crew-pinned', crewId],
    queryFn: async () => {
      const { data } = await supabase
        .from('crew_messages')
        .select('id, body, sender_id')
        .eq('crew_id', crewId)
        .eq('is_pinned', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!crewId,
  });

  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');

  const startEdit = () => {
    setText(pinned?.body ?? '');
    setEditing(true);
  };

  const save = useMutation({
    mutationFn: async () => {
      const body = text.trim().slice(0, 120);
      if (!body) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      // Unpin previous
      await supabase.from('crew_messages').update({ is_pinned: false }).eq('crew_id', crewId).eq('is_pinned', true);
      // Insert new pinned message
      const { error } = await supabase.from('crew_messages').insert({
        crew_id: crewId,
        sender_id: user.id,
        body,
        is_pinned: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Pinned message updated');
      setEditing(false);
      qc.invalidateQueries({ queryKey: ['crew-pinned', crewId] });
      qc.invalidateQueries({ queryKey: ['crew-messages', crewId] });
    },
    onError: (e: any) => toast.error(e.message || 'Could not pin message'),
  });

  if (!pinned && !isOwner) return null;

  return (
    <div className="border-b border-border bg-amber-50/70 px-4 py-2">
      <div className="mx-auto max-w-lg">
        {editing ? (
          <div className="flex items-center gap-2">
            <Pin className="h-4 w-4 shrink-0 text-amber-700" />
            <Input
              autoFocus
              maxLength={120}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Murphy's back booth before every home Tuesday"
              className="h-9 text-sm"
            />
            <button
              onClick={() => save.mutate()}
              disabled={!text.trim() || save.isPending}
              className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-600 text-white"
              aria-label="Save pinned message"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => setEditing(false)}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border"
              aria-label="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Pin className="h-4 w-4 shrink-0 text-amber-700" />
            <p className="flex-1 truncate text-xs font-medium text-amber-900">
              {pinned?.body ?? 'No pinned message yet'}
            </p>
            {isOwner && (
              <button
                onClick={startEdit}
                className="flex h-9 min-w-[44px] items-center gap-1 rounded-md px-2 text-xs font-bold text-amber-800 hover:bg-amber-100"
              >
                <Pencil className="h-3 w-3" />
                {pinned ? 'Edit' : 'Set pin'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
