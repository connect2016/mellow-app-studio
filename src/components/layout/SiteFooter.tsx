import { Link } from 'react-router-dom';

export function SiteFooter() {
  return (
    <footer className="relative z-20 border-t border-white/10 bg-background/80 backdrop-blur-sm py-4 px-4 text-center text-xs text-muted-foreground">
      <nav className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <Link to="/privacy" className="hover:text-foreground underline-offset-2 hover:underline">
          Privacy Policy
        </Link>
        <span aria-hidden>·</span>
        <Link to="/terms" className="hover:text-foreground underline-offset-2 hover:underline">
          Terms of Service
        </Link>
        <span aria-hidden>·</span>
        <span>© 2026 Cubbies Buddies</span>
      </nav>
    </footer>
  );
}
