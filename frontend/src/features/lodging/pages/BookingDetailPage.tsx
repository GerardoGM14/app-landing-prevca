import { useEffect, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Spinner } from '@/components/ui/Spinner';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/core/toast/ToastContext';
import type { FirestoreTimestamp } from '@/types/api';
import { useBooking, useCancelBooking, useUpdateBooking } from '../hooks/useLodging';
import {
  BOOKING_PAYMENT_BADGE,
  BOOKING_PAYMENT_METHOD_LABELS,
  BOOKING_PAYMENT_STATUS_LABELS,
  BOOKING_STATUS_BADGE,
  BOOKING_STATUS_LABELS,
} from '../types';
import { formatDay, formatMoney } from '../utils/dates';

const formatDateTime = (ts: FirestoreTimestamp | null | undefined) =>
  ts
    ? new Date(ts._seconds * 1000).toLocaleString('es-PE', { dateStyle: 'long', timeStyle: 'short' })
    : '—';

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex justify-between gap-4 py-2 border-b border-gray-100 last:border-0 text-sm font-body">
    <span className="text-gray-500">{label}</span>
    <span className="text-prevca-dark font-semibold text-right">{children}</span>
  </div>
);

const SectionTitle = ({ children }: { children: ReactNode }) => (
  <h2 className="font-display font-extrabold uppercase tracking-widest text-sm text-prevca-dark">{children}</h2>
);

export const BookingDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const { data: booking, isLoading, error } = useBooking(id);
  const update = useUpdateBooking(id ?? '');
  const cancel = useCancelBooking(id ?? '');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setNotes(booking?.internalNotes ?? '');
  }, [booking?.internalNotes]);

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>;
  if (error || !booking) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-body p-4">
        Error: {(error as Error | null)?.message ?? 'Reserva no encontrada'}
      </div>
    );
  }

  const act = async (action: () => Promise<unknown>, message: string) => {
    try {
      await action();
      toast.success(message);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const onCancel = () => {
    const reason = prompt(
      `¿Cancelar la reserva ${booking.code}? Sus noches quedarán libres.\n\nMotivo (opcional):`,
    );
    if (reason === null) return;
    void act(() => cancel.mutateAsync(reason || null), 'Reserva cancelada');
  };

  const canCancel = booking.status !== 'CANCELADA' && booking.status !== 'EXPIRADA';
  const canRefund = booking.paymentStatus === 'PAID';
  const canMarkPaid = booking.paymentMethod === 'MANUAL' && booking.paymentStatus === 'PENDING';

  return (
    <div>
      <Link to="/bookings" className="inline-flex items-center gap-2 text-xs font-ui font-bold uppercase tracking-widest text-prevca-blue mb-6 hover:underline">
        <FaArrowLeft /> Volver a reservas
      </Link>
      <PageHeader
        eyebrow={`Reserva · ${booking.source === 'WEB' ? 'Web' : 'Registrada en el admin'}`}
        title={booking.code}
        actions={
          <>
            <Badge variant={BOOKING_STATUS_BADGE[booking.status]} className="text-xs px-3 py-2">
              {BOOKING_STATUS_LABELS[booking.status]}
            </Badge>
            <Badge variant={BOOKING_PAYMENT_BADGE[booking.paymentStatus]} className="text-xs px-3 py-2">
              {BOOKING_PAYMENT_STATUS_LABELS[booking.paymentStatus]}
            </Badge>
          </>
        }
      />

      {booking.status === 'REVISAR' && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-body p-4 mb-6">
          El huésped pagó, pero cuando llegó el pago alguna de sus noches ya estaba ocupada. Comuníquese con él para devolverle el dinero o reubicarlo, y luego cancele la reserva.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><SectionTitle>Estadía</SectionTitle></CardHeader>
            <CardBody>
              <Row label="Departamento">{booking.productTitle}</Row>
              <Row label="Llegada">{formatDay(booking.checkIn)}</Row>
              <Row label="Salida">{formatDay(booking.checkOut)}</Row>
              <Row label="Noches">{booking.nights}</Row>
              <Row label="Huéspedes">{booking.guests}</Row>
              {booking.notes && <Row label="Comentario del huésped">{booking.notes}</Row>}
            </CardBody>
          </Card>

          <Card>
            <CardHeader><SectionTitle>Detalle por noche</SectionTitle></CardHeader>
            <CardBody>
              {booking.nightly.map((n) => (
                <Row key={n.date} label={formatDay(n.date)}>{formatMoney(n.price)}</Row>
              ))}
              <div className="flex justify-between pt-3 text-base font-display font-extrabold text-prevca-dark">
                <span>Total</span>
                <span>{formatMoney(booking.total)}</span>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><SectionTitle>Notas internas</SectionTitle></CardHeader>
            <CardBody className="space-y-3">
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Solo las ve el equipo." />
              <Button
                size="sm"
                variant="outline"
                loading={update.isPending}
                onClick={() => void act(() => update.mutateAsync({ internalNotes: notes || null }), 'Notas guardadas')}
              >
                Guardar notas
              </Button>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><SectionTitle>Huésped</SectionTitle></CardHeader>
            <CardBody>
              <Row label="Nombre">{booking.customer.name}</Row>
              <Row label="Teléfono">{booking.customer.phone}</Row>
              <Row label="Correo">{booking.customer.email ?? '—'}</Row>
              <Row label="Documento">
                {booking.customer.documentNumber ? `${booking.customer.documentType} ${booking.customer.documentNumber}` : '—'}
              </Row>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><SectionTitle>Pago</SectionTitle></CardHeader>
            <CardBody>
              <Row label="Método">{BOOKING_PAYMENT_METHOD_LABELS[booking.paymentMethod]}</Row>
              <Row label="Estado">{BOOKING_PAYMENT_STATUS_LABELS[booking.paymentStatus]}</Row>
              <Row label="Pagado el">{formatDateTime(booking.paidAt)}</Row>
              {booking.transactionId && <Row label="N° de operación">{booking.transactionId}</Row>}
              <Row label="Creada el">{formatDateTime(booking.createdAt)}</Row>
              {booking.status === 'CANCELADA' && (
                <>
                  <Row label="Cancelada el">{formatDateTime(booking.cancelledAt)}</Row>
                  {booking.cancelReason && <Row label="Motivo">{booking.cancelReason}</Row>}
                </>
              )}
            </CardBody>
          </Card>

          {(canMarkPaid || canRefund || canCancel) && (
            <Card>
              <CardHeader><SectionTitle>Acciones</SectionTitle></CardHeader>
              <CardBody className="space-y-3">
                {canMarkPaid && (
                  <Button
                    className="w-full"
                    loading={update.isPending}
                    onClick={() => void act(() => update.mutateAsync({ paymentStatus: 'PAID' }), 'Marcada como cobrada')}
                  >
                    Marcar como cobrada
                  </Button>
                )}
                {canRefund && (
                  <Button
                    variant="outline"
                    className="w-full"
                    loading={update.isPending}
                    onClick={() => {
                      if (!confirm('¿Registrar que ya se devolvió el dinero al huésped? (La devolución se hace por fuera, en la pasarela o por transferencia.)')) return;
                      void act(() => update.mutateAsync({ paymentStatus: 'REFUNDED' }), 'Devolución registrada');
                    }}
                  >
                    Registrar devolución
                  </Button>
                )}
                {canCancel && (
                  <Button variant="danger" className="w-full" loading={cancel.isPending} onClick={onCancel}>
                    Cancelar reserva
                  </Button>
                )}
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
