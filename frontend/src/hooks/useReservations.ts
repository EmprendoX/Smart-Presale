"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type LocalReservationStatus = "pendiente" | "confirmada" | "reembolsada" | "asignada";

export type LocalReservation = {
  slots: number;
  status: LocalReservationStatus;
  timestamp: number;
};

const STORAGE_KEY = "sps_reservations";

const readStorage = (): Record<string, LocalReservation> => {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as Record<string, LocalReservation>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    console.warn("No se pudo leer sps_reservations", error);
    return {};
  }
};

const persistStorage = (roundId: string, reservation: LocalReservation) => {
  if (typeof window === "undefined" || !roundId) return;
  const current = readStorage();
  current[roundId] = reservation;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
};

const defaultReservation: LocalReservation = {
  slots: 0,
  status: "pendiente",
  timestamp: 0
};

export function useReservations(roundId: string, initial?: Partial<LocalReservation>) {
  const baseReservation = useMemo<LocalReservation>(
    () => ({
      slots: initial?.slots ?? defaultReservation.slots,
      status: initial?.status ?? defaultReservation.status,
      timestamp: initial?.timestamp ?? Date.now()
    }),
    [initial?.slots, initial?.status, initial?.timestamp]
  );

  const [reservation, setReservation] = useState<LocalReservation>(baseReservation);

  useEffect(() => {
    if (!roundId) return;
    const stored = readStorage()[roundId];

    if (stored) {
      setReservation(stored);
      return;
    }

    const seeded = { ...baseReservation, timestamp: Date.now() };
    setReservation(seeded);
    persistStorage(roundId, seeded);
  }, [roundId, baseReservation]);

  const persist = useCallback(
    (updater: (current: LocalReservation) => LocalReservation) => {
      setReservation(prev => {
        const next = updater(prev);
        persistStorage(roundId, next);
        return next;
      });
    },
    [roundId]
  );

  const setSlots = useCallback(
    (slots: number) => {
      const normalized = Number.isFinite(slots) ? Math.max(0, Math.round(slots)) : 0;
      persist(prev => ({ ...prev, slots: normalized, timestamp: Date.now() }));
    },
    [persist]
  );

  const setStatus = useCallback(
    (status: LocalReservationStatus) => {
      persist(prev => ({ ...prev, status, timestamp: Date.now() }));
    },
    [persist]
  );

  const reset = useCallback(() => {
    persist(() => ({ ...defaultReservation, timestamp: Date.now() }));
  }, [persist]);

  return {
    reservation,
    setSlots,
    setStatus,
    reset
  };
}
