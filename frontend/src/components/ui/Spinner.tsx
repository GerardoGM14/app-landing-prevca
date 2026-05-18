interface SpinnerProps {
  size?: number;
  className?: string;
}

export const Spinner = ({ size = 32, className = '' }: SpinnerProps) => (
  <div className={`spinner ${className}`} style={{ width: size, height: size }} />
);
