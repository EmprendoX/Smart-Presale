"use client";

import { useCallback, useEffect, useState } from "react";

export type LogLevel = "info" | "warn" | "error";

export type LogEntry = {
  id: string;
  level: LogLevel;
  message: string;
  context?: string;
  metadata?: Record<string, unknown>;
  timestamp: number;
};

const STORAGE_KEY = "sps_logger";

const parseLogs = (raw: string | null): LogEntry[] => {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as LogEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("No se pudo leer sps_logger", error);
    return [];
  }
};

export const readLogs = (): LogEntry[] => {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return parseLogs(raw);
};

const persistLogs = (entries: LogEntry[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

export const clearLogs = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
};

const generateId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `log_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

export const writeLog = (
  level: LogLevel,
  message: string,
  options?: Partial<Pick<LogEntry, "context" | "metadata">>
): LogEntry | undefined => {
  if (typeof window === "undefined") return undefined;

  const next: LogEntry = {
    id: generateId(),
    level,
    message,
    context: options?.context,
    metadata: options?.metadata,
    timestamp: Date.now()
  };

  const current = readLogs();
  const updated = [next, ...current].sort((a, b) => b.timestamp - a.timestamp);
  persistLogs(updated);
  return next;
};

export const logInfo = (
  message: string,
  options?: Partial<Pick<LogEntry, "context" | "metadata">>
) => writeLog("info", message, options);

export const logWarn = (
  message: string,
  options?: Partial<Pick<LogEntry, "context" | "metadata">>
) => writeLog("warn", message, options);

export const logError = (
  message: string,
  options?: Partial<Pick<LogEntry, "context" | "metadata">>
) => writeLog("error", message, options);

const filterByContext = (entries: LogEntry[], context?: string) => {
  if (!context) return entries;
  return entries.filter(entry => entry.context === context);
};

export const useLogger = (options?: { context?: string }) => {
  const context = options?.context;
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const refresh = useCallback(() => {
    const entries = readLogs();
    const filtered = filterByContext(entries, context);
    setLogs(filtered.sort((a, b) => b.timestamp - a.timestamp));
  }, [context]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const append = useCallback(
    (level: LogLevel, message: string, opts?: Partial<Pick<LogEntry, "context" | "metadata">>) => {
      const entry = writeLog(level, message, { ...opts, context: opts?.context ?? context });
      if (entry) {
        refresh();
      }
      return entry;
    },
    [context, refresh]
  );

  const clear = useCallback(() => {
    if (typeof window === "undefined") return;

    if (!context) {
      clearLogs();
      setLogs([]);
      return;
    }

    const remaining = readLogs().filter(entry => entry.context !== context);
    persistLogs(remaining);
    setLogs(filterByContext(remaining, context));
  }, [context]);

  return {
    logs,
    logInfo: (message: string, opts?: Partial<Pick<LogEntry, "context" | "metadata">>) => append("info", message, opts),
    logWarn: (message: string, opts?: Partial<Pick<LogEntry, "context" | "metadata">>) => append("warn", message, opts),
    logError: (message: string, opts?: Partial<Pick<LogEntry, "context" | "metadata">>) => append("error", message, opts),
    refresh,
    clear
  };
};
