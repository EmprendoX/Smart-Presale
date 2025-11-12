import { InputHTMLAttributes, LabelHTMLAttributes } from "react";
import { clsx } from "clsx";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function Input({ label, className, id, ...props }: InputProps) {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-[color:var(--text-strong)] mb-1">
          {label}
        </label>
      )}
      <input
        {...props}
        id={inputId}
        className={clsx(
          "w-full rounded-md border border-[color:var(--line)] px-3 py-2 text-sm shadow-sm bg-[color:var(--bg-surface)] text-[color:var(--text-strong)] placeholder:text-[color:var(--text-muted)] focus:border-[color:var(--focus-ring)] focus:ring-1 focus:ring-[color:var(--focus-ring)] disabled:bg-[color:var(--disabled)] disabled:text-[color:var(--text-muted)]",
          className
        )}
      />
    </div>
  );
}


