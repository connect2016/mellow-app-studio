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
        <span>© 2026 Wrigleyville Buddies</span>
      </nav>
      <p
        style={{
          fontSize: '10px',
          color: 'rgba(255,255,255,0.6)',
          textAlign: 'center',
          lineHeight: 1.5,
          maxWidth: '600px',
          margin: '8px auto 0',
          padding: '0 16px',
        }}
      >
        Wrigleyville Buddies is an independent fan-made app. It is not affiliated with,
        endorsed by, sponsored by, or associated with Major League Baseball, the
        Chicago Cubs, or any of their affiliates or subsidiaries. All team names
        and related marks are the property of their respective owners.
      </p>
    </footer>
  );
}
