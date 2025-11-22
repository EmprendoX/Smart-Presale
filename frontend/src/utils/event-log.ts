"use client";

import { useCallback, useEffect, useState } from "react";

export type EventAudience = "buyer" | "admin" | "both";
export type EventType =
  | "progress_80"
  | "deadline_72h"
  | "goal_failed"
  | "reservation_confirmed"
  | "reservation_refunded";

export type EventRecord = {
  id: string;
  roundId: string;
  type: EventType;
  title: string;
  description: string;
  audience: EventAudience;
  timestamp: number;
};

type EventTemplate = {
  title: string;
  description: string;
  audience: EventAudience;
};

const STORAGE_KEY = "sps_event_log";

const templates: Record<EventType, EventTemplate> = {
  progress_80: {
    title: "Avance del 80% alcanzado",
    description: "La ronda superó el 80% de la meta y avanza a la siguiente fase.",
    audience: "both"
  },
  deadline_72h: {
    title: "Cierre en 72h",
    description: "Quedan 72 horas para confirmar depósitos antes del bloqueo de edición.",
    audience: "both"
  },
  goal_failed: {
    title: "Meta no alcanzada",
    description: "La ronda cerró sin cumplir el objetivo y se marcaron reembolsos.",
    audience: "both"
  },
  reservation_confirmed: {
    title: "Reserva confirmada",
    description: "Se confirmó tu depósito y quedó asignado a la ronda.",
    audience: "both"
  },
  reservation_refunded: {
    title: "Reserva reembolsada",
    description: "Se procesó un reembolso o cancelación de la reserva.",
    audience: "both"
  }
};

export const eventTemplates: Record<EventType, EventTemplate> = templates;

const safeParse = (raw: string | null): EventRecord[] => {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as EventRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("No se pudo leer sps_event_log", error);
    return [];
  }
};

export const readEventLog = (): EventRecord[] => {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return safeParse(raw);
};

const persistEventLog = (events: EventRecord[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
};

const generateId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

export const appendEvent = (
  roundId: string,
  type: EventType,
  overrides?: Partial<Pick<EventRecord, "audience" | "title" | "description">>
): EventRecord | undefined => {
  if (typeof window === "undefined" || !roundId) return undefined;

  const events = readEventLog();
  const alreadyExists = events.some(event => event.roundId === roundId && event.type === type);
  if (alreadyExists) return undefined;

  const template = templates[type];
  const next: EventRecord = {
    id: generateId(),
    roundId,
    type,
    title: overrides?.title ?? template.title,
    description: overrides?.description ?? template.description,
    audience: overrides?.audience ?? template.audience,
    timestamp: Date.now()
  };

  const updated = [...events, next].sort((a, b) => b.timestamp - a.timestamp);
  persistEventLog(updated);
  return next;
};

export const filterEvents = (
  events: EventRecord[],
  audience?: EventAudience,
  roundId?: string
) => {
  return events.filter(event => {
    const audienceMatch = !audience || event.audience === "both" || event.audience === audience;
    const roundMatch = !roundId || event.roundId === roundId;
    return audienceMatch && roundMatch;
  });
};

export const getEventsForRound = (roundId: string, audience?: EventAudience) => {
  const events = readEventLog();
  return filterEvents(events, audience, roundId).sort((a, b) => b.timestamp - a.timestamp);
};

export const useEventLog = (options?: { audience?: EventAudience; roundId?: string }) => {
  const { audience, roundId } = options ?? {};
  const [events, setEvents] = useState<EventRecord[]>([]);

  const refresh = useCallback(() => {
    const all = readEventLog();
    const filtered = filterEvents(all, audience, roundId);
    setEvents(filtered.sort((a, b) => b.timestamp - a.timestamp));
  }, [audience, roundId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addEvent = useCallback(
    (round: string, type: EventType, overrides?: Partial<Pick<EventRecord, "audience" | "title" | "description">>) => {
      const created = appendEvent(round, type, overrides);
      if (created) {
        refresh();
      }
      return created;
    },
    [refresh]
  );

  return { events, addEvent, refresh };
};
