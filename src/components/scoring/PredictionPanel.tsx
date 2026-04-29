import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

interface Prediction {
  id: string;
  user_id: string;
  inning: number;
  half: string;
  predicted_play: string;
  is_correct: boolean | null;
  points_awarded: number;
  created_at: string;
}

interface MemberProfile {
  user_id: string;
  display_name: string;
  profile_photo: string | null;
}

const PREDICTION_OPTIONS = [
  { value: 'hr', label: 'Home Run', emoji: '', points: 25 },
  { value: 'strikeout', label: 'Strikeout', emoji: '', points: 10 },
  { value: 'double_play', label: 'Double Play', emoji: '', points: 20 },
  { value: 'hit', label: 'Base Hit', emoji: '', points: 8 },
  { value: 'walk', label: 'Walk', emoji: '', points: 5 },
  { value: 'flyout', label: 'Fly Out', emoji: '', points: 5 },
  { value: 'groundout', label: 'Ground Out', emoji: '⬇️', points: 5 },
  { value: 'steal', label: 'Stolen Base', emoji: '', points: 15 },
];

interface PredictionPanelProps {
  predictions: Prediction[];
  profiles: MemberProfile[];
  userId?: string;
  currentInning: number;
  onPredict: (prediction: { inning: number; half: string; predicted_play: string }) => void;
  onResolve: (predictionId: string, isCorrect: boolean) => void;
}

