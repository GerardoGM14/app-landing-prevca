import { NavLink } from 'react-router-dom';
import { FaBoxes, FaShoppingCart, FaTags, FaTachometerAlt } from 'react-icons/fa';

const navItems = [
  { to: '/', label: 'Dashboard', icon: FaTachometerAlt, end: true },
  { to: '/products', label: 'Productos', icon: FaBoxes },
  { to: '/categories', label: 'Categorías', icon: FaTags },
  { to: '/orders', label: 'Cotizaciones', icon: FaShoppingCart },
];

export const Sidebar = () => (
  <aside className="fixed inset-y-0 left-0 w-64 bg-prevca-dark text-white hidden lg:flex flex-col z-30">
    <div className="p-6 border-b border-white/10 flex items-center gap-3">
      <div className="w-8 h-8 bg-white text-prevca-dark font-extrabold flex items-center justify-center font-display">
        P
      </div>
      <div>
        <p className="font-display font-extrabold tracking-widest text-sm leading-tight">
          GRUPO PREVCA
        </p>
        <p className="text-[10px] text-white/50 font-ui uppercase tracking-widest">
          Panel Admin
        </p>
      </div>
    </div>

    <nav className="flex-1 py-6">
      {navItems.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex items-center gap-4 px-6 py-3 text-sm font-ui font-semibold transition-colors border-l-4 ${
              isActive
                ? 'bg-prevca-blue text-white border-white'
                : 'text-white/70 hover:bg-white/5 hover:text-white border-transparent'
            }`
          }
        >
          <Icon className="text-base flex-shrink-0" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>

    <div className="p-6 text-[10px] text-white/30 font-ui uppercase tracking-widest border-t border-white/5">
      Versión 0.0.1
    </div>
  </aside>
);
