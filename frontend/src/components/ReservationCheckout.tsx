"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Progress } from "@/components/ui/Progress";
import { fmtCurrency } from "@/lib/format";
import { Currency } from "@/lib/types";
import { Toast } from "@/components/ui/Toast";
import { EventRecord, useEventLog } from "@/frontend/src/utils/event-log";
import {
  LocalPaymentMethod,
  LocalReservationPayment,
  LocalReservationStatus,
  LocalPaymentStatus,
  RoundStatus,
  useReservations
} from "@/frontend/src/hooks/useReservations";

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
  const { reservation, setSlots, setStatus, setPayment, roundStatus, progressPercent, progressValue } = useReservations(
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
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<LocalPaymentMethod>("tarjeta");
  const [draftTxIds, setDraftTxIds] = useState<Record<LocalPaymentMethod, string>>({
    tarjeta: "",
    transferencia: ""
  });
  const { addEvent } = useEventLog({ audience: "buyer", roundId });
  const [toasts, setToasts] = useState<EventRecord[]>([]);

  const paymentStatusLabels: Record<LocalPaymentStatus, string> = {
    pendiente: "Pendiente de conciliación",
    confirmada: "Confirmada"
  };

  const paymentMethodLabels: Record<LocalPaymentMethod, string> = {
    tarjeta: "Tarjeta",
    transferencia: "Transferencia"
  };

  const pushToast = (event?: EventRecord) => {
    if (!event) return;
    setToasts(prev => [...prev, event]);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (progressPercent >= 80) {
      pushToast(addEvent(roundId, "progress_80"));
    }
  }, [addEvent, progressPercent, roundId]);

  useEffect(() => {
    const remaining = new Date(deadline).getTime() - now;
    if (remaining <= 72 * 60 * 60 * 1000 && remaining > 0) {
      pushToast(addEvent(roundId, "deadline_72h"));
    }
  }, [addEvent, deadline, now, roundId]);

  useEffect(() => {
    if (roundStatus === "no_cumplida") {
      pushToast(addEvent(roundId, "goal_failed"));
    }
  }, [addEvent, roundId, roundStatus]);

  useEffect(() => {
    if (reservation.status === "confirmada") {
      pushToast(addEvent(roundId, "reservation_confirmed"));
    }

    if (reservation.status === "reembolsada") {
      pushToast(addEvent(roundId, "reservation_refunded"));
    }
  }, [addEvent, reservation.status, roundId]);

  useEffect(() => {
    if (toasts.length === 0) return;

    const timers = toasts.map(toast => window.setTimeout(() => dismissToast(toast.id), 5200));
    return () => timers.forEach(timer => window.clearTimeout(timer));
  }, [toasts]);

  const handleSlotChange = (value: number) => {
    const normalized = Number.isFinite(value) ? Math.max(1, Math.round(value)) : 1;
    setSlots(normalized);
  };

  const confirmReservation = () => {
    if (reservation.slots <= 0) return;
    setPaymentModalOpen(true);
  };

  const generateMockId = (prefix: string) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

  useEffect(() => {
    if (isPaymentModalOpen) {
      setDraftTxIds({ tarjeta: generateMockId("pi_mock"), transferencia: generateMockId("trf") });
      setSelectedPaymentMethod(reservation.payment?.method ?? "tarjeta");
    }
  }, [isPaymentModalOpen, reservation.payment?.method]);

  const persistPayment = (payment: LocalReservationPayment) => {
    setPayment(payment);
    if (payment.status === "confirmada") {
      setStatus("confirmada");
    } else {
      setStatus("pendiente");
    }
  };

  const handleSimulatePayment = () => {
    const txId = draftTxIds[selectedPaymentMethod];
    if (!txId) return;

    if (selectedPaymentMethod === "tarjeta") {
      persistPayment({ method: "tarjeta", txId, status: "confirmada" });
    } else {
      persistPayment({ method: "transferencia", txId, status: "pendiente" });
    }

    setPaymentModalOpen(false);
  };

  const handleConfirmPayment = () => {
    if (!reservation.payment) return;

    setPayment({ ...reservation.payment, status: "confirmada" });
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
    <>
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

        <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-[color:var(--text-muted)]">Método de pago</p>
              <p className="text-sm font-semibold text-[color:var(--text-strong)]">
                {reservation.payment ? paymentMethodLabels[reservation.payment.method] : "Sin asignar"}
              </p>
              <p className="text-xs text-[color:var(--text-muted)]">
                {reservation.payment?.txId ? `Referencia: ${reservation.payment.txId}` : "Selecciona un método para generar tu referencia"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase text-[color:var(--text-muted)]">Estado del pago</p>
              <p className="text-sm font-semibold text-[color:var(--text-strong)]">
                {reservation.payment?.status ? paymentStatusLabels[reservation.payment.status] : "Pendiente"}
              </p>
              {reservation.payment?.status === "pendiente" && (
                <p className="text-xs text-[color:var(--text-muted)]">Confirma manualmente cuando recibas la transferencia.</p>
              )}
            </div>
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
            <Button onClick={confirmReservation} disabled={reservation.slots <= 0}>
              {reservation.payment?.status === "confirmada" ? "Reserva confirmada" : "Proceder al pago"}
            </Button>
            {reservation.payment?.status === "pendiente" && (
              <Button variant="secondary" onClick={handleConfirmPayment} className="w-full sm:w-auto">
                Confirmar pago
              </Button>
            )}
            {roundStatus === "cumplida" && (
              <Button variant="secondary" className="w-full sm:w-auto">
                Contrato de promesa (próximamente)
              </Button>
            )}
          </div>
        </div>

        <p className="text-xs text-[color:var(--text-muted)]">
          La reserva se almacena localmente por ronda. Puedes seguir editando los cupos y, una vez listo, confirmar la operación
          con tarjeta o transferencia simulada y conciliar el pago manualmente.
        </p>
        </CardContent>
      </Card>

      <div className="pointer-events-none fixed right-4 top-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast title={toast.title} description={toast.description} onClose={() => dismissToast(toast.id)} />
          </div>
        ))}
      </div>

      <Modal open={isPaymentModalOpen} title="Simular pago" onClose={() => setPaymentModalOpen(false)}>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[color:var(--text-strong)]">1. Selecciona el método</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {(["tarjeta", "transferencia"] as LocalPaymentMethod[]).map(method => (
                <button
                  key={method}
                  className={`rounded border px-3 py-2 text-left ${
                    selectedPaymentMethod === method
                      ? "border-[color:var(--text-strong)] bg-[color:var(--bg-soft)]"
                      : "border-[color:var(--line)]"
                  }`}
                  onClick={() => setSelectedPaymentMethod(method)}
                >
                  <p className="text-sm font-semibold text-[color:var(--text-strong)]">{paymentMethodLabels[method]}</p>
                  <p className="text-xs text-[color:var(--text-muted)]">
                    {method === "tarjeta"
                      ? "Genera un Payment Intent simulado"
                      : "Obtén una referencia única para tu transferencia"}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-[color:var(--text-strong)]">2. Detalles</p>
            {selectedPaymentMethod === "tarjeta" && (
              <div className="rounded border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-3 text-sm">
                <p className="font-semibold">Payment Intent generado</p>
                <p className="text-xs text-[color:var(--text-muted)]">ID: {draftTxIds.tarjeta}</p>
                <p className="text-xs text-[color:var(--text-muted)]">El pago se confirmará automáticamente.</p>
              </div>
            )}
            {selectedPaymentMethod === "transferencia" && (
              <div className="rounded border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-3 text-sm">
                <p className="font-semibold">Referencia única</p>
                <p className="text-xs text-[color:var(--text-muted)]">Usa este ID al transferir: {draftTxIds.transferencia}</p>
                <p className="text-xs text-[color:var(--text-muted)]">
                  El pago quedará pendiente hasta que confirmes manualmente la conciliación.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setPaymentModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSimulatePayment}>Confirmar método</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
