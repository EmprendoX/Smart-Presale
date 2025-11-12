import { clsx } from "clsx";

export function Badge({ children, color = "neutral" }: { children: React.ReactNode; color?: "neutral" | "green" | "yellow" | "red" | "success" | "warning" | "error" | "info" }) {
  const map = {
    neutral: "bg-[color:var(--bg-soft)] text-[color:var(--text-muted)]",
    green: "bg-green-100 text-green-700",
    yellow: "bg-yellow-100 text-yellow-700",
    red: "bg-red-100 text-red-700",
    success: "bg-[color:var(--success)]/10 text-[color:var(--success)]",
    warning: "bg-[color:var(--warning)]/10 text-[color:var(--warning)]",
    error: "bg-[color:var(--error)]/10 text-[color:var(--error)]",
    info: "bg-[color:var(--info)]/10 text-[color:var(--info)]"
  } as const;

  return <span className={clsx("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", map[color])}>{children}</span>;
}


