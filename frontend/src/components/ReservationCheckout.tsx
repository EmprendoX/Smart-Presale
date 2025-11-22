"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Progress } from "@/components/ui/Progress";
import { fmtCurrency } from "@/lib/format";
import { Currency } from "@/lib/types";
import { LocalReservationStatus, useReservations } from "@/frontend/src/hooks/useReservations";

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
};

export function ReservationCheckout({
  roundId,
  depositAmount,
  goal,
  raised,
  currency,
  deadline,
  locale,
  defaultSlots = 1
}: ReservationCheckoutProps) {
  const { reservation, setSlots, setStatus } = useReservations(roundId, { slots: defaultSlots });
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
    if (reservation.status === "reembolsada") return raised;
    return raised + reservation.slots * depositAmount;
  }, [depositAmount, raised, reservation.slots, reservation.status]);

  const progressPercent = Math.min(Math.round((effectiveRaised / goal) * 100), 100);
  const totalDeposit = reservation.slots * depositAmount;
  const deadlineDate = new Date(deadline);
  const countdown = formatCountdown(deadlineDate.getTime() - now);

  return (
    <Card className="border-[color:var(--line)]">
      <CardContent className="space-y-5 p-5">
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
            Incluye tu reserva: {fmtCurrency(effectiveRaised, currency, locale)} / {fmtCurrency(goal, currency, locale)}
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
          <Button onClick={confirmReservation} disabled={reservation.slots <= 0 || reservation.status === "confirmada"}>
            {reservation.status === "confirmada" ? "Reserva confirmada" : "Confirmar reserva"}
          </Button>
        </div>

        <p className="text-xs text-[color:var(--text-muted)]">
          La reserva se almacena localmente por ronda. Puedes seguir editando los cupos y, una vez listo, confirmar la operación
          sin necesidad de pago en línea.
        </p>
      </CardContent>
    </Card>
  );
}
