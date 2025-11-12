import { DatabaseService } from './services/db';
import { JsonDbService } from './services/json-db-service';
import { SupabaseService } from './services/supabase-service';
import { createPaymentService } from './services/payment';

// Configuración: usar Supabase o JSON
const USE_SUPABASE = process.env.USE_SUPABASE === 'true';

/**
 * Valida la configuración de autenticación y muestra advertencias en desarrollo
 */
function validateAuthConfig() {
  if (process.env.NODE_ENV !== 'development') {
    return; // Solo validar en desarrollo
  }

  const useSupabase = process.env.USE_SUPABASE === 'true';
  const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasSupabaseKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (useSupabase) {
    if (!hasSupabaseUrl || !hasSupabaseKey) {
      console.warn(
        '\n⚠️  [config] ADVERTENCIA: USE_SUPABASE=true pero faltan credenciales:\n' +
        `   - NEXT_PUBLIC_SUPABASE_URL: ${hasSupabaseUrl ? '✓' : '✗'}\n` +
        `   - NEXT_PUBLIC_SUPABASE_ANON_KEY: ${hasSupabaseKey ? '✓' : '✗'}\n` +
        '   La autenticación puede fallar. Configura las variables o cambia USE_SUPABASE=false\n'
      );
    } else {
      console.log('[config] ✓ Configuración de Supabase válida');
    }
  } else {
    console.log('[config] ✓ Modo JSON activado - Usando usuarios demo');
    console.log('[config]   Usuarios disponibles: u_buyer_1, u_dev_1, u_admin_1');
  }
}

// Validar configuración al cargar el módulo
validateAuthConfig();

// Instanciar el servicio según la configuración
let dbService: DatabaseService;

if (USE_SUPABASE) {
  try {
    dbService = new SupabaseService();
    console.log('[config] Modo Supabase activado');
  } catch (error) {
    console.error('[config] Error al inicializar Supabase, usando modo JSON:', error);
    dbService = new JsonDbService();
  }
} else {
  dbService = new JsonDbService();
  console.log('[config] Modo JSON activado');
}

export const db = dbService;
export const payments = createPaymentService(dbService);
export { USE_SUPABASE };


