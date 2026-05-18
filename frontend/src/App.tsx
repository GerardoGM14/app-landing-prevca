import { AuthProvider } from '@/core/auth/AuthContext';
import { ToastProvider } from '@/core/toast/ToastContext';
import { ToastContainer } from '@/core/toast/ToastContainer';
import { AppRouter } from '@/router';

export const App = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppRouter />
        <ToastContainer />
      </AuthProvider>
    </ToastProvider>
  );
};
