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
      className="flex"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 1000,
        backgroundColor: '#0E3386',
        borderTop: 'none',
        boxShadow: '0 -1px 0 rgba(0,0,0,0.15)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 0px)',
      }}
    >
      {TABS.map(({ to, label, icon: Icon, showBadge, showProgress }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'relative flex-1 min-h-[56px] flex flex-col items-center justify-center gap-0.5',
              isActive ? 'font-semibold' : 'font-medium',
            )
          }
          style={({ isActive }) => ({
            color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.55)',
          })}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 20,
                    height: 3,
                    background: '#FFFFFF',
                    borderRadius: '0 0 3px 3px',
                  }}
                />
              )}
              <span className="relative inline-flex items-center justify-center">
                <Icon
                  className="h-5 w-5"
                  aria-hidden="true"
                  style={{
                    color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.55)',
                    stroke: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.55)',
                  }}
                />
                {showBadge && count > 0 && (
                  <span
                    aria-label={`${count} fans nearby`}
                    className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center tabular-nums"
                    style={{ backgroundColor: '#FFFFFF', color: '#0E3386' }}
                  >
                    {count > 99 ? '99+' : count}
                  </span>
                )}
                {showProgress && <ProfileCompletionRing percent={percent} />}
              </span>
              <span
                className="text-[11px]"
                style={{
                  color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.55)',
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export default BottomNav;
