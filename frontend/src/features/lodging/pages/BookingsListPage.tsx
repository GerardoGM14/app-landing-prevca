import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEye } from 'react-icons/fa';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { useBookingsList, useLodgingUnits } from '../hooks/useLodging';
import {
  BOOKING_PAYMENT_BADGE,
  BOOKING_PAYMENT_METHOD_LABELS,
  BOOKING_PAYMENT_STATUS_LABELS,
  BOOKING_STATUS_BADGE,
  BOOKING_STATUS_LABELS,
  type BookingStatus,
} from '../types';
import { formatDay, formatMoney } from '../utils/dates';

const th = 'text-left px-6 py-4 font-ui font-bold uppercase tracking-widest text-[10px]';

export const BookingsListPage = () => {
  const [status, setStatus] = useState<BookingStatus | ''>('');
  const [productId, setProductId] = useState('');
  const { data: units } = useLodgingUnits();
  const { data, isLoading, error } = useBookingsList({
    status: status || undefined,
    productId: productId || undefined,
    pageSize: 50,
  });

  return (
    <div>
      <PageHeader
        eyebrow="Alojamiento"
        title="Reservas"
        description="Reservas pagadas en la web y las registradas a mano. Las que dicen 'Revisar' pagaron, pero alguna noche ya estaba ocupada: hay que devolver el dinero o reubicar al huésped."
      />

      <Card className="mb-6">
        <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select label="Estado" value={status} onChange={(e) => setStatus(e.target.value as BookingStatus | '')}>
            <option value="">Todos</option>
            {Object.entries(BOOKING_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
          <Select label="Departamento" value={productId} onChange={(e) => setProductId(e.target.value)}>
            <option value="">Todos</option>
            {units?.map((u) => (
              <option key={u.id} value={u.id}>{u.title}</option>
            ))}
          </Select>
        </div>
      </Card>

      {isLoading && <div className="flex justify-center py-16"><Spinner /></div>}
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
                <th className={th}>Código</th>
                <th className={th}>Departamento</th>
                <th className={th}>Huésped</th>
                <th className={th}>Estadía</th>
                <th className={`${th} text-right`}>Total</th>
                <th className={`${th} text-center`}>Pago</th>
                <th className={`${th} text-center`}>Estado</th>
                <th className={`${th} text-right`}>Ver</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((b) => (
                <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-xs text-prevca-blue font-bold">{b.code}</td>
                  <td className="px-6 py-4 text-xs text-gray-700">{b.productTitle}</td>
                  <td className="px-6 py-4">
                    <p className="font-display font-bold text-prevca-dark">{b.customer.name}</p>
                    <p className="text-xs text-gray-400">{b.customer.phone}</p>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-700 whitespace-nowrap">
                    {formatDay(b.checkIn)} → {formatDay(b.checkOut)}
                    <span className="block text-gray-400">{b.nights} noche{b.nights === 1 ? '' : 's'} · {b.guests} huésp.</span>
                  </td>
                  <td className="px-6 py-4 text-right font-ui font-bold text-prevca-dark whitespace-nowrap">{formatMoney(b.total)}</td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant={BOOKING_PAYMENT_BADGE[b.paymentStatus]}>{BOOKING_PAYMENT_STATUS_LABELS[b.paymentStatus]}</Badge>
                    <span className="block text-[10px] text-gray-400 mt-1">{BOOKING_PAYMENT_METHOD_LABELS[b.paymentMethod]}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant={BOOKING_STATUS_BADGE[b.status]}>{BOOKING_STATUS_LABELS[b.status]}</Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/bookings/${b.id}`} className="inline-flex p-2 text-prevca-blue hover:bg-prevca-blue/10" title="Ver detalle">
                      <FaEye />
                    </Link>
                  </td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-gray-400 font-body">No hay reservas con esos filtros.</td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};
