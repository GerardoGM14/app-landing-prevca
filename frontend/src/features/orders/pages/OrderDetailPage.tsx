import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { useOrder, useUpdateOrder } from '../hooks/useOrders';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/core/toast/ToastContext';
import { ORDER_STATUS_LABELS, type OrderStatus } from '@/types/api';

const formatDateTime = (ts: { _seconds: number } | undefined) => {
  if (!ts) return '—';
  return new Date(ts._seconds * 1000).toLocaleString('es-PE', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
};

export const OrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading, error } = useOrder(id);
  const update = useUpdateOrder(id ?? '');
  const toast = useToast();

  const [status, setStatus] = useState<OrderStatus>('PENDIENTE');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (order) {
      setStatus(order.status);
      setNotes(order.internalNotes ?? '');
    }
  }, [order]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-body p-4">
        No se pudo cargar la cotización.
      </div>
    );
  }

  const handleSave = async () => {
    try {
      await update.mutateAsync({ status, internalNotes: notes || null });
      toast.success('Cambios guardados correctamente.', 'Cotización actualizada');
    } catch (err) {
      toast.error((err as Error).message, 'No se pudo guardar');
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow={`Cotización · ${order.code}`}
        title={order.customer.name}
        description={`Recibida el ${formatDateTime(order.createdAt)}`}
        actions={
          <Link to="/orders">
            <Button variant="outline" size="sm">
              <FaArrowLeft />
              Volver
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h3 className="font-display font-extrabold uppercase tracking-widest text-prevca-dark text-sm">
                Datos del cliente
              </h3>
            </CardHeader>
            <CardBody className="space-y-3 text-sm font-body">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-400">Nombre</p>
                <p className="text-prevca-dark font-semibold">{order.customer.name}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-400">Email</p>
                <p className="text-prevca-dark">{order.customer.email}</p>
              </div>
              {order.customer.phone && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400">Teléfono</p>
                  <p className="text-prevca-dark">{order.customer.phone}</p>
                </div>
              )}
              {order.customer.company && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400">Empresa</p>
                  <p className="text-prevca-dark">{order.customer.company}</p>
                </div>
              )}
              {order.message && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400">Mensaje</p>
                  <p className="text-prevca-dark whitespace-pre-line">{order.message}</p>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-display font-extrabold uppercase tracking-widest text-prevca-dark text-sm">
                Productos solicitados ({order.items.length})
              </h3>
            </CardHeader>
            <CardBody>
              <ul className="divide-y divide-gray-200">
                {order.items.map((item) => (
                  <li key={item.productId} className="py-3 flex justify-between items-start gap-4">
                    <div>
                      <p className="font-display font-bold text-prevca-dark">{item.titleSnapshot}</p>
                      <p className="text-xs text-gray-400 font-mono mt-1">{item.productId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-ui font-bold text-prevca-dark">
                        Cantidad: {item.quantity}
                      </p>
                      {item.priceSnapshot !== null && (
                        <p className="text-xs text-gray-500 mt-1">
                          S/. {item.priceSnapshot.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="font-display font-extrabold uppercase tracking-widest text-prevca-dark text-sm">
                Gestión
              </h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">
                  Estado actual
                </p>
                <Badge variant="blue">{ORDER_STATUS_LABELS[order.status]}</Badge>
              </div>
              <Select
                label="Cambiar estado"
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
              >
                {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              <Textarea
                label="Notas internas"
                rows={6}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas privadas del asesor..."
              />
              <Button onClick={() => void handleSave()} loading={update.isPending} className="w-full">
                Guardar cambios
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
