import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/core/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';

export const LoginPage = () => {
  const { user, isAdmin, isLoading, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get('error') === 'not-admin'
      ? 'Esta cuenta no tiene permisos de administrador.'
      : null,
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-prevca-dark">
        <Spinner />
      </div>
    );
  }
  if (user && isAdmin) return <Navigate to="/" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
      navigate('/', { replace: true });
    } catch {
      setError('Credenciales inválidas. Verifique su correo y contraseña.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-prevca-dark relative overflow-hidden p-6">
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="relative bg-white w-full max-w-md p-10 md:p-12 border-t-4 border-prevca-blue shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-prevca-dark text-white font-extrabold flex items-center justify-center font-display">
            P
          </div>
          <span className="text-lg font-display font-extrabold tracking-widest text-prevca-dark">
            GRUPO PREVCA
          </span>
        </div>

        <h1 className="text-2xl md:text-3xl font-display font-extrabold uppercase tracking-tighter text-prevca-dark mb-2">
          Panel Administrativo
        </h1>
        <div className="w-12 h-1.5 bg-prevca-blue mb-6" />
        <p className="text-sm text-gray-500 font-body mb-8 leading-relaxed">
          Acceso restringido. Ingrese sus credenciales para administrar el catálogo del ecommerce.
        </p>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-body p-4 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          <Input
            label="Correo electrónico"
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="admin@grupoprevca.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Contraseña"
            type="password"
            name="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" className="w-full mt-6" loading={submitting}>
            Iniciar sesión
          </Button>
        </form>

        <p className="text-[10px] text-center text-gray-400 font-ui uppercase tracking-widest mt-8">
          Grupo Prevca · Sistema de gestión
        </p>
      </div>
    </div>
  );
};
