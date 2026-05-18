import { Link } from 'react-router-dom';
import { FaBoxes, FaCheckCircle, FaClock, FaShoppingCart } from 'react-icons/fa';
import { useProductsList } from '@/features/products/hooks/useProducts';
import { useOrdersList } from '@/features/orders/hooks/useOrders';
import { Card, CardBody } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { DIVISION_LABELS, ORDER_STATUS_LABELS } from '@/types/api';

const StatCard = ({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  accent: 'blue' | 'dark' | 'yellow' | 'green';
}) => {
  const accentClasses: Record<typeof accent, string> = {
    blue: 'bg-prevca-blue text-white',
    dark: 'bg-prevca-dark text-white',
    yellow: 'bg-yellow-500 text-white',
    green: 'bg-green-600 text-white',
  };

  return (
    <Card>
      <CardBody>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 flex items-center justify-center ${accentClasses[accent]}`}>
            <Icon className="text-xl" />
          </div>
          <div>
            <p className="text-[10px] font-ui font-bold uppercase tracking-widest text-gray-400">
              {label}
            </p>
            <p className="text-3xl font-display font-extrabold text-prevca-dark mt-1">{value}</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

const formatDate = (ts: { _seconds: number } | undefined) =>
  ts ? new Date(ts._seconds * 1000).toLocaleDateString('es-PE') : '—';

export const DashboardPage = () => {
  const products = useProductsList({ pageSize: 100 });
  const ordersAll = useOrdersList({ pageSize: 100 });
  const ordersPending = useOrdersList({ status: 'PENDIENTE', pageSize: 5 });

  const totalProducts = products.data?.items.length ?? 0;
  const activeProducts = products.data?.items.filter((p) => p.isActive).length ?? 0;
  const totalOrders = ordersAll.data?.items.length ?? 0;
  const pendingCount = ordersAll.data?.items.filter((o) => o.status === 'PENDIENTE').length ?? 0;

  const isLoading = products.isLoading || ordersAll.isLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Resumen general"
        title="Dashboard"
        description="Panorama rápido del estado del catálogo y las cotizaciones recibidas."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Productos totales" value={totalProducts} icon={FaBoxes} accent="blue" />
        <StatCard label="Productos activos" value={activeProducts} icon={FaCheckCircle} accent="green" />
        <StatCard label="Cotizaciones totales" value={totalOrders} icon={FaShoppingCart} accent="dark" />
        <StatCard label="Pendientes" value={pendingCount} icon={FaClock} accent="yellow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-display font-extrabold uppercase tracking-widest text-prevca-dark text-sm">
              Cotizaciones recientes
            </h3>
            <Link
              to="/orders"
              className="text-xs font-ui font-bold uppercase tracking-widest text-prevca-blue hover:underline"
            >
              Ver todas →
            </Link>
          </div>
          <CardBody>
            {ordersPending.data && ordersPending.data.items.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {ordersPending.data.items.map((order) => (
                  <li key={order.id} className="py-3">
                    <Link
                      to={`/orders/${order.id}`}
                      className="flex justify-between items-center hover:bg-gray-50 px-2 py-1 -mx-2 transition-colors"
                    >
                      <div>
                        <p className="font-display font-bold text-prevca-dark text-sm">
                          {order.customer.name}
                        </p>
                        <p className="text-xs text-gray-400 font-mono">{order.code}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="yellow">{ORDER_STATUS_LABELS[order.status]}</Badge>
                        <p className="text-[10px] text-gray-400 mt-1">{formatDate(order.createdAt)}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 font-body py-8 text-center">
                No hay cotizaciones pendientes.
              </p>
            )}
          </CardBody>
        </Card>

        <Card>
          <div className="p-6 border-b border-gray-200">
            <h3 className="font-display font-extrabold uppercase tracking-widest text-prevca-dark text-sm">
              Productos por división
            </h3>
          </div>
          <CardBody>
            <ul className="space-y-3">
              {Object.entries(DIVISION_LABELS).map(([division, label]) => {
                const count =
                  products.data?.items.filter((p) => p.division === division).length ?? 0;
                return (
                  <li
                    key={division}
                    className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-0"
                  >
                    <span className="font-ui font-bold uppercase tracking-widest text-sm text-prevca-dark">
                      {label}
                    </span>
                    <span className="font-display font-extrabold text-2xl text-prevca-blue">
                      {count}
                    </span>
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
