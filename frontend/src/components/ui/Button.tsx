import { motion } from 'framer-motion';
import { ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'premium' | 'ghost' | 'text';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-[13px]',
  md: 'px-5 py-[11px] text-[14px]',
  lg: 'px-[26px] py-[14px] text-base',
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-olm-primary text-white shadow-glow-primary',
  secondary: 'bg-transparent text-olm-title border-[1.5px] border-solid border-olm-title',
  premium: 'bg-olm-dark-800 text-white border-[1.5px] border-solid border-olm-accent shadow-glow-accent',
  ghost: 'bg-transparent text-olm-title hover:bg-olm-surface-soft hover:text-olm-primary focus-visible:ring-2 focus-visible:ring-olm-accent focus-visible:ring-offset-2 focus-visible:outline-none',
  text: 'bg-transparent text-olm-primary p-0',
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  type = 'button',
  disabled = false,
  className = '',
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
      className={[
        'font-sans font-semibold rounded-pill inline-flex items-center gap-2 cursor-pointer',
        'tracking-[-0.01em] transition-colors duration-150',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizeClasses[size],
        variantClasses[variant],
        className,
      ].join(' ')}
    >
      {children}
    </motion.button>
  );
}
