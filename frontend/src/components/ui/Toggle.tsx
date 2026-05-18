import type { Ref } from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

export const Toggle = ({ ref, checked, onChange, label, description, disabled }: ToggleProps) => (
  <div className="flex items-center justify-between gap-4 py-2">
    <div className="flex-1">
      <p className="text-sm font-ui font-bold text-prevca-dark">{label}</p>
      {description && <p className="text-xs text-gray-500 font-body mt-1">{description}</p>}
    </div>
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 flex-shrink-0 border-2 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'bg-prevca-blue border-prevca-blue' : 'bg-gray-200 border-gray-300'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 bg-white transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
);
