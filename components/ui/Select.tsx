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
        <label htmlFor={selectId} className="block text-sm font-medium text-neutral-700 mb-1">
          {label}
        </label>
      )}
      <select
        {...props}
        id={selectId}
        className={clsx(
          "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-brand focus:ring-1 focus:ring-brand",
          className
        )}
      >
        {children}
      </select>
    </div>
  );
}


