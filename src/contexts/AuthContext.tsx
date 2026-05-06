import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { identify, resetAnalytics, track } from '@/lib/analytics';
import { consumeInviteRefIfPresent } from '@/lib/invite-ref';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const identifiedRef = useRef<string | null>(null);

  const handleIdentify = async (u: User | null) => {
    if (!u) return;
    if (identifiedRef.current === u.id) return;
    identifiedRef.current = u.id;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed, fan_type')
        .eq('user_id', u.id)
        .maybeSingle();
      identify(u.id, {
        has_completed_onboarding: !!(profile as any)?.onboarding_completed,
        fan_type: (profile as any)?.fan_type ?? null,
      });
    } catch {
      identify(u.id);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        if (event === 'SIGNED_IN') {
          track('user_signed_in', { method: (session.user.app_metadata?.provider as string) || 'unknown' });
          // Defer to avoid blocking auth state callback
          setTimeout(() => {
            consumeInviteRefIfPresent(session.user.id).then((res) => {
              if (res.consumed) track('invite_ref_consumed', { ref: res.ref });
            });
          }, 0);
        }
        handleIdentify(session.user);
      } else if (event === 'SIGNED_OUT') {
        identifiedRef.current = null;
        resetAnalytics();
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) handleIdentify(session.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    track('user_signed_out');
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
