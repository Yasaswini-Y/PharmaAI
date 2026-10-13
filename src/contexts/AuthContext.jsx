import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  isGuest: false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  signInAsGuest: () => {},
});

const GUEST_STORAGE_KEY = 'modernize_auth_guest';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    /* Check for guest session first */
    try {
      const savedGuest = localStorage.getItem(GUEST_STORAGE_KEY);
      if (savedGuest) {
        const guestData = JSON.parse(savedGuest);
        setUser(guestData);
        setIsGuest(true);
        setLoading(false);
        return;
      }
    } catch {
      // LocalStorage error fallback
    }

    /* Supabase session check */
    let isSubscribed = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!isSubscribed) return;
        const currentSession = data?.session || null;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (!isSubscribed) return;
        setLoading(false);
      });

    /* Listen for auth state changes */
    const authState = supabase.auth.onAuthStateChange?.((_event, currentSession) => {
      if (!isSubscribed) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        setIsGuest(false);
        try {
          localStorage.removeItem(GUEST_STORAGE_KEY);
        } catch {
          // ignore
        }
      }
      setLoading(false);
    });

    const subscription = authState?.data?.subscription;

    return () => {
      isSubscribed = false;
      subscription?.unsubscribe?.();
    };
  }, []);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    try {
      localStorage.removeItem(GUEST_STORAGE_KEY);
    } catch {
      // ignore
    }
    setIsGuest(false);
    return data;
  };

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    try {
      localStorage.removeItem(GUEST_STORAGE_KEY);
    } catch {
      // ignore
    }
    setIsGuest(false);
    return data;
  };

  const signInAsGuest = (email = 'enterprise.architect@modernize.ai') => {
    const guestUser = {
      id: 'guest-architect-01',
      email,
      user_metadata: { full_name: 'Lead Cloud Architect', role: 'Enterprise Migration Lead' },
      app_metadata: { provider: 'demo' },
    };
    setUser(guestUser);
    setIsGuest(true);
    setLoading(false);
    try {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guestUser));
    } catch {
      // ignore
    }
    return guestUser;
  };

  const signOut = async () => {
    try {
      localStorage.removeItem(GUEST_STORAGE_KEY);
    } catch {
      // ignore
    }
    setIsGuest(false);
    setUser(null);
    setSession(null);
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore signOut error on mock
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isGuest, signIn, signUp, signOut, signInAsGuest }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
