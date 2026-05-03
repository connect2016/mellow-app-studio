import { NavLink } from 'react-router-dom';
import { Users, Users2, MessageCircle, User, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = { to: string; label: string; icon: LucideIcon };

const TABS: Tab[] = [
  { to: '/buddies', label: 'Find Buddies', icon: Users },
  { to: '/groups', label: 'My Groups', icon: Users2 },
  { to: '/messages', label: 'Messages', icon: MessageCircle },
  { to: '/profile', label: 'Profile', icon: User },
];

export function BottomNav() {
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
      {TABS.map(({ to, label, icon: Icon }) => (
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
          <Icon className="h-5 w-5" aria-hidden="true" />
          <span className="text-[11px] font-medium">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default BottomNav;
