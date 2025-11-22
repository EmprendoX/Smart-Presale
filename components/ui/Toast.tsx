"use client";

type ToastProps = {
  title: string;
  description?: string;
  onClose?: () => void;
};

export function Toast({ title, description, onClose }: ToastProps) {
  return (
    <div className="w-80 rounded-lg border border-[color:var(--line)] bg-white shadow-lg">
      <div className="flex items-start gap-3 p-3">
        <div className="flex-1 space-y-1">
          <p className="text-sm font-semibold text-[color:var(--text-strong)]">{title}</p>
          {description ? <p className="text-xs text-[color:var(--text-muted)]">{description}</p> : null}
        </div>
        {onClose ? (
          <button
            type="button"
            className="rounded p-1 text-[color:var(--text-muted)] transition hover:bg-[color:var(--bg-soft)]"
            onClick={onClose}
            aria-label="Cerrar notificación"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M5.22 5.22a.75.75 0 0 1 1.06 0L10 8.94l3.72-3.72a.75.75 0 1 1 1.06 1.06L11.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06L10 11.06l-3.72 3.72a.75.75 0 1 1-1.06-1.06L8.94 10 5.22 6.28a.75.75 0 0 1 0-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        ) : null}
      </div>
    </div>
  );
}
