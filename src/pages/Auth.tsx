import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
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
  const [pendingProvider, setPendingProvider] = useState<'google' | 'email' | null>(null);
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
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

  const handleEmailAuth = async () => {
    if (!email.trim() || password.length < 6) {
      toast.error('Enter a valid email and a password (6+ characters).');
      return;
    }
    setPendingProvider('email');

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password });
      setPendingProvider(null);
      if (error) {
        toast.error(error.message);
        console.error('Email sign-up error:', error);
        return;
      }
      toast.success('Account created! Check your email to verify.');
      track('user_signed_up', { method: 'email' });
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setPendingProvider(null);
    if (error) {
      const message = /invalid login credentials/i.test(error.message)
        ? 'Incorrect email or password.'
        : /email not confirmed/i.test(error.message)
        ? 'Please verify your email before signing in — check your inbox.'
        : "Couldn't sign in — please try again.";
      toast.error(message);
      console.error('Email sign-in error:', error);
    }
  };

  return (
    <div className="relative isolate flex min-h-screen items-center justify-center px-6">
      <div
        aria-hidden
        className="fixed inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: "url('/auth-bg.webp')" }}
      />
      <div aria-hidden className="fixed inset-0 -z-10 bg-black/55" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <img src={logo} alt="Wrigleyville Buddies" className="mx-auto mb-4 h-28" loading="lazy" decoding="async" />
          <h1
            className="mb-2 text-3xl font-bold tracking-tight text-white drop-shadow-md"
          >
            Get in the Game
          </h1>
        </div>

        <div className="rounded-2xl border border-white/10 bg-background/70 p-6 shadow-lg backdrop-blur-md">
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
        </div>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="mb-4 flex rounded-xl bg-muted p-1">
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
              mode === 'signup' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
            }`}
          >
            Create account
          </button>
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
              mode === 'signin' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
            }`}
          >
            Sign in
          </button>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9 rounded-xl h-12"
              autoComplete="email"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type={showPw ? 'text' : 'password'}
              placeholder={mode === 'signup' ? '6+ characters' : 'Password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9 pr-9 rounded-xl h-12"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
            </button>
          </div>

          <Button
            onClick={handleEmailAuth}
            disabled={!!pendingProvider}
            className="w-full h-12 rounded-xl text-base font-semibold"
          >
            {pendingProvider === 'email'
              ? mode === 'signup'
                ? 'Creating account…'
                : 'Signing in…'
              : mode === 'signup'
              ? 'Create Account'
              : 'Sign In'}
          </Button>
        </div>
        </div>

        <p className="mt-6 text-center text-white/70" style={{ fontSize: '11px' }}>
          By continuing, you agree to our{' '}
          <a href="/terms" className="underline hover:no-underline">Terms of Service</a>
          {' '}and{' '}
          <a href="/privacy" className="underline hover:no-underline">Privacy Policy</a>.
        </p>
      </motion.div>
    </div>
  );
}
