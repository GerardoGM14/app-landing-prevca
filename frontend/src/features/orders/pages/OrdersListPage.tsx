import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEye, FaTrash } from 'react-icons/fa';
import { useDeleteOrder, useOrdersList } from '../hooks/useOrders';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { ORDER_STATUS_LABELS, type OrderStatus } from '@/types/api';

const statusBadge: Record<OrderStatus, 'yellow' | 'blue' | 'green' | 'red' | 'gray'> = {
  PENDIENTE: 'yellow',
  CONTACTADO: 'blue',
  COTIZADO: 'blue',
  CERRADO: 'green',
  RECHAZADO: 'red',
};

const formatDate = (ts: { _seconds: number } | undefined) => {
  if (!ts) return '—';
  return new Date(ts._seconds * 1000).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const OrdersListPage = () => {
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const { data, isLoading, error } = useOrdersList({
    status: status || undefined,
    pageSize: 50,
  });

  const deleteOrder = useDeleteOrder();

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`¿Eliminar la cotización ${code}?`)) return;
    await deleteOrder.mutateAsync(id);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Comercial"
        title="Cotizaciones"
        description="Solicitudes de cotización recibidas desde la landing y la tienda virtual."
      />

      <Card className="mb-6">
        <div className="p-4 md:p-6">
          <div className="w-full md:w-64">
            <Select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus | '')}>
              <option value="">Todos los estados</option>
              {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-body p-4">
          Error: {(error as Error).message}
        </div>
      )}

      {data && (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead className="bg-prevca-dark text-white">
              <tr>
                <th className="text-left px-6 py-4 font-ui font-bold uppercase tracking-widest text-[10px]">
                  Código
                </th>
                <th className="text-left px-6 py-4 font-ui font-bold uppercase tracking-widest text-[10px]">
                  Cliente
                </th>
                <th className="text-center px-6 py-4 font-ui font-bold uppercase tracking-widest text-[10px]">
                  Ítems
                </th>
                <th className="text-center px-6 py-4 font-ui font-bold uppercase tracking-widest text-[10px]">
                  Estado
                </th>
                <th className="text-left px-6 py-4 font-ui font-bold uppercase tracking-widest text-[10px]">
                  Fecha
                </th>
                <th className="text-right px-6 py-4 font-ui font-bold uppercase tracking-widest text-[10px]">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-xs text-prevca-blue font-bold">
                    {order.code}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-display font-bold text-prevca-dark">{order.customer.name}</p>
                    <p className="text-xs text-gray-400">{order.customer.email}</p>
                  </td>
                  <td className="px-6 py-4 text-center">{order.items.length}</td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant={statusBadge[order.status]}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-600">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-1 justify-end">
                      <Link
                        to={`/orders/${order.id}`}
                        className="p-2 text-prevca-blue hover:bg-prevca-blue/10"
                        title="Ver detalle"
                      >
                        <FaEye />
                      </Link>
                      <button
                        type="button"
                        onClick={() => void handleDelete(order.id, order.code)}
                        className="p-2 text-red-500 hover:bg-red-50 cursor-pointer"
                        title="Eliminar"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-gray-400 font-body">
                    No hay cotizaciones todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};
