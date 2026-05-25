import type { Ref, TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  ref?: Ref<HTMLTextAreaElement>;
}

export const Textarea = ({
  ref,
  label,
  error,
  hint,
  className = '',
  id,
  name,
  rows = 4,
  ...props
}: TextareaProps) => {
  const textareaId = id ?? name;
  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-xs font-ui font-bold uppercase tracking-widest text-gray-500"
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        name={name}
        rows={rows}
        className={`w-full border border-gray-300 bg-white px-4 py-3 text-sm font-body text-prevca-dark placeholder:text-gray-400 focus:outline-none focus:border-prevca-blue focus:ring-1 focus:ring-prevca-blue transition-colors resize-none ${error ? 'border-red-400' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600 font-body">{error}</p>}
      {!error && hint && <p className="text-xs text-gray-500 font-body">{hint}</p>}
    </div>
  );
};
