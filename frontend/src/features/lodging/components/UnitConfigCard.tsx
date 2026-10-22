import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { useToast } from '@/core/toast/ToastContext';
import { useUpdateLodgingConfig } from '../hooks/useLodging';
import type { LodgingUnit } from '../types';

export const UnitConfigCard = ({ unit }: { unit: LodgingUnit }) => {
  const toast = useToast();
  const update = useUpdateLodgingConfig(unit.id);
  const cfg = unit.lodging;

  const [bookable, setBookable] = useState(cfg.bookable);
  const [price, setPrice] = useState(cfg.nightlyPrice?.toString() ?? '');
  const [maxGuests, setMaxGuests] = useState(String(cfg.maxGuests));
  const [minNights, setMinNights] = useState(String(cfg.minNights));
  const [checkIn, setCheckIn] = useState(cfg.checkInTime);
  const [checkOut, setCheckOut] = useState(cfg.checkOutTime);

  // Al cambiar de departamento se recargan sus valores.
  useEffect(() => {
    setBookable(cfg.bookable);
    setPrice(cfg.nightlyPrice?.toString() ?? '');
    setMaxGuests(String(cfg.maxGuests));
    setMinNights(String(cfg.minNights));
    setCheckIn(cfg.checkInTime);
    setCheckOut(cfg.checkOutTime);
  }, [unit.id, cfg]);

  const save = async () => {
    try {
      await update.mutateAsync({
        bookable,
        nightlyPrice: price ? Number(price) : null,
        maxGuests: Number(maxGuests),
        minNights: Number(minNights),
        checkInTime: checkIn,
        checkOutTime: checkOut,
      });
      toast.success('Configuración guardada');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="font-display font-extrabold uppercase tracking-widest text-sm text-prevca-dark">
          Configuración
        </h2>
      </CardHeader>
      <CardBody className="space-y-4">
        <Toggle
          checked={bookable}
          onChange={setBookable}
          label="Reservas en la web"
          description={
            unit.isActive
              ? 'Si está apagado, el departamento sale como informativo y no se puede reservar.'
              : 'El producto está inactivo: no se ve en la web aunque esto esté encendido.'
          }
        />
        <Input
          label="Precio por noche (S/)"
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          hint="Precio base. Para fechas puntuales use 'Precio especial' en el calendario."
        />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Huéspedes máx." type="number" min="1" value={maxGuests} onChange={(e) => setMaxGuests(e.target.value)} />
          <Input label="Noches mínimas" type="number" min="1" value={minNights} onChange={(e) => setMinNights(e.target.value)} />
          <Input label="Hora de entrada" type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
          <Input label="Hora de salida" type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
        </div>
        <Button onClick={() => void save()} loading={update.isPending} className="w-full">
          Guardar configuración
        </Button>
      </CardBody>
    </Card>
  );
};
