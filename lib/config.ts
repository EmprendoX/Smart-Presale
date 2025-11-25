import { DatabaseService } from './services/db';
import { MockDbService } from './services/mock-db-service';
import { createPaymentService } from './services/payment';

// Usar siempre el servicio mock (sin base de datos ni autenticación)
const dbService: DatabaseService = new MockDbService();

console.log('[config] Modo Mock activado - Sin base de datos ni autenticación');

export const db = dbService;
export const payments = createPaymentService(dbService);


