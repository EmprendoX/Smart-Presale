"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { fmtCurrency } from "@/lib/format";
import { projectsData, type ProjectShowcase } from "@/data/projects";
import { type LocalReservation } from "@/frontend/src/hooks/useReservations";
import { EventRecord, useEventLog } from "@/frontend/src/utils/event-log";

type ReservationRecord = {
  roundId: string;
  reservation: LocalReservation;
  project?: ProjectShowcase;
};

const STORAGE_KEY = "sps_reservations";
const REFUND_WINDOW_HOURS = 48;

const statusStyle: Record<LocalReservation["status"], { label: string; color: "neutral" | "success" | "warning" | "info" }> = {
  pendiente: { label: "Pendiente", color: "info" },
  confirmada: { label: "Confirmada", color: "success" },
  asignada: { label: "Asignada", color: "info" },
  reembolsada: { label: "Reembolsada", color: "warning" }
};


const readStorage = (): ReservationRecord[] => {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as Record<string, LocalReservation>;
    if (!parsed || typeof parsed !== "object") return [];

    return Object.entries(parsed).map(([roundId, reservation]) => ({
      roundId,
      reservation,
      project: projectsData.find(project => project.id === roundId)
    }));
  } catch (error) {
    console.warn("No se pudo leer sps_reservations", error);
    return [];
  }
};

const persistStorage = (records: ReservationRecord[]) => {
  if (typeof window === "undefined") return;

  const payload: Record<string, LocalReservation> = records.reduce(
    (acc, current) => ({
      ...acc,
      [current.roundId]: current.reservation
    }),
    {}
  );

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};


const formatDateTime = (value: number, locale: string) => {
  return new Date(value).toLocaleString(locale === "en" ? "en-US" : "es-MX", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

export default function MisReservasPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const [records, setRecords] = useState<ReservationRecord[]>([]);
  const { events } = useEventLog({ audience: "buyer" });

  const eventsByRound = useMemo(() => {
    const grouped = new Map<string, EventRecord[]>();

    events.forEach(event => {
      const current = grouped.get(event.roundId) ?? [];
      grouped.set(event.roundId, [...current, event].sort((a, b) => b.timestamp - a.timestamp));
    });

    return grouped;
  }, [events]);

  useEffect(() => {
    setRecords(readStorage());
  }, []);

  const handleRefund = (roundId: string, deadline: string) => {
    const deadlineTime = new Date(deadline).getTime();
    const refundWindowEnds = deadlineTime + REFUND_WINDOW_HOURS * 60 * 60 * 1000;
    if (Date.now() > refundWindowEnds) return;

    setRecords(prev => {
      const next = prev.map(record => {
        if (record.roundId !== roundId) return record;

        return {
          ...record,
          reservation: {
            ...record.reservation,
            status: "reembolsada",
            timestamp: Date.now()
          }
        };
      });

      persistStorage(next);
      return next;
    });
  };

  const reservations = useMemo(
    () => [...records].sort((a, b) => b.reservation.timestamp - a.reservation.timestamp),
    [records]
  );

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--brand-primary)]">Tus reservas</p>
        <h1 className="text-3xl font-bold text-[color:var(--text-strong)]">Mis reservas</h1>
        <p className="text-sm text-[color:var(--text-muted)] max-w-2xl">
          Repasa el estado de cada depósito almacenado en tu navegador. Puedes solicitar un reembolso dentro de la ventana
          permitida y consultar el historial de avisos clave.
        </p>
      </header>

      {reservations.length === 0 ? (
        <Card className="border-[color:var(--line)]">
          <CardContent className="py-10 text-center text-sm text-[color:var(--text-muted)]">
            Aún no registras reservas locales. Confirma una en cualquier proyecto para verla aquí.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reservations.map(record => {
            const project = record.project;
            const status = statusStyle[record.reservation.status];
            const deadlineLabel = project
              ? new Date(project.deadline).toLocaleDateString(locale === "en" ? "en-US" : "es-MX", {
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                })
              : "Sin fecha";
            const deadlineTime = project ? new Date(project.deadline).getTime() : 0;
            const refundWindowEnds = deadlineTime + REFUND_WINDOW_HOURS * 60 * 60 * 1000;
            const inRefundWindow = project ? Date.now() <= refundWindowEnds : false;
            const totalDeposit = project ? project.deposit * record.reservation.slots : 0;
            const notifications = eventsByRound.get(record.roundId) ?? [];

            return (
              <Card key={record.roundId} className="border-[color:var(--line)]">
                <CardContent className="space-y-5 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase text-[color:var(--text-muted)]">Proyecto</p>
                      <p className="text-lg font-semibold text-[color:var(--text-strong)]">
                        {project?.name ?? record.roundId}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-[color:var(--text-muted)]">
                        <Badge color={status.color}>{status.label}</Badge>
                        <span>Última actividad: {formatDateTime(record.reservation.timestamp, locale)}</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-sm text-right text-[color:var(--text-strong)]">
                      <p className="text-xs font-semibold uppercase text-[color:var(--text-muted)]">Fecha límite</p>
                      <p>{deadlineLabel}</p>
                      {project ? (
                        <p className="text-xs text-[color:var(--text-muted)]">
                          Ventana reembolso hasta {formatDateTime(refundWindowEnds, locale)}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-3 rounded-lg bg-[color:var(--bg-soft)] p-3 sm:grid-cols-3">
                    <div>
                      <p className="text-xs font-semibold uppercase text-[color:var(--text-muted)]">Cupos reservados</p>
                      <p className="text-lg font-semibold text-[color:var(--text-strong)]">{record.reservation.slots}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-[color:var(--text-muted)]">Depósito total</p>
                      <p className="text-lg font-semibold text-[color:var(--text-strong)]">
                        {fmtCurrency(totalDeposit, project?.currency ?? "USD", locale)}
                      </p>
                    </div>
                    <div className="flex items-end justify-end">
                      <Button
                        variant="secondary"
                        disabled={!inRefundWindow || record.reservation.status === "reembolsada"}
                        onClick={() => project && handleRefund(record.roundId, project.deadline)}
                      >
                        Solicitar reembolso
                      </Button>
                    </div>
                  </div>

                  {!inRefundWindow && record.reservation.status !== "reembolsada" ? (
                    <p className="text-xs text-[color:var(--warning)]">
                      La ventana de reembolso cerró. Espera la confirmación de la ronda para más acciones.
                    </p>
                  ) : null}

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase text-[color:var(--text-muted)]">
                      Historial de notificaciones
                    </p>
                    {notifications.length === 0 ? (
                      <p className="text-xs text-[color:var(--text-muted)]">
                        Aún no se registran eventos para esta reserva.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {notifications.map(notification => (
                          <div
                            key={`${notification.type}-${notification.timestamp}`}
                            className="flex items-start justify-between rounded-lg border border-[color:var(--line)] p-3"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge color="neutral">{notification.title}</Badge>
                                <span className="text-xs text-[color:var(--text-muted)]">
                                  {formatDateTime(notification.timestamp, locale)}
                                </span>
                              </div>
                              <p className="text-sm text-[color:var(--text-strong)]">{notification.description}</p>
                            </div>
                            <span className="text-xs font-medium uppercase text-[color:var(--brand-primary)]">
                              {notification.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
