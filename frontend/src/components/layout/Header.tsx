import { FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '@/core/auth/AuthContext';
import { Button } from '@/components/ui/Button';

export const Header = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 md:px-10 py-4 flex justify-between items-center gap-6">
      <div>
        <p className="text-[10px] font-ui uppercase tracking-widest text-gray-400">
          Sesión activa
        </p>
        <p className="text-sm font-body text-prevca-dark font-semibold">{user?.email}</p>
      </div>

      <div className="hidden md:flex items-center gap-6">
        <div className="text-right">
          <p className="text-[10px] font-ui uppercase tracking-widest text-gray-400">
            Desarrollado por
          </p>
          <p className="text-sm font-display font-extrabold tracking-widest text-prevca-blue">
            TRIGRA
          </p>
        </div>
        <div className="h-10 w-px bg-gray-200" />
        <Button variant="ghost" size="sm" onClick={() => void signOut()}>
          <FaSignOutAlt />
          Cerrar sesión
        </Button>
      </div>

      <div className="md:hidden">
        <Button variant="ghost" size="sm" onClick={() => void signOut()}>
          <FaSignOutAlt />
        </Button>
      </div>
    </header>
  );
};
