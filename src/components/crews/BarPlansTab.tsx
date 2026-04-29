import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, MessageCircle, Plus, X, Trash2, MapPin, CheckCircle2, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useBarPlans, type BarPlan } from '@/hooks/useBarPlans';
import { CURATED_BARS } from '@/lib/wrigleyville-bar-guide';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { formatDistanceToNowStrict } from 'date-fns';
import { BarPlanCommentsSheet } from './BarPlanCommentsSheet';
import { ConceptIcon } from '@/components/icons/ConceptIcon';
import { ConceptVisual } from '@/components/icons/ConceptThumb';

interface Props {
  crewId: string;
  isMember: boolean;
}

export function BarPlansTab({ crewId, isMember }: Props) {
  const { user } = useAuth();
  const { plans, isLoading, createPlan, addOption, removeOption, toggleVote, finalizePlan, deletePlan } = useBarPlans(crewId);

  const [showNewPlan, setShowNewPlan] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [activeCommentsPlan, setActiveCommentsPlan] = useState<BarPlan | null>(null);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      await createPlan.mutateAsync({ title: newTitle.trim(), notes: newNotes.trim() });
      toast.success('Plan started! Add some bars to vote on.');
      setNewTitle('');
      setNewNotes('');
      setShowNewPlan(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create plan');
    }
  };

  return (
    <motion.div key="plans" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="overflow-y-auto h-[calc(100vh-260px)]">
      <div className="mx-auto max-w-lg px-4 py-4 space-y-4">
        {isMember && (
          <Button variant="outline" onClick={() => setShowNewPlan(v => !v)} className="w-full rounded-xl gap-2">
            <Sparkles className="h-4 w-4" /> Start a Bar Plan
          </Button>
        )}

        <AnimatePresence>
          {showNewPlan && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="rounded-2xl border border-primary/20 bg-card p-4 space-y-3">
                <h3 className="font-semibold text-sm text-foreground">New Bar Plan</h3>
                <Input
                  placeholder="What's the vibe? (e.g. 'Saturday pre-game')"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="rounded-xl"
                  maxLength={80}
                />
                <Textarea
                  placeholder="Notes (optional) — budget, must-haves..."
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  className="rounded-xl min-h-[60px] resize-none"
                  maxLength={200}
                />
                <div className="flex gap-2">
                  <Button onClick={handleCreate} disabled={!newTitle.trim() || createPlan.isPending} className="flex-1 rounded-xl">
                    {createPlan.isPending ? 'Creating...' : ' Start Plan'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewPlan(false)} className="rounded-xl">Cancel</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading && (
          <div className="py-12 text-center">
            <p className="text-2xl animate-pulse"></p>
            <p className="mt-2 text-sm text-muted-foreground">Loading plans...</p>
          </div>
        )}

        {!isLoading && plans.length === 0 && !showNewPlan && (
          <div className="py-12 text-center">
            <p className="text-3xl"></p>
            <p className="mt-2 text-sm font-semibold text-foreground">No plans yet</p>
            <p className="text-xs text-muted-foreground mt-1">Shortlist bars together, vote on favorites, decide as a crew.</p>
          </div>
        )}

        {plans.map(plan => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isMember={isMember}
            isCreator={plan.creator_id === user?.id}
            currentUserId={user?.id}
            onAddBar={() => setAddingTo(plan.id)}
            onVote={(optionId, voted) => toggleVote.mutate({ optionId, currentlyVoted: voted })}
            onRemoveOption={(id) => removeOption.mutate(id)}
            onFinalize={(optionId) => finalizePlan.mutate({ planId: plan.id, optionId })}
            onDelete={() => {
              if (confirm('Delete this plan and all its votes?')) deletePlan.mutate(plan.id);
            }}
            onOpenComments={() => setActiveCommentsPlan(plan)}
          />
        ))}
      </div>

      {/* Add bar drawer */}
      <AnimatePresence>
        {addingTo && (
          <AddBarDrawer
            existingNames={plans.find(p => p.id === addingTo)?.options.map(o => o.bar_name.toLowerCase()) ?? []}
            onClose={() => setAddingTo(null)}
            onAdd={async (bar) => {
              try {
                await addOption.mutateAsync({ planId: addingTo, ...bar });
                toast.success(`${bar.bar_name} added`);
              } catch (err: any) {
                toast.error(err.message || 'Failed to add');
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Comments sheet */}
      <AnimatePresence>
        {activeCommentsPlan && (
          <BarPlanCommentsSheet plan={activeCommentsPlan} onClose={() => setActiveCommentsPlan(null)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Plan card
// ─────────────────────────────────────────────────────────────────────────────

interface PlanCardProps {
  plan: BarPlan;
  isMember: boolean;
  isCreator: boolean;
  currentUserId?: string;
  onAddBar: () => void;
  onVote: (optionId: string, currentlyVoted: boolean) => void;
  onRemoveOption: (optionId: string) => void;
  onFinalize: (optionId: string | null) => void;
  onDelete: () => void;
  onOpenComments: () => void;
}

function PlanCard({ plan, isMember, isCreator, currentUserId, onAddBar, onVote, onRemoveOption, onFinalize, onDelete, onOpenComments }: PlanCardProps) {
  const totalVotes = plan.options.reduce((s, o) => s + o.vote_count, 0);
  const maxVotes = Math.max(0, ...plan.options.map(o => o.vote_count));
  const isFinalized = plan.status === 'finalized';
  const finalOption = plan.options.find(o => o.id === plan.finalized_option_id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-4 space-y-3 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-foreground truncate">{plan.title}</h3>
            {isFinalized && (
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Decided
              </span>
            )}
          </div>
          {plan.notes && <p className="text-xs text-muted-foreground mt-0.5">{plan.notes}</p>}
          <p className="text-[10px] text-muted-foreground mt-1">
            {formatDistanceToNowStrict(new Date(plan.created_at), { addSuffix: true })}
          </p>
        </div>
        {isCreator && (
          <Button variant="ghost" size="icon" onClick={onDelete} className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Finalized banner */}
      {isFinalized && finalOption && (
        <div className="rounded-xl bg-primary/10 border border-primary/30 px-3 py-2.5 flex items-center gap-2">
          <span className="text-xl"><ConceptVisual name={finalOption.emoji} size="sm" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-primary uppercase tracking-wide">Going to</p>
            <p className="text-sm font-semibold text-foreground truncate">{finalOption.bar_name}</p>
          </div>
        </div>
      )}

      {/* Bars / shortlist */}
      <div className="space-y-2">
        {plan.options.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3 italic">No bars on the shortlist yet</p>
        ) : (
          plan.options.map(opt => {
            const pct = totalVotes > 0 ? Math.round((opt.vote_count / totalVotes) * 100) : 0;
            const isLeading = opt.vote_count === maxVotes && maxVotes > 0;
            const canRemove = opt.added_by === currentUserId && !isFinalized;

            return (
              <div
                key={opt.id}
                className={`relative overflow-hidden rounded-xl border transition-all ${
                  opt.user_voted ? 'border-primary bg-primary/[0.03]' : 'border-border bg-background'
                }`}
              >
                {/* Vote progress bar */}
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                    isLeading && opt.vote_count > 0 ? 'bg-primary/8' : 'bg-muted/40'
                  }`}
                  style={{ width: `${pct}%` }}
                />
                <div className="relative flex items-center gap-2 p-2.5">
                  <span className="text-xl shrink-0"><ConceptVisual name={opt.emoji} size="sm" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{opt.bar_name}</p>
                    {opt.address && (
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 truncate">
                        <MapPin className="h-2.5 w-2.5 shrink-0" />
                        {opt.address}
                      </p>
                    )}
                  </div>

                  {/* Vote button */}
                  <button
                    onClick={() => isMember && !isFinalized && onVote(opt.id, opt.user_voted)}
                    disabled={!isMember || isFinalized}
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-bold transition-all shrink-0 ${
                      opt.user_voted
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    aria-label={opt.user_voted ? 'Remove vote' : 'Upvote'}
                  >
                    <ThumbsUp className={`h-3 w-3 ${opt.user_voted ? 'fill-current' : ''}`} />
                    <span>{opt.vote_count}</span>
                  </button>

                  {/* Finalize / remove */}
                  {isCreator && !isFinalized && opt.vote_count > 0 && (
                    <button
                      onClick={() => onFinalize(opt.id)}
                      className="text-[10px] font-bold text-primary hover:underline shrink-0"
                      title="Pick this one"
                    >
                      Pick
                    </button>
                  )}
                  {canRemove && (
                    <button onClick={() => onRemoveOption(opt.id)} className="text-muted-foreground hover:text-destructive shrink-0" aria-label="Remove">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-dashed border-border/60">
        {isMember && !isFinalized && (
          <Button variant="ghost" size="sm" onClick={onAddBar} className="text-xs gap-1 h-8">
            <Plus className="h-3.5 w-3.5" /> Add bar
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onOpenComments} className="text-xs gap-1 h-8 ml-auto">
          <MessageCircle className="h-3.5 w-3.5" />
          {plan.comment_count > 0 ? `${plan.comment_count} comment${plan.comment_count !== 1 ? 's' : ''}` : 'Discuss'}
        </Button>
        {isCreator && isFinalized && (
          <Button variant="ghost" size="sm" onClick={() => onFinalize(null)} className="text-xs h-8">
            Reopen
          </Button>
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Add bar drawer (curated picker + free text)
// ─────────────────────────────────────────────────────────────────────────────

interface AddBarDrawerProps {
  existingNames: string[];
  onClose: () => void;
  onAdd: (bar: { bar_name: string; bar_slug?: string | null; address?: string | null; emoji?: string }) => Promise<void>;
}

function AddBarDrawer({ existingNames, onClose, onAdd }: AddBarDrawerProps) {
  const [search, setSearch] = useState('');
  const [customName, setCustomName] = useState('');

  const filtered = CURATED_BARS.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 30);

  const handleAddCurated = async (bar: typeof CURATED_BARS[number]) => {
    if (existingNames.includes(bar.name.toLowerCase())) return;
    await onAdd({ bar_name: bar.name, bar_slug: bar.slug, address: bar.address, emoji: bar.emoji });
  };

  const handleAddCustom = async () => {
    const name = customName.trim();
    if (!name) return;
    await onAdd({ bar_name: name, emoji: '' });
    setCustomName('');
    onClose();
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
          <h3 className="font-bold text-foreground">Add a Bar</h3>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        <div className="p-4 space-y-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search Wrigleyville bars..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 rounded-xl"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2">
          <div className="grid grid-cols-1 gap-1.5">
            {filtered.map(bar => {
              const already = existingNames.includes(bar.name.toLowerCase());
              return (
                <button
                  key={bar.id}
                  onClick={() => !already && handleAddCurated(bar)}
                  disabled={already}
                  className={`flex items-center gap-3 rounded-xl border p-2.5 text-left transition-all ${
                    already
                      ? 'border-border bg-muted/40 opacity-50 cursor-not-allowed'
                      : 'border-border bg-background hover:border-primary/40 hover:bg-primary/5'
                  }`}
                >
                  <span className="text-xl shrink-0"><ConceptVisual name={bar.emoji} size="sm" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{bar.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{bar.address}</p>
                  </div>
                  {already ? (
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">No matches in the curated guide.</p>
            )}
          </div>
        </div>

        {/* Custom add */}
        <div className="border-t border-border p-4 bg-muted/20">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Or add a custom spot</p>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. My buddy's apartment"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddCustom()}
              className="rounded-xl"
              maxLength={60}
            />
            <Button onClick={handleAddCustom} disabled={!customName.trim()} className="rounded-xl shrink-0">
              Add
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
