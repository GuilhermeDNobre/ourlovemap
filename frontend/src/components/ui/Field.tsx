import { ReactNode } from 'react';

interface FieldProps {
  label?: string;
  error?: string;
  help?: string;
  children: ReactNode;
  className?: string;
}

export function Field({ label, error, help, children, className = '' }: FieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-semibold text-fg-1">{label}</label>
      )}
      {children}
      {(error || help) && (
        <p className={`text-[11px] ${error ? 'text-olm-error' : 'text-fg-3'}`}>
          {error ?? help}
        </p>
      )}
    </div>
  );
}
