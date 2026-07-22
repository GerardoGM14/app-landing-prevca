import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaArrowLeft, FaCheck, FaTimes } from 'react-icons/fa';
import { useOrder, useUpdateOrder } from '../hooks/useOrders';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/core/toast/ToastContext';
import {
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PERU_DEPARTMENT_LABELS,
  WOOD_TYPE_LABELS,
  type OrderStatus,
  type PaymentStatus,
} from '@/types/api';

const formatDateTime = (ts: { _seconds: number } | null | undefined) => {
  if (!ts) return '—';
  return new Date(ts._seconds * 1000).toLocaleString('es-PE', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
};

const formatMoney = (n: number | null) =>
  n === null ? '—' : `S/ ${n.toFixed(2)}`;

export const OrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading, error } = useOrder(id);
  const update = useUpdateOrder(id ?? '');
  const toast = useToast();

  const [status, setStatus] = useState<OrderStatus>('PENDIENTE');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('NONE');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (order) {
      setStatus(order.status);
      setPaymentStatus(order.paymentStatus);
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
        No se pudo cargar la orden.
      </div>
    );
  }

  const isCheckout = order.paymentMethod !== 'QUOTE';

  const handleSave = async () => {
    try {
      await update.mutateAsync({
        status,
        paymentStatus: isCheckout ? paymentStatus : undefined,
        internalNotes: notes || null,
      });
      toast.success('Cambios guardados correctamente.', 'Orden actualizada');
    } catch (err) {
      toast.error((err as Error).message, 'No se pudo guardar');
    }
  };

  const handleApprovePayment = async () => {
    try {
      await update.mutateAsync({ paymentStatus: 'PAID' });
      toast.success('Pago aprobado. Status: Pagado.', 'Pago validado');
    } catch (err) {
      toast.error((err as Error).message, 'No se pudo aprobar');
    }
  };

  const handleRejectPayment = async () => {
    if (!confirm('¿Rechazar este pago? El cliente deberá subir una nueva captura.')) return;
    try {
      await update.mutateAsync({ paymentStatus: 'REJECTED' });
      toast.success('Pago rechazado.', 'Acción registrada');
    } catch (err) {
      toast.error((err as Error).message, 'No se pudo rechazar');
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow={`${isCheckout ? 'Pedido' : 'Cotización'} · ${order.code}`}
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
        {/* === Columna izquierda: cliente, items, pago === */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h3 className="font-display font-extrabold uppercase tracking-widest text-prevca-dark text-sm">
                Datos del cliente
              </h3>
            </CardHeader>
            <CardBody className="space-y-3 text-sm font-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
              {order.message && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400">Mensaje</p>
                  <p className="text-prevca-dark whitespace-pre-line">{order.message}</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Envío y facturación (solo si es checkout) */}
          {isCheckout && order.shipping && (
            <Card>
              <CardHeader>
                <h3 className="font-display font-extrabold uppercase tracking-widest text-prevca-dark text-sm">
                  Dirección de envío
                </h3>
              </CardHeader>
              <CardBody className="space-y-3 text-sm font-body">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400">Departamento</p>
                    <p className="text-prevca-dark font-semibold">
                      {PERU_DEPARTMENT_LABELS[order.shipping.department]}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400">Provincia</p>
                    <p className="text-prevca-dark">{order.shipping.province}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400">Distrito</p>
                    <p className="text-prevca-dark">{order.shipping.district}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400">Dirección</p>
                  <p className="text-prevca-dark">{order.shipping.address}</p>
                </div>
                {order.shipping.reference && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400">Referencia</p>
                    <p className="text-prevca-dark">{order.shipping.reference}</p>
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {isCheckout && order.billing && (
            <Card>
              <CardHeader>
                <h3 className="font-display font-extrabold uppercase tracking-widest text-prevca-dark text-sm">
                  Facturación
                </h3>
              </CardHeader>
              <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-body">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400">Comprobante</p>
                  <p className="text-prevca-dark font-semibold">{order.billing.receiptType}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400">Documento</p>
                  <p className="text-prevca-dark">
                    {order.billing.documentType} · {order.billing.documentNumber}
                  </p>
                </div>
                {order.billing.businessName && (
                  <div className="md:col-span-2">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400">Razón social</p>
                    <p className="text-prevca-dark">{order.billing.businessName}</p>
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader>
              <h3 className="font-display font-extrabold uppercase tracking-widest text-prevca-dark text-sm">
                Productos solicitados ({order.items.length})
              </h3>
            </CardHeader>
            <CardBody>
              <ul className="divide-y divide-gray-200">
                {order.items.map((item, idx) => (
                  <li
                    key={`${item.productId}-${item.woodType ?? 'base'}-${idx}`}
                    className="py-3 flex justify-between items-start gap-4"
                  >
                    <div>
                      <p className="font-display font-bold text-prevca-dark">{item.titleSnapshot}</p>
                      {item.woodType && (
                        <p className="text-sm font-ui font-bold text-prevca-blue mt-1">
                          Madera: {WOOD_TYPE_LABELS[item.woodType]}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 font-mono mt-1">{item.productId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-ui font-bold text-prevca-dark">
                        Cantidad: {item.quantity}
                      </p>
                      {item.priceSnapshot !== null && (
                        <p className="text-xs text-gray-500 mt-1">
                          {formatMoney(item.priceSnapshot)} c/u
                        </p>
                      )}
                      {item.lineTotal !== null && (
                        <p className="text-sm font-bold text-prevca-blue mt-1">
                          {formatMoney(item.lineTotal)}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              {isCheckout && order.total !== null && (
                <div className="mt-6 pt-4 border-t border-gray-200 space-y-2 text-sm font-body">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-prevca-dark">{formatMoney(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Envío</span>
                    <span className="text-prevca-dark">{formatMoney(order.shippingCost)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-100">
                    <span className="font-ui font-bold uppercase tracking-widest text-prevca-dark">
                      Total
                    </span>
                    <span className="font-display font-extrabold text-xl text-prevca-blue">
                      {formatMoney(order.total)}
                    </span>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Captura de pago (Yape/Transferencia) */}
          {isCheckout && order.payment.proofUrl && (
            <Card>
              <CardHeader>
                <h3 className="font-display font-extrabold uppercase tracking-widest text-prevca-dark text-sm">
                  Captura de pago subida por el cliente
                </h3>
              </CardHeader>
              <CardBody className="space-y-4">
                <a href={order.payment.proofUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <img
                    src={order.payment.proofUrl}
                    alt="Captura de pago"
                    className="max-w-md mx-auto border border-gray-200"
                  />
                </a>
                <p className="text-xs text-gray-500 font-body text-center">
                  Subida el {formatDateTime(order.payment.reportedAt)}
                </p>

                {order.paymentStatus === 'PENDING_VERIFICATION' && (
                  <div className="flex gap-3 justify-center pt-2">
                    <Button onClick={() => void handleApprovePayment()} loading={update.isPending}>
                      <FaCheck />
                      Aprobar pago
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => void handleRejectPayment()}
                      loading={update.isPending}
                    >
                      <FaTimes />
                      Rechazar
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </div>

        {/* === Columna derecha: gestión === */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="font-display font-extrabold uppercase tracking-widest text-prevca-dark text-sm">
                Estado general
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
            </CardBody>
          </Card>

          {isCheckout && (
            <Card>
              <CardHeader>
                <h3 className="font-display font-extrabold uppercase tracking-widest text-prevca-dark text-sm">
                  Pago
                </h3>
              </CardHeader>
              <CardBody className="space-y-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Método</p>
                  <p className="text-prevca-dark font-semibold">
                    {PAYMENT_METHOD_LABELS[order.paymentMethod]}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">
                    Status del pago
                  </p>
                  <Badge variant={order.paymentStatus === 'PAID' ? 'green' : 'yellow'}>
                    {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                  </Badge>
                </div>
                {order.payment.transactionId && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400">
                      ID transacción
                    </p>
                    <p className="text-xs font-mono text-prevca-dark break-all">
                      {order.payment.transactionId}
                    </p>
                  </div>
                )}
                {order.payment.paidAt && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400">
                      Pagado el
                    </p>
                    <p className="text-xs text-prevca-dark">
                      {formatDateTime(order.payment.paidAt)}
                    </p>
                  </div>
                )}
                <Select
                  label="Cambiar status de pago"
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                >
                  {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader>
              <h3 className="font-display font-extrabold uppercase tracking-widest text-prevca-dark text-sm">
                Notas internas
              </h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <Textarea
                label=""
                rows={6}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas privadas del asesor (no visibles al cliente)..."
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
