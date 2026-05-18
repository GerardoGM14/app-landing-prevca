import type { HTMLAttributes } from 'react';

type BadgeVariant = 'blue' | 'dark' | 'gray' | 'green' | 'red' | 'yellow';

const variantClasses: Record<BadgeVariant, string> = {
  blue: 'bg-prevca-blue/10 text-prevca-blue',
  dark: 'bg-prevca-dark/10 text-prevca-dark',
  gray: 'bg-gray-100 text-gray-600',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  yellow: 'bg-yellow-100 text-yellow-700',
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export const Badge = ({ variant = 'gray', className = '', children, ...props }: BadgeProps) => (
  <span
    className={`inline-flex items-center text-[10px] font-ui font-bold uppercase tracking-wider px-2 py-1 ${variantClasses[variant]} ${className}`}
    {...props}
  >
    {children}
  </span>
);
