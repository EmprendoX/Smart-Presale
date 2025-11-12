"use client";

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Provider as OAuthProvider, Session } from '@supabase/supabase-js';
import {
  AppUser,
  getSupabaseBrowserClient,
  mapSupabaseUser,
  signInWithOAuth as supabaseSignInWithOAuth,
  signInWithOtp as supabaseSignInWithOtp,
  signOut as supabaseSignOut
} from '@/lib/auth/supabase';

type AuthContextValue = {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  signInWithOtp: (email: string, options?: { redirectTo?: string; shouldCreateUser?: boolean }) => Promise<void>;
  signInWithOAuth: (
    provider: OAuthProvider,
    options?: {
      redirectTo?: string;
      scopes?: string;
    }
  ) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const client = getSupabaseBrowserClient();

  useEffect(() => {
    let isMounted = true;
    let loadingTimeoutRef: NodeJS.Timeout | null = null;

    // Timeout de seguridad: si después de 5 segundos aún está cargando, forzar a false
    loadingTimeoutRef = setTimeout(() => {
      if (isMounted) {
        console.warn('[AuthProvider] Loading timeout reached, forcing loading to false');
        setLoading(false);
      }
    }, 5000);

    const loadSession = async () => {
      try {
        console.log('[AuthProvider] Loading session...');
        const [{ data, error }, userResult] = await Promise.all([
          client.auth.getSession(),
          client.auth.getUser()
        ]);

        if (!isMounted) return;

        if (error) {
          console.error('[AuthProvider] Error fetching session:', error.message);
          setSession(null);
          setUser(null);
        } else {
          const hasSession = !!data.session;
          console.log('[AuthProvider] Session loaded:', { hasSession, userId: data.session?.user?.id });
          
          setSession(data.session ?? null);
          
          if (userResult.error) {
            console.error('[AuthProvider] Error fetching user:', userResult.error.message);
            setUser(mapSupabaseUser(data.session?.user ?? null));
          } else {
            setUser(mapSupabaseUser(userResult.data.user ?? null));
          }
        }
      } catch (error) {
        console.error('[AuthProvider] Unexpected session error:', error);
        if (!isMounted) return;
        setSession(null);
        setUser(null);
      } finally {
        // SIEMPRE poner loading en false, sin importar qué pase
        if (isMounted) {
          console.log('[AuthProvider] Setting loading to false');
          setLoading(false);
          // Limpiar timeout si la carga terminó exitosamente
          if (loadingTimeoutRef) {
            clearTimeout(loadingTimeoutRef);
            loadingTimeoutRef = null;
          }
        }
      }
    };

    loadSession();

    const {
      data: { subscription }
    } = client.auth.onAuthStateChange(async (event, nextSession) => {
      if (!isMounted) return;
      
      console.log('[AuthProvider] Auth state changed:', event, {
        hasSession: !!nextSession,
        userId: nextSession?.user?.id
      });

      setSession(nextSession ?? null);
      
      // Obtener usuario completo para asegurar que tenemos los datos más recientes
      if (nextSession) {
        try {
          const { data: userData, error: userError } = await client.auth.getUser();
          if (!userError && userData?.user) {
            setUser(mapSupabaseUser(userData.user));
          } else {
            setUser(mapSupabaseUser(nextSession.user));
          }
        } catch (error) {
          console.error('[AuthProvider] Error fetching user on auth change:', error);
          setUser(mapSupabaseUser(nextSession.user));
        }
      } else {
        setUser(null);
      }
      
      // SIEMPRE poner loading en false cuando cambia el estado de auth
      setLoading(false);
    });

    // Cleanup: desmontar y limpiar recursos
    return () => {
      isMounted = false;
      if (loadingTimeoutRef) {
        clearTimeout(loadingTimeoutRef);
      }
      subscription.unsubscribe();
    };
  }, [client]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      signInWithOtp: async (email, options) => {
        await supabaseSignInWithOtp(email, options);
      },
      signInWithOAuth: async (provider, options) => {
        await supabaseSignInWithOAuth(provider, options);
      },
      signOut: async () => {
        await supabaseSignOut();
        setUser(null);
        setSession(null);
      },
      refreshSession: async () => {
        const [{ data, error }, userResult] = await Promise.all([
          client.auth.getSession(),
          client.auth.getUser()
        ]);

        if (error) {
          console.error('[AuthProvider] Error refreshing session:', error.message);
          return;
        }

        setSession(data.session ?? null);
        if (userResult.error) {
          console.error('[AuthProvider] Error refreshing user:', userResult.error.message);
          setUser(mapSupabaseUser(data.session?.user ?? null));
        } else {
          setUser(mapSupabaseUser(userResult.data.user ?? null));
        }
      }
    }),
    [client, loading, session, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
