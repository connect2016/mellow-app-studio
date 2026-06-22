import { Beer, Building2, CheckCircle2, Users, UtensilsCrossed, Pizza } from 'lucide-react';
import { HotDogIcon } from '@/components/icons/CustomIcons';
import { StatPreference, StatKey, DEFAULT_STAT_PREFS, StatVisibility } from '@/hooks/useStatPreferences';

export interface CardStats {
  beersToday?: number;
  beersThisWeek?: number;
  barsVisitedToday?: number;
  barsVisitedThisWeek?: number;
  meetupsFinished?: number;
  fansConnected?: number;
  shotsTakenSeason?: number;
  appetizersHadSeason?: number;
  favoriteFoodSpot?: string;
}

export interface VisibleStat {
  key: StatKey;
  icon: React.ElementType;
  value: number | string;
  label: string;
  timeRange: string;
  visibility: StatVisibility;
}

export const STAT_ICONS: Record<StatKey, React.ElementType> = {
  beersToday: Beer,
  beersThisWeek: Beer,
  barsVisitedToday: Building2,
  barsVisitedThisWeek: Building2,
  meetupsFinished: CheckCircle2,
  fansConnected: Users,
  shotsTakenSeason: HotDogIcon,
  appetizersHadSeason: UtensilsCrossed,
  favoriteFoodSpot: Pizza,
};

export const CARD_STAT_LABELS: Record<StatKey, string> = {
  beersToday: 'Beers Today',
  beersThisWeek: 'Beers This Week',
  barsVisitedToday: 'Bars Today',
  barsVisitedThisWeek: 'Bars This Week',
  meetupsFinished: 'Meetups Done',
  fansConnected: 'Fans Connected',
  shotsTakenSeason: 'Ballpark Dogs Devoured',
  appetizersHadSeason: 'Appetizers (Season)',
  favoriteFoodSpot: 'Favorite Food Spot',
};

export function canViewStat(visibility: StatVisibility, isOwner: boolean, isMatch: boolean): boolean {
  if (isOwner) return true;
  if (visibility === 'everyone') return true;
  if (visibility === 'matches_only' && isMatch) return true;
  return false;
}

function safeNumber(v: unknown): number {
  if (v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

export function getVisibleStats({
  stats,
  statPreferences,
  isOwner,
  isMatch = false,
}: {
  stats?: CardStats;
  statPreferences?: StatPreference[];
  isOwner: boolean;
  isMatch?: boolean;
}): VisibleStat[] {
  const cardStats: CardStats = stats || {
    beersToday: 0,
    beersThisWeek: 0,
    barsVisitedToday: 0,
    barsVisitedThisWeek: 0,
    meetupsFinished: 0,
    fansConnected: 0,
    shotsTakenSeason: 0,
    appetizersHadSeason: 0,
    favoriteFoodSpot: '',
  };

  const prefs = statPreferences ?? DEFAULT_STAT_PREFS;

  return prefs
    .filter(p => p.enabled && canViewStat(p.visibility, isOwner, isMatch))
    .filter(p => {
      // Hide Favorite Food Spot tile if user hasn't set one
      if (p.stat_key === 'favoriteFoodSpot') {
        return !!cardStats.favoriteFoodSpot;
      }
      return true;
    })
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(p => ({
      key: p.stat_key,
      icon: STAT_ICONS[p.stat_key],
      value: p.stat_key === 'favoriteFoodSpot'
        ? (cardStats.favoriteFoodSpot ?? '')
        : safeNumber(cardStats[p.stat_key]),
      label: CARD_STAT_LABELS[p.stat_key],
      timeRange: p.time_range,
      visibility: p.visibility,
    }));
}
