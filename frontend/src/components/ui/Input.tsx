import { InputHTMLAttributes } from 'react';
import { Field } from './Field';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  help?: string;
  onChange?: (value: string) => void;
}

export function Input({ label, error, help, onChange, className = '', ...rest }: InputProps) {
  return (
    <Field label={label} error={error} help={help}>
      <input
        {...rest}
        onChange={(e) => onChange?.(e.target.value)}
        className={[
          'w-full font-sans text-sm px-[14px] py-[11px] rounded-md bg-olm-bg-elevated text-fg-2',
          'outline-none transition-all duration-150 shadow-[var(--sh-xs)]',
          error
            ? 'border-[1.5px] border-solid border-olm-error'
            : 'border-[1.5px] border-solid border-olm-surface focus:border-olm-accent focus:shadow-[var(--sh-sm)]',
          className,
        ].join(' ')}
      />
    </Field>
  );
}
