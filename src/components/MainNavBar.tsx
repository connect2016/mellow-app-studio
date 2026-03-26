import { Link, useLocation } from 'react-router-dom';
import { Search, Beer, Landmark, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/discover', icon: Search, label: 'Find Buddies' },
  { to: '/pregame', icon: Beer, label: 'The Pregame' },
  { to: '/in-the-confines', icon: Landmark, label: 'In the Confines' },
  { to: '/post-game', icon: Trophy, label: 'Post-Game' },
];

export function MainNavBar() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg safe-area-pb">
      <div className="mx-auto flex max-w-lg items-center justify-around py-1.5 px-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to || location.pathname.startsWith(to + '/');
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'relative flex flex-col items-center gap-0.5 px-2 py-1.5 text-[10px] transition-colors rounded-xl min-w-[60px]',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'stroke-[2.5]')} />
              <span className={cn('font-medium leading-tight text-center', active && 'font-semibold')}>{label}</span>
              {active && (
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
