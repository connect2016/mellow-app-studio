import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScoringEntry {
  id: string;
  inning: number;
  half: string;
  runs: number;
  hits: number;
  errors: number;
  confirmed_by: string[];
}

interface ScorecardProps {
  homeTeam: string;
  awayTeam: string;
  entries: ScoringEntry[];
  onAddEntry: (entry: { inning: number; half: string; runs: number; hits: number; errors: number }) => void;
  onConfirm: (entryId: string) => void;
  userId?: string;
  memberCount: number;
}

const INNINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function Scorecard({ homeTeam, awayTeam, entries, onAddEntry, onConfirm, userId, memberCount }: ScorecardProps) {
  const [editCell, setEditCell] = useState<{ inning: number; half: string } | null>(null);
  const [editVal, setEditVal] = useState('0');

  const getEntry = (inning: number, half: string) => entries.find(e => e.inning === inning && e.half === half);

  const totalRuns = (half: string) => entries.filter(e => e.half === half).reduce((s, e) => s + e.runs, 0);
  const totalHits = (half: string) => entries.filter(e => e.half === half).reduce((s, e) => s + e.hits, 0);
  const totalErrors = (half: string) => entries.filter(e => e.half === half).reduce((s, e) => s + e.errors, 0);

  const handleSave = () => {
    if (!editCell) return;
    onAddEntry({ inning: editCell.inning, half: editCell.half, runs: parseInt(editVal) || 0, hits: 0, errors: 0 });
    setEditCell(null);
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-primary/5">
              <th className="text-left px-3 py-2.5 font-bold text-foreground sticky left-0 bg-primary/5 z-10 min-w-[80px]">Team</th>
              {INNINGS.map(i => (
                <th key={i} className="px-2 py-2.5 text-center font-semibold text-muted-foreground w-8">{i}</th>
              ))}
              <th className="px-2 py-2.5 text-center font-bold text-foreground bg-primary/10">R</th>
              <th className="px-2 py-2.5 text-center font-bold text-foreground bg-primary/10">H</th>
              <th className="px-2 py-2.5 text-center font-bold text-foreground bg-primary/10">E</th>
            </tr>
          </thead>
          <tbody>
            {/* Away team (top) */}
            <tr className="border-t border-border">
              <td className="px-3 py-2.5 font-semibold text-foreground sticky left-0 bg-card z-10">{awayTeam || 'Away'}</td>
              {INNINGS.map(i => {
                const entry = getEntry(i, 'top');
                const isEditing = editCell?.inning === i && editCell?.half === 'top';
                const confirmed = entry && userId && (entry.confirmed_by as string[])?.includes(userId);
                const confirmCount = entry ? (entry.confirmed_by as string[])?.length ?? 0 : 0;
                return (
                  <td key={i} className="px-1 py-1 text-center relative">
                    {isEditing ? (
                      <div className="flex items-center gap-0.5">
                        <input
                          type="number"
                          min={0}
                          max={99}
                          className="w-7 h-7 text-center text-xs rounded border border-primary bg-background focus:outline-none"
                          value={editVal}
                          onChange={e => setEditVal(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSave()}
                          autoFocus
                        />
                        <button onClick={handleSave} className="text-primary"><Check className="h-3 w-3" /></button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditCell({ inning: i, half: 'top' }); setEditVal(entry ? String(entry.runs) : '0'); }}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                          entry
                            ? confirmCount >= Math.max(2, Math.ceil(memberCount * 0.5))
                              ? 'bg-accent/15 text-accent font-bold'
                              : 'bg-muted text-foreground font-semibold'
                            : 'bg-transparent text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {entry ? entry.runs : <Plus className="h-3 w-3" />}
                      </button>
                    )}
                    {entry && !confirmed && userId && (
                      <button onClick={() => onConfirm(entry.id)} className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-primary/20 flex items-center justify-center" title="Confirm this score">
                        <Check className="h-2 w-2 text-primary" />
                      </button>
                    )}
                  </td>
                );
              })}
              <td className="px-2 py-2.5 text-center font-bold text-foreground bg-primary/5">{totalRuns('top')}</td>
              <td className="px-2 py-2.5 text-center text-muted-foreground bg-primary/5">{totalHits('top')}</td>
              <td className="px-2 py-2.5 text-center text-muted-foreground bg-primary/5">{totalErrors('top')}</td>
            </tr>
            {/* Home team (bottom) */}
            <tr className="border-t border-border">
              <td className="px-3 py-2.5 font-bold text-primary sticky left-0 bg-card z-10">🐻 {homeTeam}</td>
              {INNINGS.map(i => {
                const entry = getEntry(i, 'bottom');
                const isEditing = editCell?.inning === i && editCell?.half === 'bottom';
                const confirmed = entry && userId && (entry.confirmed_by as string[])?.includes(userId);
                const confirmCount = entry ? (entry.confirmed_by as string[])?.length ?? 0 : 0;
                return (
                  <td key={i} className="px-1 py-1 text-center relative">
                    {isEditing ? (
                      <div className="flex items-center gap-0.5">
                        <input
                          type="number"
                          min={0}
                          max={99}
                          className="w-7 h-7 text-center text-xs rounded border border-primary bg-background focus:outline-none"
                          value={editVal}
                          onChange={e => setEditVal(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSave()}
                          autoFocus
                        />
                        <button onClick={handleSave} className="text-primary"><Check className="h-3 w-3" /></button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditCell({ inning: i, half: 'bottom' }); setEditVal(entry ? String(entry.runs) : '0'); }}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                          entry
                            ? confirmCount >= Math.max(2, Math.ceil(memberCount * 0.5))
                              ? 'bg-accent/15 text-accent font-bold'
                              : 'bg-muted text-foreground font-semibold'
                            : 'bg-transparent text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {entry ? entry.runs : <Plus className="h-3 w-3" />}
                      </button>
                    )}
                    {entry && !confirmed && userId && (
                      <button onClick={() => onConfirm(entry.id)} className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-primary/20 flex items-center justify-center" title="Confirm this score">
                        <Check className="h-2 w-2 text-primary" />
                      </button>
                    )}
                  </td>
                );
              })}
              <td className="px-2 py-2.5 text-center font-bold text-foreground bg-primary/5">{totalRuns('bottom')}</td>
              <td className="px-2 py-2.5 text-center text-muted-foreground bg-primary/5">{totalHits('bottom')}</td>
              <td className="px-2 py-2.5 text-center text-muted-foreground bg-primary/5">{totalErrors('bottom')}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="px-3 py-2 flex items-center gap-2 text-[10px] text-muted-foreground border-t border-border bg-muted/30">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-accent" /> Confirmed</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-muted" /> Unconfirmed</span>
        <span className="ml-auto">Tap any cell to update</span>
      </div>
    </div>
  );
}
