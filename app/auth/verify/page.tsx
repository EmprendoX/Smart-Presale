"use client";

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/providers/AuthProvider';

export const dynamic = 'force-dynamic';

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, refreshSession } = useAuth();
  const locale = searchParams.get('locale') || 'es';
  const next = searchParams.get('next') || '/dashboard';

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const verifyAndRedirect = async () => {
      // Forzar refresh de sesión
      await refreshSession();

      // Esperar un momento para que el AuthProvider actualice el estado
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verificar nuevamente después del refresh
      const { getSupabaseBrowserClient } = await import('@/lib/auth/supabase');
      const client = getSupabaseBrowserClient();
      const { data: { session } } = await client.auth.getSession();

      if (session) {
        // Sesión detectada, determinar destino
        const { mapSupabaseUser } = await import('@/lib/auth/supabase');
        const appUser = mapSupabaseUser(session.user);

        let destination = next;
        
        if (appUser) {
          // Si necesita KYC, redirigir a KYC
          if (appUser.kycStatus === 'none') {
            destination = '/kyc';
          } else if (appUser.kycStatus === 'basic') {
            destination = '/kyc?step=documents';
          } else {
            // Redirigir según rol
            const roleHome: Record<string, string> = {
              buyer: '/dashboard',
              developer: '/dev',
              admin: '/admin'
            };
            destination = roleHome[appUser.role] || '/dashboard';
          }
        }

        console.log('[auth/verify] Session verified, redirecting to:', destination);
        router.replace(`/${locale}${destination}`);
      } else {
        // No hay sesión, redirigir a sign-up
        console.warn('[auth/verify] No session found after refresh, redirecting to sign-up');
        router.replace(`/${locale}/sign-up?error=session_not_found`);
      }
    };

    // Ejecutar verificación después de un breve delay para asegurar que las cookies estén disponibles
    timeoutId = setTimeout(() => {
      verifyAndRedirect();
    }, 100);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [router, locale, next, refreshSession]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
        <p className="text-neutral-600">Verificando sesión...</p>
      </div>
    </div>
  );
}

