import { ReactNode } from 'react';

type CardVariant = 'light' | 'dark';

interface CardProps {
  variant?: CardVariant;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<CardVariant, string> = {
  light: 'bg-white shadow-md rounded-lg',
  dark: 'bg-olm-dark-800 border border-[rgba(251,245,240,0.08)] rounded-lg',
};

export function Card({ variant = 'light', children, className = '' }: CardProps) {
  return (
    <div className={`${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
}
