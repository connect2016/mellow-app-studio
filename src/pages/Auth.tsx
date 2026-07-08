import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { lovable } from '@/integrations/lovable/index';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import logo from '@/assets/logo.webp';
import { track } from '@/lib/analytics';
import { toast } from 'sonner';

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const { data: profile } = useProfile();
  const [pendingProvider, setPendingProvider] = useState<'google' | 'apple' | null>(null);
  const from = (location.state as { from?: string } | null)?.from;

  useEffect(() => {
    if (!loading && user) {
      const incomplete =
        !profile?.onboarding_completed ||
        !profile?.display_name?.trim() ||
        !profile?.profile_photo?.trim();
      if (incomplete) {
        navigate('/onboarding', { replace: true });
      } else if (from && from !== '/auth') {
        navigate(from, { replace: true });
      } else {
        navigate('/discover', { replace: true });
      }
    }
  }, [user, loading, profile, navigate, from]);

  const handleGoogleSignIn = async () => {
    setPendingProvider('google');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    setPendingProvider(null);

    if (error) {
      const isPopupOrNetwork = /popup|blocked|network|connection|failed to fetch|timeout/i.test(
        error.message || ''
      );
      const suffix = isPopupOrNetwork
        ? ' Check your connection or try the other sign-in option.'
        : '';
      toast.error(`Couldn't sign in with Google — please try again.${suffix}`);
      console.error('Google sign-in error:', error);
      return;
    }

    track('user_signed_up', { method: 'google' });
  };

  const handleAppleSignIn = async () => {
    setPendingProvider('apple');
    const result = await lovable.auth.signInWithOAuth('apple', {
      redirect_uri: window.location.origin,
    });
    setPendingProvider(null);

    if (result.error) {
      const isPopupOrNetwork = /popup|blocked|network|connection|failed to fetch|timeout/i.test(
        result.error.message || ''
      );
      const suffix = isPopupOrNetwork
        ? ' Check your connection or try the other sign-in option.'
        : '';
      toast.error(`Couldn't sign in with Apple — please try again.${suffix}`);
      console.error('Apple sign-in error:', result.error);
      return;
    }

    if (result.redirected) {
      return;
    }

    track('user_signed_up', { method: 'apple' });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <img src={logo} alt="Wrigleyville Buddies" className="mx-auto mb-4 h-28" loading="lazy" decoding="async" />
          <h1
            className="mb-2 text-3xl font-bold tracking-tight"
          >
            Get in the Game
          </h1>
        </div>

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-center gap-3 h-12 rounded-[10px] border-[1.5px] border-[hsl(var(--border))] bg-white text-[14px] font-medium text-[hsl(var(--foreground))] hover:bg-white disabled:opacity-60"
            onClick={handleGoogleSignIn}
            disabled={!!pendingProvider}
          >
            {pendingProvider === 'google' ? (
              <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            {pendingProvider === 'google' ? 'Signing in…' : 'Continue with Google'}
          </Button>
            {false && (
          <Button
            variant="outline"
            className="w-full justify-center gap-3 h-12 rounded-[10px] border-[1.5px] border-[hsl(var(--border))] bg-white text-[14px] font-medium text-[hsl(var(--foreground))] hover:bg-white disabled:opacity-60"
            onClick={handleAppleSignIn}
            disabled={!!pendingProvider}
          >
            {pendingProvider === 'apple' ? (
              <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#000">
                <path d="M17.05 12.04c-.03-3.02 2.47-4.47 2.58-4.54-1.41-2.06-3.6-2.34-4.38-2.37-1.86-.19-3.64 1.1-4.59 1.1-.95 0-2.41-1.08-3.97-1.05-2.04.03-3.93 1.19-4.97 3.02-2.13 3.69-.54 9.15 1.52 12.15 1.01 1.47 2.21 3.12 3.78 3.06 1.52-.06 2.1-.98 3.94-.98 1.84 0 2.36.98 3.97.95 1.64-.03 2.68-1.5 3.68-2.97 1.16-1.7 1.64-3.35 1.67-3.44-.04-.02-3.21-1.23-3.23-4.89zM14.04 3.36c.84-1.02 1.41-2.44 1.25-3.85-1.21.05-2.68.81-3.55 1.83-.78.9-1.46 2.34-1.28 3.72 1.35.1 2.73-.69 3.58-1.7z" />
              </svg>
            )}
            {pendingProvider === 'apple' ? 'Signing in…' : 'Continue with Apple'}
          </Button>
            )}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Free to join · No password needed
        </p>

        <p className="mt-6 text-center" style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>
          By continuing, you agree to our{' '}
          <a href="/terms" className="underline hover:no-underline">Terms of Service</a>
          {' '}and{' '}
          <a href="/privacy" className="underline hover:no-underline">Privacy Policy</a>.
        </p>
      </motion.div>
    </div>
  );
}
