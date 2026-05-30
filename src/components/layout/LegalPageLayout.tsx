import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { SEOMeta } from '@/components/SEOMeta';

interface LegalPageLayoutProps {
  title: string;
  updated: string;
  seoTitle: string;
  seoDescription: string;
  children: ReactNode;
}

export function LegalPageLayout({ title, updated, seoTitle, seoDescription, children }: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOMeta title={seoTitle} description={seoDescription} />
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-base font-extrabold text-foreground">Wrigleyville Buddies</Link>
          <nav className="flex gap-4 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {updated}</p>
        <div className="prose prose-sm mt-8 max-w-none text-foreground/90 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_p]:mt-3 [&_p]:leading-relaxed [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mt-1 [&_a]:text-primary [&_a]:underline">
          {children}
        </div>
      </main>

      <footer className="border-t bg-card py-8 text-center text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-3 px-6">
          <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
          <span aria-hidden>·</span>
          <Link to="/terms" className="hover:text-foreground">Terms of Service</Link>
          <span aria-hidden>·</span>
          <span>© {new Date().getFullYear()} Wrigleyville Buddies</span>
        </div>
      </footer>
    </div>
  );
}
