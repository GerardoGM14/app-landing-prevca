import type { Ref, SelectHTMLAttributes } from 'react';
import { FaChevronDown } from 'react-icons/fa';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  ref?: Ref<HTMLSelectElement>;
}

export const Select = ({
  ref,
  label,
  error,
  className = '',
  id,
  name,
  children,
  ...props
}: SelectProps) => {
  const selectId = id ?? name;
  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-ui font-bold uppercase tracking-widest text-gray-500"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          name={name}
          className={`w-full appearance-none border border-gray-300 bg-white px-4 py-3 pr-10 text-sm font-body text-prevca-dark focus:outline-none focus:border-prevca-blue focus:ring-1 focus:ring-prevca-blue transition-colors cursor-pointer ${error ? 'border-red-400' : ''} ${className}`}
          {...props}
        >
          {children}
        </select>
        <FaChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-prevca-blue text-xs" />
      </div>
      {error && <p className="text-xs text-red-600 font-body">{error}</p>}
    </div>
  );
};
