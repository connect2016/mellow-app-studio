import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { lovable } from '@/integrations/lovable/index';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import logo from '@/assets/logo.webp';
import { track } from '@/lib/analytics';
import { toast } from 'sonner';

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: profile } = useProfile();

  useEffect(() => {
    if (!loading && user) {
      const incomplete =
        !profile?.onboarding_completed ||
        !profile?.display_name?.trim() ||
        !profile?.profile_photo?.trim();
      if (incomplete) {
        navigate('/onboarding');
      } else {
        navigate('/discover');
      }
    }
  }, [user, loading, profile, navigate]);

  const handleGoogleSignIn = async () => {
    track('user_signed_up', { method: 'google' });
    const { error } = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if (error) {
      console.error('Google sign-in error:', error);
    }
  };

  const handleAppleSignIn = async () => {
    track('user_signed_up', { method: 'apple' });
    const { error } = await lovable.auth.signInWithOAuth('apple', {
      redirect_uri: window.location.origin,
    });
    if (error) {
      console.error('Apple sign-in error:', error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <img src={logo} alt="Wrigleyville Buddies" className="mx-auto mb-4 h-28" />
          <h1
            className="mb-2 text-3xl font-bold tracking-tight"
          >
            Get in the Game
          </h1>
        </div>

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-center gap-3 h-12 rounded-[10px] border-[1.5px] border-[#e2e6ee] bg-white text-[14px] font-medium text-[#1a1f2e] hover:bg-white"
            onClick={handleGoogleSignIn}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </Button>
          <Button
            variant="outline"
            className="w-full justify-center gap-3 h-12 rounded-[10px] border-[1.5px] border-[#e2e6ee] bg-white text-[14px] font-medium text-[#1a1f2e] hover:bg-white"
            onClick={handleAppleSignIn}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#000">
              <path d="M17.05 12.04c-.03-3.02 2.47-4.47 2.58-4.54-1.41-2.06-3.6-2.34-4.38-2.37-1.86-.19-3.64 1.1-4.59 1.1-.95 0-2.41-1.08-3.97-1.05-2.04.03-3.93 1.19-4.97 3.02-2.13 3.69-.54 9.15 1.52 12.15 1.01 1.47 2.21 3.12 3.78 3.06 1.52-.06 2.1-.98 3.94-.98 1.84 0 2.36.98 3.97.95 1.64-.03 2.68-1.5 3.68-2.97 1.16-1.7 1.64-3.35 1.67-3.44-.04-.02-3.21-1.23-3.23-4.89zM14.04 3.36c.84-1.02 1.41-2.44 1.25-3.85-1.21.05-2.68.81-3.55 1.83-.78.9-1.46 2.34-1.28 3.72 1.35.1 2.73-.69 3.58-1.7z" />
            </svg>
            Continue with Apple
          </Button>
          <Button
            variant="outline"
            className="w-full justify-center gap-3 h-12 rounded-[10px] border-none text-[14px] font-semibold text-white hover:opacity-90"
            style={{ background: '#5865F2' }}
            onClick={() => toast('Discord sign-in coming soon')}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3a.07.07 0 0 0-.074.035c-.16.285-.338.656-.463.948a18.27 18.27 0 0 0-5.487 0 12.62 12.62 0 0 0-.47-.948.073.073 0 0 0-.074-.035 19.74 19.74 0 0 0-3.76 1.369.066.066 0 0 0-.03.027C2.527 8.046 1.78 11.62 2.146 15.148a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.073.073 0 0 0 .08-.027c.462-.63.873-1.295 1.226-1.994a.072.072 0 0 0-.04-.1 13.1 13.1 0 0 1-1.873-.892.073.073 0 0 1-.007-.121c.126-.094.252-.192.372-.291a.07.07 0 0 1 .073-.01c3.927 1.793 8.18 1.793 12.061 0a.07.07 0 0 1 .074.009c.12.099.246.198.373.292a.073.073 0 0 1-.006.121c-.598.349-1.22.645-1.873.891a.072.072 0 0 0-.04.101c.36.699.772 1.364 1.225 1.993a.072.072 0 0 0 .08.028 19.84 19.84 0 0 0 6.002-3.03.073.073 0 0 0 .031-.055c.5-4.21-.838-7.755-3.548-10.752a.058.058 0 0 0-.03-.028zM8.02 12.94c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.094 2.157 2.418 0 1.334-.955 2.419-2.157 2.419zm7.974 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.094 2.157 2.418 0 1.334-.946 2.419-2.157 2.419z" />
            </svg>
            Continue with Discord
          </Button>
          <Button
            variant="outline"
            className="w-full justify-center gap-3 h-12 rounded-[10px] border-none text-[14px] font-semibold text-white hover:opacity-90"
            style={{ background: '#1DB954' }}
            onClick={() => toast('Spotify sign-in coming soon')}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12C24 5.4 18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.301.421-1.02.601-1.56.3z" />
            </svg>
            Continue with Spotify
          </Button>
        </div>

        <p className="mt-6 text-center" style={{ fontSize: '11px', color: '#6b7280' }}>
          By continuing, you agree to our{' '}
          <a href="/terms" className="underline hover:no-underline">Terms of Service</a>
          {' '}and{' '}
          <a href="/privacy" className="underline hover:no-underline">Privacy Policy</a>.
        </p>
      </motion.div>
    </div>
  );
}