export function PredictionPanel({ predictions, profiles, userId, currentInning, onPredict, onResolve }: PredictionPanelProps) {
  const [selectedPlay, setSelectedPlay] = useState('');
  const [half, setHalf] = useState<'top' | 'bottom'>('top');

  const myPendingPrediction = predictions.find(
    p => p.user_id === userId && p.inning === currentInning && p.half === half && p.is_correct === null
  );

  const handlePredict = () => {
    if (!selectedPlay || myPendingPrediction) return;
    onPredict({ inning: currentInning, half, predicted_play: selectedPlay });
    setSelectedPlay('');
  };

  const myStats = predictions.filter(p => p.user_id === userId);
  const correct = myStats.filter(p => p.is_correct === true).length;
  const total = myStats.filter(p => p.is_correct !== null).length;
  const streak = (() => {
    let s = 0;
    const resolved = myStats.filter(p => p.is_correct !== null).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    for (const p of resolved) {
      if (p.is_correct) s++;
      else break;
    }
    return s;
  })();

  const pendingPredictions = predictions.filter(p => p.is_correct === null);
  const recentResolved = predictions.filter(p => p.is_correct !== null).slice(-10).reverse();

  return (
    <div className="space-y-4">
      {/* My prediction stats */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-secondary" />
          <span className="text-sm font-bold text-foreground">Your Predictions</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center rounded-xl bg-muted/50 px-2 py-3">
            <p className="text-lg font-bold text-foreground">{total > 0 ? Math.round((correct / total) * 100) : 0}%</p>
            <p className="text-[10px] text-muted-foreground">Accuracy</p>
          </div>
          <div className="text-center rounded-xl bg-muted/50 px-2 py-3">
            <p className="text-lg font-bold text-foreground">{correct}/{total}</p>
            <p className="text-[10px] text-muted-foreground">Correct</p>
          </div>
          <div className="text-center rounded-xl bg-muted/50 px-2 py-3">
            <p className="text-lg font-bold text-secondary">{streak}</p>
            <p className="text-[10px] text-muted-foreground">Streak</p>
          </div>
        </div>
      </div>

      {/* Make a prediction */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-foreground">Predict Next Play</span>
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button onClick={() => setHalf('top')} className={`px-2.5 py-1 text-[10px] font-medium ${half === 'top' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>▲ Top {currentInning}</button>
            <button onClick={() => setHalf('bottom')} className={`px-2.5 py-1 text-[10px] font-medium ${half === 'bottom' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>▼ Bot {currentInning}</button>
          </div>
        </div>

        {myPendingPrediction ? (
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-center">
            <p className="text-xs text-muted-foreground">Your prediction</p>
            <p className="text-sm font-bold text-foreground mt-1">
              <ConceptIcon name={PREDICTION_OPTIONS.find(o => o.value === myPendingPrediction.predicted_play)?.emoji} className="inline-block h-[1em] w-[1em] align-[-0.125em]" />{' '}
              {PREDICTION_OPTIONS.find(o => o.value === myPendingPrediction.predicted_play)?.label}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <Clock className="h-3 w-3" /> Waiting for result...
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {PREDICTION_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedPlay(opt.value)}
                  className={`flex flex-col items-center gap-0.5 rounded-xl border px-1.5 py-2 text-[10px] transition-all ${
                    selectedPlay === opt.value
                      ? 'border-primary bg-primary/5 font-semibold text-foreground'
                      : 'border-border hover:border-primary/30 text-muted-foreground'
                  }`}
                >
                  <span className="text-base"><ConceptIcon name={opt.emoji} className="inline-block h-[1em] w-[1em] align-[-0.125em]" /></span>
                  <span className="leading-tight text-center">{opt.label}</span>
                  <span className="text-primary font-bold">+{opt.points}</span>
                </button>
              ))}
            </div>
            <button
              onClick={handlePredict}
              disabled={!selectedPlay}
              className="w-full rounded-xl bg-secondary text-secondary-foreground py-2.5 text-sm font-semibold disabled:opacity-40 transition-opacity"
            >
               Lock In Prediction
            </button>
          </>
        )}
      </div>

      {/* Pending predictions from all users */}
      {pendingPredictions.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <span className="text-sm font-bold text-foreground mb-3 block">Live Predictions</span>
          <div className="space-y-2">
            {pendingPredictions.map(p => {
              const profile = profiles.find(pr => pr.user_id === p.user_id);
              const opt = PREDICTION_OPTIONS.find(o => o.value === p.predicted_play);
              const canResolve = p.user_id !== userId;
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 rounded-xl bg-muted/30 px-3 py-2"
                >
                  <div className="h-6 w-6 rounded-full bg-muted overflow-hidden flex-shrink-0">
                    {profile?.profile_photo ? (
                      <img src={profile.profile_photo} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                        {profile?.display_name?.charAt(0) ?? '?'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{profile?.display_name ?? 'Fan'}</p>
                    <p className="text-[10px] text-muted-foreground">
                      <ConceptIcon name={opt?.emoji} className="inline-block h-[1em] w-[1em] align-[-0.125em]" /> {opt?.label} • {p.half === 'top' ? '▲' : '▼'}{p.inning}
                    </p>
                  </div>
                  {canResolve && (
                    <div className="flex gap-1">
                      <button onClick={() => onResolve(p.id, true)} className="h-6 w-6 rounded-full bg-accent/20 flex items-center justify-center" title="Correct!">
                        <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                      </button>
                      <button onClick={() => onResolve(p.id, false)} className="h-6 w-6 rounded-full bg-destructive/20 flex items-center justify-center" title="Wrong">
                        <XCircle className="h-3.5 w-3.5 text-destructive" />
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent results */}
      {recentResolved.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <span className="text-sm font-bold text-foreground mb-3 block">Recent Results</span>
          <div className="space-y-1.5">
            {recentResolved.map(p => {
              const profile = profiles.find(pr => pr.user_id === p.user_id);
              const opt = PREDICTION_OPTIONS.find(o => o.value === p.predicted_play);
              return (
                <div key={p.id} className="flex items-center gap-2 text-xs">
                  <span className={p.is_correct ? 'text-accent' : 'text-destructive'}>
                    {p.is_correct ? '' : ''}
                  </span>
                  <span className="text-foreground font-medium">{profile?.display_name ?? 'Fan'}</span>
                  <span className="text-muted-foreground"><ConceptIcon name={opt?.emoji} className="inline-block h-[1em] w-[1em] align-[-0.125em]" /> {opt?.label}</span>
                  {p.is_correct && p.points_awarded > 0 && (
                    <span className="ml-auto text-accent font-bold">+{p.points_awarded}pts</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
