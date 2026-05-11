import { motion } from 'framer-motion';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, disabled = false }: ToggleProps) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={[
          'relative w-11 h-6 rounded-pill transition-colors duration-150',
          checked ? 'bg-olm-primary' : 'bg-olm-surface',
          disabled ? 'opacity-50 cursor-not-allowed' : '',
        ].join(' ')}
      >
        <motion.span
          className="absolute top-[2px] left-[2px] w-5 h-5 rounded-full bg-white shadow-sm"
          animate={{ x: checked ? 20 : 0 }}
          transition={{ duration: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
        />
      </button>
      {label && <span className="text-sm text-fg-2">{label}</span>}
    </label>
  );
}
