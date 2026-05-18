import type { InputHTMLAttributes, Ref } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  ref?: Ref<HTMLInputElement>;
}

export const Input = ({
  ref,
  label,
  error,
  hint,
  className = '',
  id,
  name,
  ...props
}: InputProps) => {
  const inputId = id ?? name;
  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-ui font-bold uppercase tracking-widest text-gray-500"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        name={name}
        className={`w-full border border-gray-300 bg-white px-4 py-3 text-sm font-body text-prevca-dark placeholder:text-gray-400 focus:outline-none focus:border-prevca-blue focus:ring-1 focus:ring-prevca-blue transition-colors ${error ? 'border-red-400' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600 font-body">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400 font-body">{hint}</p>}
    </div>
  );
};
