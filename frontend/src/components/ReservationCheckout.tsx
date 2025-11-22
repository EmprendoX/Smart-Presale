"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Progress } from "@/components/ui/Progress";
import { fmtCurrency } from "@/lib/format";
import { Currency } from "@/lib/types";
import { LocalReservationStatus, RoundStatus, useReservations } from "@/frontend/src/hooks/useReservations";

const formatCountdown = (msRemaining: number) => {
  const totalSeconds = Math.max(0, Math.floor(msRemaining / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${days}d ${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
};

const statusLabels: Record<LocalReservationStatus, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  reembolsada: "Reembolsada",
  asignada: "Asignada"
};

export type ReservationCheckoutProps = {
  roundId: string;
  depositAmount: number;
  goal: number;
  raised: number;
  currency: Currency;
  deadline: string;
  locale: string;
  defaultSlots?: number;
  goalType?: "amount" | "reservations";
  currentSlots?: number;
  rule?: "todo-nada" | "parcial";
};

export function ReservationCheckout({
  roundId,
  depositAmount,
  goal,
  raised,
  currency,
  deadline,
  locale,
  defaultSlots = 1,
  goalType = "amount",
  currentSlots,
  rule = "todo-nada"
}: ReservationCheckoutProps) {
  const { reservation, setSlots, setStatus, roundStatus, progressPercent, progressValue } = useReservations(
    roundId,
    {
      goalType,
      goalValue: goal,
      raised,
      deadline,
      depositAmount,
      currentSlots,
      rule
    },
    { slots: defaultSlots }
  );
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const handleSlotChange = (value: number) => {
    const normalized = Number.isFinite(value) ? Math.max(1, Math.round(value)) : 1;
    setSlots(normalized);
  };

  const confirmReservation = () => {
    if (reservation.slots <= 0) return;
    setStatus("confirmada");
  };

  const effectiveRaised = useMemo(() => {
    if (goalType === "reservations") return progressValue;
    return progressValue;
  }, [goalType, progressValue]);

  const progressLabel = goalType === "reservations" ? `${progressValue} / ${goal} reservaciones` : undefined;
  const totalDeposit = reservation.slots * depositAmount;
  const deadlineDate = new Date(deadline);
  const countdown = formatCountdown(deadlineDate.getTime() - now);

  const roundStatusColor: Record<RoundStatus, string> = {
    en_progreso: "bg-[color:var(--bg-soft)] border-[color:var(--line)] text-[color:var(--text-strong)]",
    parcial: "bg-amber-50 border-amber-200 text-amber-900",
    cumplida: "bg-emerald-50 border-emerald-200 text-emerald-900",
    no_cumplida: "bg-red-50 border-red-200 text-red-900"
  };

  const statusCopy: Record<RoundStatus, { title: string; body: string }> = {
    en_progreso: {
      title: "Ronda en progreso",
      body: "Aún puedes editar tu reserva antes de confirmar el siguiente paso."
    },
    parcial: {
      title: "Avance parcial mínimo alcanzado",
      body: "Se superó el 70% requerido para continuar con el plan parcial. Los depósitos se mantienen vigentes."
    },
    cumplida: {
      title: "Meta de la ronda cumplida",
      body: "Tu reserva continúa con el flujo. Prepara el contrato de promesa."
    },
    no_cumplida: {
      title: "Ronda no alcanzó la meta",
      body: "La fecha límite expiró sin llegar al umbral. Tu depósito fue marcado para reembolso."
    }
  };

  return (
    <Card className="border-[color:var(--line)]">
      <CardContent className="space-y-5 p-5">
        <div className={`rounded-lg border px-3 py-2 text-sm ${roundStatusColor[roundStatus]}`}>
          <p className="font-semibold">{statusCopy[roundStatus].title}</p>
          <p className="text-xs opacity-80">{statusCopy[roundStatus].body}</p>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase text-[color:var(--text-muted)]">Estado de mi reserva</p>
            <p className="text-lg font-semibold text-[color:var(--text-strong)] capitalize">
              {statusLabels[reservation.status]}
            </p>
            <p className="text-xs text-[color:var(--text-muted)]">
              Última actividad: {new Date(reservation.timestamp).toLocaleString(locale === "en" ? "en-US" : "es-MX")}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase text-[color:var(--text-muted)]">Depósito total</p>
            <p className="text-2xl font-bold text-[color:var(--text-strong)]">
              {fmtCurrency(totalDeposit, currency, locale)}
            </p>
            <p className="text-xs text-[color:var(--text-muted)]">{reservation.slots} cupo(s) seleccionado(s)</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[color:var(--text-muted)]">
            <span>Progreso de la ronda</span>
            <span>{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} />
          <p className="text-xs text-[color:var(--text-muted)]">
            {goalType === "amount" && (
              <>
                Incluye tu reserva: {fmtCurrency(effectiveRaised, currency, locale)} / {fmtCurrency(goal, currency, locale)}
              </>
            )}
            {goalType === "reservations" && progressLabel}
          </p>
        </div>

        <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-[color:var(--text-muted)]">Fecha límite</p>
              <p className="text-sm text-[color:var(--text-strong)]">
                {deadlineDate.toLocaleDateString(locale === "en" ? "en-US" : "es-MX", {
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase text-[color:var(--text-muted)]">Cuenta regresiva</p>
              <p className="font-mono text-sm text-[color:var(--text-strong)]">{countdown}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end">
          <Input
            label="Cupos a reservar"
            type="number"
            min={1}
            value={reservation.slots}
            onChange={event => handleSlotChange(parseInt(event.target.value || "1", 10))}
          />
          <div className="flex flex-col gap-2 sm:items-end">
            <Button onClick={confirmReservation} disabled={reservation.slots <= 0 || reservation.status === "confirmada"}>
              {reservation.status === "confirmada" ? "Reserva confirmada" : "Confirmar reserva"}
            </Button>
            {roundStatus === "cumplida" && (
              <Button variant="secondary" className="w-full sm:w-auto">
                Contrato de promesa (próximamente)
              </Button>
            )}
          </div>
        </div>

        <p className="text-xs text-[color:var(--text-muted)]">
          La reserva se almacena localmente por ronda. Puedes seguir editando los cupos y, una vez listo, confirmar la operación
          sin necesidad de pago en línea.
        </p>
      </CardContent>
    </Card>
  );
}
