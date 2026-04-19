import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBarPlanComments, type BarPlan } from '@/hooks/useBarPlans';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { formatDistanceToNowStrict } from 'date-fns';

interface Props {
  plan: BarPlan;
  onClose: () => void;
}

export function BarPlanCommentsSheet({ plan, onClose }: Props) {
  const { user } = useAuth();
  const { comments, isLoading, addComment, deleteComment } = useBarPlanComments(plan.id);
  const [body, setBody] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleSend = async () => {
    const text = body.trim();
    if (!text) return;
    setBody('');
    try {
      await addComment.mutateAsync(text);
    } catch (err: any) {
      toast.error(err.message || 'Failed to comment');
      setBody(text);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 280 }}
        className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] rounded-t-3xl bg-card border-t border-border flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Discussion</p>
            <h3 className="font-bold text-foreground truncate">{plan.title}</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px]">
          {isLoading && (
            <div className="text-center py-8 text-xs text-muted-foreground">Loading...</div>
          )}
          {!isLoading && comments.length === 0 && (
            <div className="text-center py-12">
              <p className="text-2xl">💬</p>
              <p className="mt-2 text-xs text-muted-foreground">No comments yet — start the conversation.</p>
            </div>
          )}
          {comments.map(c => {
            const isMe = c.user_id === user?.id;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}
              >
                <div className="h-7 w-7 rounded-full overflow-hidden bg-muted border border-border shrink-0">
                  {c.author?.profile_photo ? (
                    <img src={c.author.profile_photo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                      {c.author?.display_name?.charAt(0) ?? '?'}
                    </div>
                  )}
                </div>
                <div className={`max-w-[75%] group ${isMe ? 'text-right' : ''}`}>
                  <p className="text-[10px] text-muted-foreground mb-0.5">
                    {isMe ? 'You' : c.author?.display_name ?? 'Crew member'}
                  </p>
                  <div className={`inline-block rounded-2xl px-3 py-2 text-sm ${
                    isMe ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted text-foreground rounded-tl-sm'
                  }`}>
                    {c.body}
                  </div>
                  <div className={`text-[9px] text-muted-foreground mt-0.5 flex items-center gap-1.5 ${isMe ? 'justify-end' : ''}`}>
                    <span>{formatDistanceToNowStrict(new Date(c.created_at), { addSuffix: true })}</span>
                    {isMe && (
                      <button
                        onClick={() => deleteComment.mutate(c.id)}
                        className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
          <div ref={endRef} />
        </div>

        <div className="border-t border-border bg-card p-3">
          <div className="flex gap-2">
            <Input
              placeholder="Add a comment..."
              value={body}
              onChange={e => setBody(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              className="rounded-full"
              maxLength={300}
            />
            <Button size="icon" onClick={handleSend} disabled={!body.trim() || addComment.isPending} className="rounded-full shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
