import { Link, useLocation } from 'react-router-dom';
import { Home, Zap, MessageCircle, User, Calendar, Beer, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/discover', icon: Home, label: 'Discover' },
  { to: '/game-day', icon: Calendar, label: 'Game Day' },
  { to: '/hi-fives', icon: Zap, label: 'Hi-Fives' },
  { to: '/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export function AppHeader() {
  const location = useLocation();

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          <Link to="/discover" className="font-display text-xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
            Cubbies Buddies
          </Link>
          <Link to="/settings" className="rounded-full p-2 hover:bg-muted transition-colors">
            <Settings className="h-5 w-5 text-muted-foreground" />
          </Link>
        </div>
      </header>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-lg items-center justify-around py-1">
          {navItems.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs transition-colors rounded-lg',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className={cn('h-5 w-5', active && 'stroke-[2.5]')} />
                <span className="font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
