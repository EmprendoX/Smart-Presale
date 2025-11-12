import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/config";
import { byUserReservations } from "@/lib/mockdb";
import { Reservation } from "@/lib/types";
import { computeProgress } from "@/lib/rules";
import { validateAuthAndRole, createAuthErrorResponse, createPermissionErrorResponse } from "@/lib/auth/roles";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ ok: false, error: "userId requerido" }, { status: 400 });

  // Validar que el usuario esté autenticado y solo pueda ver sus propias reservas
  const user = await validateAuthAndRole(req);
  if (!user) {
    return createAuthErrorResponse("Debes iniciar sesión para ver tus reservas");
  }

  // Solo permitir ver sus propias reservas o ser admin
  if (user.id !== userId && user.role !== 'admin') {
    return createPermissionErrorResponse("Solo puedes ver tus propias reservas");
  }

  const data = await byUserReservations(userId);
  return NextResponse.json({ ok: true, data });
}

export async function POST(req: NextRequest) {
  // Validar autenticación (permitir cualquier usuario autenticado para reservar)
  const user = await validateAuthAndRole(req);
  if (!user) {
    return createAuthErrorResponse("Debes iniciar sesión para reservar propiedades");
  }

  // Advertencia si no es buyer (pero permitir la acción)
  if (user.role !== 'buyer') {
    console.warn(`[reservations] Usuario con rol '${user.role}' intentando reservar. Permitido temporalmente.`);
  }

  const body = await req.json();
  const { roundId, slots, kyc } = body || {};
  
  // Obtener userId de la sesión autenticada, no del body
  const userId = user.id;

  const round = await db.getRoundById(String(roundId));
  if (!round) return NextResponse.json({ ok: false, error: "Ronda no encontrada" }, { status: 404 });

  if (!slots || slots < 1) return NextResponse.json({ ok: false, error: "Datos inválidos" }, { status: 400 });

  // Regla: slots por persona
  const reservations = await db.getReservationsByRoundId(round.id);
  const userReservations = reservations.filter(r => r.userId === userId && r.status !== "refunded");
  const userSlots = userReservations.reduce((a, r) => a + r.slots, 0);

  if (userSlots + slots > round.slotsPerPerson)
    return NextResponse.json({ ok: false, error: `Máximo ${round.slotsPerPerson} slots por persona` }, { status: 400 });

  // Progreso actual (para decidir waitlist muy simple)
  const current = computeProgress(round, reservations);
  const goalReached = round.goalType === "reservations"
    ? current.confirmedSlots >= round.goalValue
    : current.confirmedAmount >= round.goalValue;

  const reservation: Reservation = {
    id: crypto.randomUUID(),
    roundId: round.id,
    userId,
    slots,
    amount: slots * round.depositAmount,
    status: goalReached ? "waitlisted" : "pending",
    createdAt: new Date().toISOString()
  };

  // Guardado
  await db.createReservation(reservation);

  // Nota: KYC aquí sólo valida presencia (en producción integrar Persona/Onfido)
  if (!kyc?.fullName || !kyc?.country || !kyc?.phone) {
    return NextResponse.json({ ok: false, error: "KYC ligero incompleto" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, data: reservation });
}

