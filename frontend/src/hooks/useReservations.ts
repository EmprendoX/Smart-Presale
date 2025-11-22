"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type RoundGoalType = "amount" | "reservations";
export type RoundRuleType = "todo-nada" | "parcial";
export type RoundStatus = "en_progreso" | "parcial" | "cumplida" | "no_cumplida";

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

type RoundContext = {
  goalType: RoundGoalType;
  goalValue: number;
  raised: number;
  depositAmount: number;
  deadline: string;
  rule: RoundRuleType;
  currentSlots?: number;
  partialThreshold?: number; // 0.7 => 70%
};

export function useReservations(roundId: string, round: RoundContext, initial?: Partial<LocalReservation>) {
  const baseReservation = useMemo<LocalReservation>(
    () => ({
      slots: initial?.slots ?? defaultReservation.slots,
      status: initial?.status ?? defaultReservation.status,
      timestamp: initial?.timestamp ?? Date.now()
    }),
    [initial?.slots, initial?.status, initial?.timestamp]
  );

  const [reservation, setReservation] = useState<LocalReservation>(baseReservation);
  const effectivePartialThreshold = round.rule === "parcial" ? round.partialThreshold ?? 0.7 : 1;

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

  const contributionSlots = reservation.status === "reembolsada" ? 0 : reservation.slots;
  const contributionAmount = reservation.status === "reembolsada" ? 0 : reservation.slots * round.depositAmount;

  const progressValue = useMemo(() => {
    if (round.goalType === "reservations") {
      return (round.currentSlots ?? 0) + contributionSlots;
    }

    return round.raised + contributionAmount;
  }, [round.currentSlots, round.goalType, round.raised, contributionAmount, contributionSlots]);

  const progressPercent = useMemo(
    () => Math.min(100, Math.round((progressValue / round.goalValue) * 100)),
    [progressValue, round.goalValue]
  );

  const deadlineTime = useMemo(() => new Date(round.deadline).getTime(), [round.deadline]);
  const isExpired = Date.now() >= deadlineTime;

  const roundStatus: RoundStatus = useMemo(() => {
    if (progressPercent >= 100) return "cumplida";
    if (round.rule === "parcial" && progressPercent >= Math.round(effectivePartialThreshold * 100)) return "parcial";
    if (isExpired) return "no_cumplida";
    return "en_progreso";
  }, [effectivePartialThreshold, isExpired, progressPercent, round.rule]);

  useEffect(() => {
    if (roundStatus === "no_cumplida" && reservation.status !== "reembolsada") {
      setStatus("reembolsada");
    }
  }, [reservation.status, roundStatus, setStatus]);

  return {
    reservation,
    setSlots,
    setStatus,
    reset,
    roundStatus,
    progressPercent,
    progressValue
  };
}
