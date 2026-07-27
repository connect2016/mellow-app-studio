import { NavLink, useLocation } from 'react-router-dom';
import { Compass, Map, MessageCircle, type LucideIcon } from 'lucide-react';

const HIDE_NAV_ROUTES = ['/quick-start', '/onboarding', '/auth', '/login', '/signup'];
import { cn } from '@/lib/utils';
import { useUnreadCount } from '@/hooks/useMessages';
import { useAuth } from '@/contexts/AuthContext';
import { HomePlate } from '@/components/icons/HomePlate';

type Tab = {
  to: string;
  label: string;
  icon: LucideIcon;
  showBadge?: 'unread';
};

export function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const { data: unread = 0 } = useUnreadCount();

  const TABS: Tab[] = [
    { to: user ? '/game-day' : '/', label: 'Home', icon: HomePlate },
    { to: '/discover-fans', label: 'Find Fans', icon: Compass },
    { to: '/bar-map', label: 'Map', icon: Map },
    { to: '/messages', label: 'Messages', icon: MessageCircle, showBadge: 'unread' },
  ];

  if (HIDE_NAV_ROUTES.some((r) => location.pathname.startsWith(r))) {
    return null;
  }

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
        backgroundColor: 'hsl(var(--brand-navy))',
        borderTop: 'none',
        boxShadow: '0 -1px 0 rgba(0,0,0,0.15)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 0px)',
      }}
    >
      {TABS.map(({ to, label, icon: Icon, showBadge }) => {
        const badgeValue = showBadge === 'unread' ? unread : 0;
        const badgeColor = 'hsl(var(--brand-red))';
        const badgeText = '#FFFFFF';
        return (
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
                  {showBadge && badgeValue > 0 && (
                    <span
                      aria-label={`${badgeValue} unread messages`}
                      className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center tabular-nums"
                      style={{ backgroundColor: badgeColor, color: badgeText }}
                    >
                      {badgeValue > 99 ? '99+' : badgeValue}
                    </span>
                  )}
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
        );
      })}
    </nav>
  );
}

export default BottomNav;
