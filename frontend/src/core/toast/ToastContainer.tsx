import { FaCheck, FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa';
import { useToast, type ToastKind } from './ToastContext';

const config: Record<ToastKind, { icon: typeof FaCheck; accent: string; border: string }> = {
  success: {
    icon: FaCheck,
    accent: 'bg-green-600 text-white',
    border: 'border-green-600',
  },
  error: {
    icon: FaExclamationTriangle,
    accent: 'bg-red-600 text-white',
    border: 'border-red-600',
  },
  info: {
    icon: FaInfoCircle,
    accent: 'bg-prevca-blue text-white',
    border: 'border-prevca-blue',
  },
};

export const ToastContainer = () => {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        const { icon: Icon, accent, border } = config[toast.kind];
        return (
          <div
            key={toast.id}
            className={`bg-white shadow-2xl border-l-4 ${border} flex items-stretch overflow-hidden pointer-events-auto animate-[slideIn_0.25s_ease-out]`}
            role="alert"
          >
            <div className={`${accent} flex items-center justify-center px-4`}>
              <Icon className="text-lg" />
            </div>
            <div className="flex-1 px-4 py-3">
              {toast.title && (
                <p className="font-ui font-bold uppercase tracking-widest text-[10px] text-prevca-dark mb-0.5">
                  {toast.title}
                </p>
              )}
              <p className="font-body text-sm text-prevca-dark leading-snug">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="px-3 text-gray-400 hover:text-prevca-dark cursor-pointer transition-colors"
              aria-label="Cerrar"
            >
              <FaTimes className="text-xs" />
            </button>
          </div>
        );
      })}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};
