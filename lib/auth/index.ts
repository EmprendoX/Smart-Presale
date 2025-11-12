/**
 * Interfaz unificada de autenticación
 * Funciona tanto con Supabase como con modo JSON según la configuración
 */

import { isSupabaseEnabled, getSupabaseBrowserClient, createSupabaseServerClient, type AppUser, mapSupabaseUser } from './supabase';
import { getJsonAuthClient, mapJsonUser, getDemoUsers } from './json-auth';
import type { NextRequest, NextResponse } from 'next/server';
import type { Session, User, Provider } from '@supabase/supabase-js';

/**
 * Tipo para cliente de autenticación unificado
 */
export type AuthClient = {
  auth: {
    getSession: () => Promise<{ data: { session: Session | null }; error: any }>;
    getUser: () => Promise<{ data: { user: User | null }; error: any }>;
    signIn: (userId: string) => Promise<{ error: any }>;
    signOut: () => Promise<{ error: any }>;
    signInWithOtp: (options: { email: string; options?: { emailRedirectTo?: string; shouldCreateUser?: boolean } }) => Promise<{ error: any; data?: { autoAuthenticated?: boolean } }>;
    signInWithOAuth: (options: { provider: Provider; options?: { redirectTo?: string } }) => Promise<{ error: any }>;
    updateUser: (options: { data: Record<string, any> }) => Promise<{ error: any }>;
    onAuthStateChange: (callback: (event: string, session: Session | null) => void) => { data: { subscription: any }; unsubscribe: () => void };
  };
};

/**
 * Obtiene el cliente de autenticación apropiado según la configuración
 */
export function getAuthClient(): AuthClient {
  if (isSupabaseEnabled()) {
    const supabase = getSupabaseBrowserClient();
    return {
      auth: {
        getSession: () => supabase.auth.getSession(),
        getUser: () => supabase.auth.getUser(),
        signIn: async () => {
          throw new Error('signIn directo no disponible en modo Supabase. Use signInWithOtp o signInWithOAuth.');
        },
        signOut: () => supabase.auth.signOut(),
        signInWithOtp: async (options) => {
          const result = await supabase.auth.signInWithOtp(options);
          // En Supabase, nunca es autenticación automática
          return { ...result, data: { autoAuthenticated: false } };
        },
        signInWithOAuth: (options) => supabase.auth.signInWithOAuth(options),
        updateUser: (options) => supabase.auth.updateUser(options),
        onAuthStateChange: (callback) => supabase.auth.onAuthStateChange((event, session) => callback(event, session))
      }
    };
  } else {
    const jsonAuth = getJsonAuthClient();
    return {
      auth: {
        getSession: () => jsonAuth.getSession(),
        getUser: () => jsonAuth.getUser(),
        signIn: (userId: string) => jsonAuth.signIn(userId),
        signOut: () => jsonAuth.signOut(),
        signInWithOtp: (options) => jsonAuth.signInWithOtp(options),
        signInWithOAuth: (options) => jsonAuth.signInWithOAuth(options),
        updateUser: (options) => jsonAuth.updateUser(options),
        onAuthStateChange: (callback) => jsonAuth.onAuthStateChange(callback)
      }
    };
  }
}

/**
 * Crea cliente de servidor (solo para Supabase, en modo JSON retorna null)
 */
export function createServerAuthClient(
  request: NextRequest,
  response: NextResponse
): AuthClient | null {
  if (!isSupabaseEnabled()) {
    return null;
  }

  const supabase = createSupabaseServerClient(request, response);
  return {
    auth: {
      getSession: () => supabase.auth.getSession(),
      getUser: () => supabase.auth.getUser(),
      signIn: async () => {
        throw new Error('signIn directo no disponible en modo Supabase.');
      },
      signOut: () => supabase.auth.signOut(),
      signInWithOtp: (options) => supabase.auth.signInWithOtp(options),
      signInWithOAuth: (options) => supabase.auth.signInWithOAuth(options),
      updateUser: (options) => supabase.auth.updateUser(options),
      onAuthStateChange: (callback) => supabase.auth.onAuthStateChange((event, session) => callback(event, session))
    }
  };
}

/**
 * Obtiene el usuario autenticado (funciona en ambos modos)
 */
export async function getAuthenticatedUser(): Promise<AppUser | null> {
  if (isSupabaseEnabled()) {
    const client = getSupabaseBrowserClient();
    const { data, error } = await client.auth.getSession();
    if (error || !data.session) {
      return null;
    }
    return mapSupabaseUser(data.session.user);
  } else {
    const client = getJsonAuthClient();
    const { data } = await client.getSession();
    if (!data.session?.user) {
      return null;
    }
    return mapJsonUser(data.session.user.id) ?? null;
  }
}

/**
 * Exportar funciones y tipos útiles
 */
export { isSupabaseEnabled, mapSupabaseUser, getDemoUsers, mapJsonUser };
export type { AppUser };

