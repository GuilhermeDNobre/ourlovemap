import { ReactNode } from 'react';

interface FieldProps {
  label?: string;
  error?: string;
  help?: string;
  children: ReactNode;
  className?: string;
  required?: boolean;
}

export function Field({ label, error, help, children, className = '' }: FieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-semibold tracking-[0.06em] uppercase text-fg-1">{label}</label>
      )}
      {children}
      {(error || help) && (
        <p className={`text-[11px] transition-all duration-200 ease-emphasized ${error ? 'text-olm-error opacity-100 translate-y-0' : 'text-fg-3 opacity-90 translate-y-0'}`}>
          {error ?? help}
        </p>
      )}
    </div>
  );
}
