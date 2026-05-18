import type { ButtonHTMLAttributes, Ref } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-prevca-blue text-white border-prevca-blue hover:bg-prevca-blue-dark hover:border-prevca-blue-dark',
  secondary: 'bg-prevca-dark text-white border-prevca-dark hover:bg-black hover:border-black',
  outline:
    'bg-white text-prevca-blue border-prevca-blue hover:bg-prevca-blue hover:text-white',
  ghost: 'bg-transparent text-prevca-dark border-transparent hover:bg-gray-100',
  danger: 'bg-red-600 text-white border-red-600 hover:bg-red-700 hover:border-red-700',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'py-2 px-4 text-xs',
  md: 'py-3 px-6 text-sm',
  lg: 'py-4 px-10 text-sm',
};

export const Button = ({
  ref,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) => (
  <button
    ref={ref}
    disabled={disabled || loading}
    className={`inline-flex items-center justify-center gap-2 border-2 font-ui font-bold uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    {...props}
  >
    {loading && (
      <span
        className="inline-block border-2 border-current border-r-transparent rounded-full animate-spin"
        style={{ width: 14, height: 14 }}
      />
    )}
    {children}
  </button>
);
