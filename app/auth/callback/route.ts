import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, mapSupabaseUser } from '@/lib/auth/supabase';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';
  const locale = requestUrl.searchParams.get('locale') || 'es';

  if (!code) {
    console.error('[auth/callback] No code parameter found');
    return NextResponse.redirect(
      new URL(`/${locale}/sign-up?error=missing_code`, request.url)
    );
  }

  try {
    // Crear respuesta para establecer cookies
    const response = NextResponse.redirect(new URL(`/${locale}${next}`, request.url));
    const supabase = createSupabaseServerClient(request, response);

    // Intercambiar código por sesión
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('[auth/callback] Error exchanging code for session:', error);
      return NextResponse.redirect(
        new URL(`/${locale}/sign-up?error=${encodeURIComponent(error.message)}`, request.url)
      );
    }

    if (!data.session) {
      console.error('[auth/callback] No session returned after code exchange');
      return NextResponse.redirect(
        new URL(`/${locale}/sign-up?error=no_session`, request.url)
      );
    }

    // Mapear usuario para obtener rol y estado KYC
    const user = mapSupabaseUser(data.session.user);

    // Establecer cookies de sesión (ya se hace en createSupabaseServerClient)
    // La respuesta ya tiene las cookies configuradas por Supabase

    console.log('[auth/callback] Successfully authenticated user:', {
      userId: user?.id,
      email: user?.email,
      role: user?.role,
      kycStatus: user?.kycStatus
    });

    // Redirigir a página de verificación que refrescará la sesión en el cliente
    // Esto asegura que el AuthProvider detecte la sesión correctamente
    const verifyUrl = new URL(`/auth/verify?locale=${locale}&next=${encodeURIComponent(next)}`, request.url);
    return NextResponse.redirect(verifyUrl);
  } catch (error: any) {
    console.error('[auth/callback] Unexpected error:', error);
    return NextResponse.redirect(
      new URL(`/${locale}/sign-up?error=${encodeURIComponent(error.message || 'unknown_error')}`, request.url)
    );
  }
}

