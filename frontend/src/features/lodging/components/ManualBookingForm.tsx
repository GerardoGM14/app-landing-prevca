import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Toggle } from '@/components/ui/Toggle';
import { useToast } from '@/core/toast/ToastContext';
import type { DocumentType } from '@/types/api';
import { useCreateManualBooking } from '../hooks/useLodging';
import type { Booking, LodgingUnit } from '../types';
import { diffDays, formatDay } from '../utils/dates';

interface ManualBookingFormProps {
  unit: LodgingUnit;
  checkIn: string;
  checkOut: string;
  onDone: (booking: Booking) => void;
  onCancel: () => void;
}

/** Reserva que llega por WhatsApp o en persona: ocupa las noches de inmediato. */
export const ManualBookingForm = ({ unit, checkIn, checkOut, onDone, onCancel }: ManualBookingFormProps) => {
  const toast = useToast();
  const create = useCreateManualBooking();
  const nights = diffDays(checkIn, checkOut);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('DNI');
  const [documentNumber, setDocumentNumber] = useState('');
  const [guests, setGuests] = useState('1');
  const [total, setTotal] = useState('');
  const [paid, setPaid] = useState(false);
  const [notes, setNotes] = useState('');

  const submit = async () => {
    try {
      const booking = await create.mutateAsync({
        productId: unit.id,
        checkIn,
        checkOut,
        guests: Number(guests),
        customer: {
          name,
          phone,
          email: email || null,
          ...(documentNumber ? { documentType, documentNumber } : {}),
        },
        total: total ? Number(total) : null,
        paid,
        notes: notes || null,
      });
      toast.success(`Reserva ${booking.code} registrada`);
      onDone(booking);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-prevca-blue/5 border-l-4 border-prevca-blue p-3 text-sm font-body">
        <p className="font-bold text-prevca-dark">{unit.title}</p>
        <p className="text-gray-600">
          Llegada {formatDay(checkIn)} · Salida {formatDay(checkOut)} · {nights} noche{nights === 1 ? '' : 's'}
        </p>
      </div>
      <Input label="Nombre del huésped" value={name} onChange={(e) => setName(e.target.value)} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input label="Huéspedes" type="number" min="1" value={guests} onChange={(e) => setGuests(e.target.value)} />
      </div>
      <Input label="Correo (opcional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <div className="grid grid-cols-2 gap-4">
        <Select label="Documento" value={documentType} onChange={(e) => setDocumentType(e.target.value as DocumentType)}>
          <option value="DNI">DNI</option>
          <option value="CE">CE</option>
          <option value="PASAPORTE">Pasaporte</option>
          <option value="RUC">RUC</option>
        </Select>
        <Input label="N° (opcional)" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} />
      </div>
      <Input
        label="Monto pactado (S/)"
        type="number"
        min="0"
        step="0.01"
        value={total}
        onChange={(e) => setTotal(e.target.value)}
        hint="Déjelo vacío para usar las tarifas del calendario."
      />
      <Toggle checked={paid} onChange={setPaid} label="Ya pagó" description="Si no, queda como 'Por cobrar'." />
      <Textarea label="Notas" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      <div className="flex gap-3">
        <Button variant="ghost" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button onClick={() => void submit()} loading={create.isPending} disabled={!name || !phone} className="flex-1">
          Registrar
        </Button>
      </div>
    </div>
  );
};
