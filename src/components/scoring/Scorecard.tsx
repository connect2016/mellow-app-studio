import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Plus } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

interface ScoringEntry {
  id: string;
  inning: number;
  half: string;
  runs: number;
  hits: number;
  errors: number;
  confirmed_by: string[];
  scored_by?: string | null;
}

interface ScorerProfile {
  user_id: string;
  display_name: string;
  profile_photo: string | null;
}

interface ScorecardProps {
  homeTeam: string;
  awayTeam: string;
  entries: ScoringEntry[];
  onAddEntry: (entry: { inning: number; half: string; runs: number; hits: number; errors: number }) => void;
  onConfirm: (entryId: string) => void;
  userId?: string;
  memberCount: number;
  scorerProfiles?: ScorerProfile[];
}

const INNINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function Scorecard({ homeTeam, awayTeam, entries, onAddEntry, onConfirm, userId, memberCount, scorerProfiles = [] }: ScorecardProps) {
  const [editCell, setEditCell] = useState<{ inning: number; half: string } | null>(null);
  const [editVal, setEditVal] = useState('0');

  const getEntry = (inning: number, half: string) => entries.find(e => e.inning === inning && e.half === half);
  const getScorer = (inning: number) => {
    const entry = entries.find(e => e.inning === inning && e.scored_by);
    if (!entry?.scored_by) return null;
    return scorerProfiles.find(p => p.user_id === entry.scored_by) ?? null;
  };

  const totalRuns = (half: string) => entries.filter(e => e.half === half).reduce((s, e) => s + e.runs, 0);
  const totalHits = (half: string) => entries.filter(e => e.half === half).reduce((s, e) => s + e.hits, 0);
  const totalErrors = (half: string) => entries.filter(e => e.half === half).reduce((s, e) => s + e.errors, 0);

  const handleSave = () => {
    if (!editCell) return;
    onAddEntry({ inning: editCell.inning, half: editCell.half, runs: parseInt(editVal) || 0, hits: 0, errors: 0 });
    setEditCell(null);
  };

  return (
    <div className="rounded-2xl border-2 border-[hsl(var(--ivy-green)/0.3)] overflow-hidden shadow-sm" style={{ backgroundColor: '#F9F8F4' }}>
      {/* Header pennant */}
      <div className="px-4 py-2.5 border-b border-[hsl(var(--ivy-green)/0.2)] flex items-center gap-2" style={{ backgroundColor: '#F4F1E8' }}>
        <span className="text-sm"><ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" /></span>
        <span className="font-['Share_Tech_Mono'] text-xs font-bold tracking-wider uppercase" style={{ color: 'hsl(var(--ivy-green))' }}>
          Official Scorecard
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
          <thead>
            <tr style={{ borderBottom: '2px solid hsl(var(--ivy-green) / 0.25)' }}>
              <th className="text-left px-3 py-2 text-xs font-bold sticky left-0 z-10 min-w-[80px]" style={{ backgroundColor: '#F4F1E8', color: 'hsl(var(--ivy-green))' }}>
                TEAM
              </th>
              {INNINGS.map(i => {
                const scorer = getScorer(i);
                return (
                  <th key={i} className="px-1.5 py-2 text-center w-9 relative" style={{ borderLeft: '1px solid hsl(var(--ivy-green) / 0.15)' }}>
                    <span className="text-xs font-bold" style={{ color: 'hsl(var(--ivy-green))' }}>{i}</span>
                    {scorer && (
                      <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2">
                        <Avatar className="h-3.5 w-3.5 border border-[hsl(var(--ivy-green)/0.3)]">
                          <AvatarImage src={scorer.profile_photo ?? undefined} />
                          <AvatarFallback className="text-[6px] bg-muted">{scorer.display_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </div>
                    )}
                  </th>
                );
              })}
              <th className="px-2 py-2 text-center text-xs font-black" style={{ backgroundColor: 'hsl(var(--ivy-green) / 0.08)', color: 'hsl(var(--ivy-green))', borderLeft: '2px solid hsl(var(--ivy-green) / 0.3)' }}>R</th>
              <th className="px-2 py-2 text-center text-xs font-black" style={{ backgroundColor: 'hsl(var(--ivy-green) / 0.08)', color: 'hsl(var(--ivy-green))' }}>H</th>
              <th className="px-2 py-2 text-center text-xs font-black" style={{ backgroundColor: 'hsl(var(--ivy-green) / 0.08)', color: 'hsl(var(--ivy-green))' }}>E</th>
            </tr>
          </thead>
          <tbody>
            {/* Away team (top) */}
            <tr style={{ borderBottom: '1px solid hsl(var(--ivy-green) / 0.15)' }}>
              <td className="px-3 py-2 text-xs font-bold sticky left-0 z-10" style={{ backgroundColor: '#F9F8F4', color: 'hsl(var(--foreground))' }}>
                {awayTeam || 'Away'}
              </td>
              {INNINGS.map(i => {
                const entry = getEntry(i, 'top');
                const isEditing = editCell?.inning === i && editCell?.half === 'top';
                const confirmed = entry && userId && (entry.confirmed_by as string[])?.includes(userId);
                const confirmCount = entry ? (entry.confirmed_by as string[])?.length ?? 0 : 0;
                const isConfirmed = confirmCount >= Math.max(2, Math.ceil(memberCount * 0.5));
                return (
                  <td key={i} className="px-0.5 py-1 text-center relative" style={{ borderLeft: '1px solid hsl(var(--ivy-green) / 0.12)' }}>
                    {isEditing ? (
                      <div className="flex items-center gap-0.5 justify-center">
                        <input
                          type="number" min={0} max={99}
                          className="w-7 h-7 text-center text-xs rounded border-2 focus:outline-none"
                          style={{ borderColor: 'hsl(var(--ivy-green))', backgroundColor: '#FFFFF0', fontFamily: "'Share Tech Mono', monospace" }}
                          value={editVal} onChange={e => setEditVal(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSave()} autoFocus
                        />
                        <button onClick={handleSave} style={{ color: 'hsl(var(--ivy-green))' }}><Check className="h-3 w-3" /></button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditCell({ inning: i, half: 'top' }); setEditVal(entry ? String(entry.runs) : '0'); }}
                        className="w-8 h-8 rounded flex items-center justify-center transition-all text-xs font-bold"
                        style={{
                          backgroundColor: entry ? (isConfirmed ? 'hsl(var(--ivy-green) / 0.1)' : 'transparent') : 'transparent',
                          color: entry ? (isConfirmed ? 'hsl(var(--ivy-green))' : 'hsl(var(--foreground))') : 'hsl(var(--muted-foreground) / 0.4)',
                          fontFamily: "'Share Tech Mono', monospace",
                        }}
                      >
                        {entry ? entry.runs : <Plus className="h-3 w-3" />}
                      </button>
                    )}
                    {entry && !confirmed && userId && (
                      <button onClick={() => onConfirm(entry.id)} className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--ivy-green) / 0.15)' }} title="Confirm">
                        <Check className="h-2 w-2" style={{ color: 'hsl(var(--ivy-green))' }} />
                      </button>
                    )}
                  </td>
                );
              })}
              <td className="px-2 py-2 text-center text-xs font-black" style={{ backgroundColor: 'hsl(var(--ivy-green) / 0.05)', borderLeft: '2px solid hsl(var(--ivy-green) / 0.3)', color: 'hsl(var(--foreground))' }}>{totalRuns('top')}</td>
              <td className="px-2 py-2 text-center text-xs" style={{ backgroundColor: 'hsl(var(--ivy-green) / 0.05)', color: 'hsl(var(--muted-foreground))' }}>{totalHits('top')}</td>
              <td className="px-2 py-2 text-center text-xs" style={{ backgroundColor: 'hsl(var(--ivy-green) / 0.05)', color: 'hsl(var(--muted-foreground))' }}>{totalErrors('top')}</td>
            </tr>
            {/* Home team (bottom) */}
            <tr>
              <td className="px-3 py-2 text-xs font-black sticky left-0 z-10" style={{ backgroundColor: '#F9F8F4', color: 'hsl(var(--accent))' }}>
                <ConceptIcon name="" className="inline-block h-[1em] w-[1em] align-[-0.125em]" /> {homeTeam}
              </td>
              {INNINGS.map(i => {
                const entry = getEntry(i, 'bottom');
                const isEditing = editCell?.inning === i && editCell?.half === 'bottom';
                const confirmed = entry && userId && (entry.confirmed_by as string[])?.includes(userId);
                const confirmCount = entry ? (entry.confirmed_by as string[])?.length ?? 0 : 0;
                const isConfirmed = confirmCount >= Math.max(2, Math.ceil(memberCount * 0.5));
                return (
                  <td key={i} className="px-0.5 py-1 text-center relative" style={{ borderLeft: '1px solid hsl(var(--ivy-green) / 0.12)' }}>
                    {isEditing ? (
                      <div className="flex items-center gap-0.5 justify-center">
                        <input
                          type="number" min={0} max={99}
                          className="w-7 h-7 text-center text-xs rounded border-2 focus:outline-none"
                          style={{ borderColor: 'hsl(var(--ivy-green))', backgroundColor: '#FFFFF0', fontFamily: "'Share Tech Mono', monospace" }}
                          value={editVal} onChange={e => setEditVal(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSave()} autoFocus
                        />
                        <button onClick={handleSave} style={{ color: 'hsl(var(--ivy-green))' }}><Check className="h-3 w-3" /></button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditCell({ inning: i, half: 'bottom' }); setEditVal(entry ? String(entry.runs) : '0'); }}
                        className="w-8 h-8 rounded flex items-center justify-center transition-all text-xs font-bold"
                        style={{
                          backgroundColor: entry ? (isConfirmed ? 'hsl(var(--ivy-green) / 0.1)' : 'transparent') : 'transparent',
                          color: entry ? (isConfirmed ? 'hsl(var(--ivy-green))' : 'hsl(var(--foreground))') : 'hsl(var(--muted-foreground) / 0.4)',
                          fontFamily: "'Share Tech Mono', monospace",
                        }}
                      >
                        {entry ? entry.runs : <Plus className="h-3 w-3" />}
                      </button>
                    )}
                    {entry && !confirmed && userId && (
                      <button onClick={() => onConfirm(entry.id)} className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--ivy-green) / 0.15)' }} title="Confirm">
                        <Check className="h-2 w-2" style={{ color: 'hsl(var(--ivy-green))' }} />
                      </button>
                    )}
                  </td>
                );
              })}
              <td className="px-2 py-2 text-center text-xs font-black" style={{ backgroundColor: 'hsl(var(--ivy-green) / 0.05)', borderLeft: '2px solid hsl(var(--ivy-green) / 0.3)', color: 'hsl(var(--foreground))' }}>{totalRuns('bottom')}</td>
              <td className="px-2 py-2 text-center text-xs" style={{ backgroundColor: 'hsl(var(--ivy-green) / 0.05)', color: 'hsl(var(--muted-foreground))' }}>{totalHits('bottom')}</td>
              <td className="px-2 py-2 text-center text-xs" style={{ backgroundColor: 'hsl(var(--ivy-green) / 0.05)', color: 'hsl(var(--muted-foreground))' }}>{totalErrors('bottom')}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="px-3 py-2 flex items-center gap-3 text-[10px] border-t" style={{ borderColor: 'hsl(var(--ivy-green) / 0.15)', backgroundColor: '#F4F1E8', color: 'hsl(var(--muted-foreground))' }}>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'hsl(var(--ivy-green))' }} /> Confirmed
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-muted" /> Pending
        </span>
        <span className="ml-auto font-['Share_Tech_Mono']">Tap cell to score</span>
      </div>
    </div>
  );
}
