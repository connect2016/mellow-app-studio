import { useState, useEffect } from 'react';
import { useStatPreferences, StatPreference, StatKey, TimeRange, StatVisibility, STAT_LABELS } from '@/hooks/useStatPreferences';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GripVertical, Save, Beer, Building2, CheckCircle2, Users, Wine, UtensilsCrossed, Pizza } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

const STAT_ICONS: Record<StatKey, React.ElementType> = {
  beersToday: Beer,
  beersThisWeek: Beer,
  barsVisitedToday: Building2,
  barsVisitedThisWeek: Building2,
  meetupsFinished: CheckCircle2,
  fansConnected: Users,
  shotsTakenSeason: Wine,
  appetizersHadSeason: UtensilsCrossed,
  favoriteFoodSpot: Pizza,
};

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  today: 'Today',
  this_week: 'This Week',
  all_time: 'All Time',
};

const VISIBILITY_LABELS: Record<StatVisibility, string> = {
  everyone: ' Everyone',
  matches_only: ' Matches Only',
  hidden: ' Hidden',
};

export function StatsCustomizer() {
  const { preferences, savePreferences, isSaving } = useStatPreferences();
  const [localPrefs, setLocalPrefs] = useState<StatPreference[]>(preferences);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  const updatePref = (idx: number, updates: Partial<StatPreference>) => {
    setLocalPrefs(prev => prev.map((p, i) => i === idx ? { ...p, ...updates } : p));
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    setLocalPrefs(prev => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(idx, 0, moved);
      return next;
    });
    setDragIdx(idx);
  };
  const handleDragEnd = () => setDragIdx(null);

  const handleSave = async () => {
    try {
      await savePreferences(localPrefs);
      toast({ title: ' Stats preferences saved!' });
    } catch {
      toast({ title: 'Error saving preferences', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-5" role="region" aria-label="Stats customization">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-foreground">Customize Card Stats</h3>
        <Button
          size="default"
          onClick={handleSave}
          disabled={isSaving}
          className="gap-2 rounded-2xl min-h-[48px] px-5 font-semibold active:scale-[0.97] transition-all"
          aria-label="Save stats preferences"
        >
          <Save className="h-5 w-5" />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      <div className="space-y-3">
        {localPrefs.map((pref, idx) => {
          const Icon = STAT_ICONS[pref.stat_key];
          return (
            <div
              key={pref.stat_key}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              role="listitem"
              aria-label={`${STAT_LABELS[pref.stat_key]} stat settings`}
              className={cn(
                'flex items-center gap-4 rounded-2xl border border-border/50 bg-card p-4 shadow-sm transition-all',
                dragIdx === idx && 'opacity-50 scale-95'
              )}
            >
              <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab flex-shrink-0" aria-hidden="true" />
              <Icon className="h-5 w-5 text-primary/70 flex-shrink-0" aria-hidden="true" />

              <div className="flex-1 min-w-0">
                <p className="text-base font-medium text-foreground truncate">{STAT_LABELS[pref.stat_key]}</p>
                <div className="flex flex-wrap gap-2.5 mt-2">
                  <Select
                    value={pref.time_range}
                    onValueChange={(v) => updatePref(idx, { time_range: v as TimeRange })}
                  >
                    <SelectTrigger className="h-9 w-[120px] text-sm rounded-xl" aria-label="Time range">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TIME_RANGE_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k} className="text-sm min-h-[44px]">{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={pref.visibility}
                    onValueChange={(v) => updatePref(idx, { visibility: v as StatVisibility })}
                  >
                    <SelectTrigger className="h-9 w-[155px] text-sm rounded-xl" aria-label="Visibility">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(VISIBILITY_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k} className="text-sm min-h-[44px]">{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Switch
                checked={pref.enabled}
                onCheckedChange={(c) => updatePref(idx, { enabled: c })}
                className="flex-shrink-0"
                aria-label={`Toggle ${STAT_LABELS[pref.stat_key]}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
