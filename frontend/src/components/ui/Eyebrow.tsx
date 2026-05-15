import { ReactNode } from 'react';

interface EyebrowProps {
  children: ReactNode;
  className?: string;
}

export function Eyebrow({ children, className = '' }: EyebrowProps) {
  return (
    <span
      className={`block font-sans text-[13px] font-semibold tracking-[0.14em] uppercase text-olm-primary ${className}`}
    >
      {children}
    </span>
  );
}
