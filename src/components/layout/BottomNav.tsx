import { NavLink } from 'react-router-dom';
import { Compass, Map, CalendarDays, User, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFanMapPins } from '@/hooks/useFanMapPins';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { ProfileCompletionRing } from './ProfileCompletionRing';

type Tab = { to: string; label: string; icon: LucideIcon; showBadge?: boolean; showProgress?: boolean };

const TABS: Tab[] = [
  { to: '/discover-fans', label: 'Discover', icon: Compass },
  { to: '/bar-map', label: 'Map', icon: Map, showBadge: true },
  { to: '/meetups', label: 'Meetups', icon: CalendarDays },
  { to: '/profile', label: 'Profile', icon: User, showProgress: true },
];

export function BottomNav() {
  const { count } = useFanMapPins();
  const { percent } = useProfileCompletion();

  return (
    <nav
      aria-label="Primary"
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-white dark:bg-neutral-900',
        'border-t border-neutral-200 dark:border-neutral-800',
        'flex',
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TABS.map(({ to, label, icon: Icon, showBadge, showProgress }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex-1 min-h-[48px] flex flex-col items-center justify-center gap-0.5',
              isActive ? 'text-brand-blue' : 'text-neutral-400',
            )
          }
        >
          <span className="relative inline-flex items-center justify-center">
            <Icon className="h-5 w-5" aria-hidden="true" />
            {showBadge && count > 0 && (
              <span
                aria-label={`${count} fans nearby`}
                className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#0E3386] text-white text-[10px] font-bold flex items-center justify-center tabular-nums"
              >
                {count > 99 ? '99+' : count}
              </span>
            )}
            {showProgress && <ProfileCompletionRing percent={percent} />}
          </span>
          <span className="text-[11px] font-medium">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default BottomNav;
