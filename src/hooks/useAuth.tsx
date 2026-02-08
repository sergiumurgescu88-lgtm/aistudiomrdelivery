import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';

import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  profile_photo: string | null;
  credits: number;
  free_credits: number;
  purchased_credits: number;
  daily_usage: number;
  last_usage_date: string;
  account_tier: 'FREE' | 'PREMIUM';
  account_status: 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED';
  preferred_currency: string;
  is_email_verified: boolean;
  total_generations: number;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  session: Session | null;
  user: SupabaseUser | null;
  profile: Profile | null;
  roles: string[];
  isLoading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!error && data) {
      setProfile(data as Profile);
    }
  }, []);

  const fetchRoles = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (!error && data) {
      setRoles(data.map(r => r.role));
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await Promise.all([fetchProfile(user.id), fetchRoles(user.id)]);
    }
  }, [user?.id, fetchProfile, fetchRoles]);

  useEffect(() => {
    // Set up auth state listener BEFORE getting session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // Use setTimeout to avoid potential deadlocks with Supabase
          setTimeout(async () => {
            await Promise.all([
              fetchProfile(newSession.user.id),
              fetchRoles(newSession.user.id),
            ]);
            setIsLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
          setIsLoading(false);
        }
      }
    );

    // Then get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.user) {
        Promise.all([
          fetchProfile(initialSession.user.id),
          fetchRoles(initialSession.user.id),
        ]).then(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile, fetchRoles]);

  const signInWithGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      throw result.error;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setRoles([]);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user?.id) return;
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id);

    if (!error) {
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const isAdmin = roles.includes('admin');

  return (
    <AuthContext.Provider value={{
      session, user, profile, roles, isLoading, isAdmin,
      signInWithGoogle, signOut, refreshProfile, updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
