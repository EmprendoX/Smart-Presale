import { SelectHTMLAttributes } from "react";
import { clsx } from "clsx";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

export function Select({ label, className, id, children, ...props }: SelectProps) {
  const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-[color:var(--text-strong)] mb-1">
          {label}
        </label>
      )}
      <select
        {...props}
        id={selectId}
        className={clsx(
          "w-full rounded-md border border-[color:var(--line)] px-3 py-2 text-sm shadow-sm bg-[color:var(--bg-surface)] text-[color:var(--text-strong)] focus:border-[color:var(--focus-ring)] focus:ring-1 focus:ring-[color:var(--focus-ring)] disabled:bg-[color:var(--disabled)] disabled:text-[color:var(--text-muted)]",
          className
        )}
      >
        {children}
      </select>
    </div>
  );
}


