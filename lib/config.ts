import { DatabaseService } from './services/db';
import { JsonDbService } from './services/json-db-service';
import { SupabaseService } from './services/supabase-service';
import { createPaymentService } from './services/payment';

// Configuración: usar Supabase o JSON
const USE_SUPABASE = process.env.USE_SUPABASE === 'true';

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


