import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaExternalLinkAlt } from 'react-icons/fa';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/core/toast/ToastContext';
import { ManualBookingForm } from '../components/ManualBookingForm';
import { MonthCalendar } from '../components/MonthCalendar';
import { UnitConfigCard } from '../components/UnitConfigCard';
import {
  useBlockNights,
  useLodgingUnits,
  useSetPrices,
  useUnblockNights,
  useUnitCalendar,
} from '../hooks/useLodging';
import type { LodgingUnit } from '../types';
import { addDays, addMonths, diffDays, formatDay, monthEnd, monthLabel, monthStart, todayLima } from '../utils/dates';

const Legend = () => (
  <div className="flex flex-wrap gap-4 text-xs font-body text-gray-600">
    <span className="flex items-center gap-2"><span className="w-3 h-3 border border-gray-300 bg-white" /> Libre</span>
    <span className="flex items-center gap-2"><span className="w-3 h-3 bg-prevca-blue" /> Reservado</span>
    <span className="flex items-center gap-2"><span className="w-3 h-3 bg-yellow-100 border border-yellow-300" /> Apartado (pagando)</span>
    <span className="flex items-center gap-2"><span className="w-3 h-3 bg-gray-200" /> Bloqueado</span>
    <span className="flex items-center gap-2"><span className="text-orange-600 font-bold">S/</span> Precio especial</span>
  </div>
);

/** Panel de acciones sobre los días seleccionados. */
const SelectionPanel = ({
  unit,
  selection,
  onClear,
}: {
  unit: LodgingUnit;
  selection: { from: string; to: string };
  onClear: () => void;
}) => {
  const toast = useToast();
  const navigate = useNavigate();
  const block = useBlockNights(unit.id);
  const unblock = useUnblockNights(unit.id);
  const setPrices = useSetPrices(unit.id);
  const [note, setNote] = useState('');
  const [price, setPrice] = useState('');
  const [manual, setManual] = useState(false);
  const days = diffDays(selection.from, selection.to) + 1;

  const run = async (action: () => Promise<unknown>, message: string) => {
    try {
      await action();
      toast.success(message);
      onClear();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  if (manual) {
    return (
      <ManualBookingForm
        unit={unit}
        checkIn={selection.from}
        // El último día seleccionado es la última noche; la salida es el día siguiente.
        checkOut={addDays(selection.to, 1)}
        onCancel={() => setManual(false)}
        onDone={(b) => navigate(`/bookings/${b.id}`)}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-ui font-bold uppercase tracking-widest text-gray-500 mb-1">Selección</p>
        <p className="font-display font-bold text-prevca-dark">
          {selection.from === selection.to
            ? formatDay(selection.from)
            : `${formatDay(selection.from)} → ${formatDay(selection.to)}`}
        </p>
        <p className="text-xs text-gray-500 font-body">
          {days} noche{days === 1 ? '' : 's'} · haga clic en otro día para cambiar el rango
        </p>
      </div>

      <Button onClick={() => setManual(true)} className="w-full">
        Registrar reserva manual
      </Button>

      <div className="border-t border-gray-200 pt-4 space-y-3">
        <Input label="Motivo del bloqueo (opcional)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Mantenimiento, uso propio…" />
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            loading={block.isPending}
            onClick={() => void run(() => block.mutateAsync({ ...selection, note: note || null }), 'Noches bloqueadas')}
          >
            Bloquear
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            loading={unblock.isPending}
            onClick={() =>
              void run(async () => {
                const r = await unblock.mutateAsync(selection);
                if (r.released === 0) throw new Error('No había noches bloqueadas en la selección');
              }, 'Noches desbloqueadas')
            }
          >
            Desbloquear
          </Button>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4 space-y-3">
        <Input
          label="Precio especial por noche (S/)"
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Ej. feriado o temporada alta"
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            disabled={!price}
            loading={setPrices.isPending}
            onClick={() => void run(() => setPrices.mutateAsync({ ...selection, price: Number(price) }), 'Precio especial aplicado')}
          >
            Aplicar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            loading={setPrices.isPending}
            onClick={() => void run(() => setPrices.mutateAsync({ ...selection, price: null }), 'Se volvió al precio base')}
          >
            Quitar
          </Button>
        </div>
      </div>

      <button type="button" onClick={onClear} className="text-xs font-ui text-gray-400 hover:text-prevca-dark cursor-pointer">
        Limpiar selección
      </button>
    </div>
  );
};

export const LodgingCalendarPage = () => {
  const today = todayLima();
  const { data: units, isLoading, error } = useLodgingUnits();
  const [unitId, setUnitId] = useState<string>();
  const [month, setMonth] = useState(monthStart(today));
  const [selection, setSelection] = useState<{ from: string; to: string } | null>(null);
  const [anchor, setAnchor] = useState<string | null>(null);

  const unit = units?.find((u) => u.id === unitId) ?? units?.[0];
  const range = useMemo(() => ({ from: month, to: monthEnd(month) }), [month]);
  const { data: calendar, isFetching } = useUnitCalendar(unit?.id, range);

  const clickedNight = selection?.from === selection?.to
    ? calendar?.nights.find((n) => n.date === selection?.from && n.bookingId)
    : undefined;

  // Primer clic fija el inicio; el segundo, el fin (en cualquier orden).
  const onDayClick = (date: string) => {
    if (!anchor || (selection && selection.from !== selection.to)) {
      setAnchor(date);
      setSelection({ from: date, to: date });
      return;
    }
    setSelection(date < anchor ? { from: date, to: anchor } : { from: anchor, to: date });
    setAnchor(null);
  };

  const clearSelection = () => {
    setSelection(null);
    setAnchor(null);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Alojamiento"
        title="Calendario"
        description="Disponibilidad de cada departamento. Seleccione días para bloquearlos, ponerles un precio especial o registrar una reserva manual."
      />

      {isLoading && <div className="flex justify-center py-16"><Spinner /></div>}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-body p-4">
          Error: {(error as Error).message}
        </div>
      )}
      {units && units.length === 0 && (
        <Card><CardBody className="text-gray-500 font-body">No hay productos en la división Alojamiento.</CardBody></Card>
      )}

      {unit && (
        <>
          <div className="flex flex-wrap gap-2 mb-6">
            {units!.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  setUnitId(u.id);
                  clearSelection();
                }}
                className={`px-5 py-3 text-xs font-ui font-bold uppercase tracking-widest border-2 transition-colors cursor-pointer ${
                  u.id === unit.id
                    ? 'bg-prevca-blue text-white border-prevca-blue'
                    : 'bg-white text-prevca-dark border-gray-200 hover:border-prevca-blue'
                }`}
              >
                {u.title}
                {!u.lodging.bookable && <span className="ml-2 opacity-60 normal-case tracking-normal">(sin reservas)</span>}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card className="xl:col-span-2">
              <CardHeader className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setMonth(addMonths(month, -1))}
                  className="p-2 text-prevca-blue hover:bg-prevca-blue/10 cursor-pointer"
                  aria-label="Mes anterior"
                >
                  <FaChevronLeft />
                </button>
                <h2 className="font-display font-extrabold uppercase tracking-widest text-sm text-prevca-dark flex items-center gap-3">
                  {monthLabel(month)}
                  {isFetching && <Spinner />}
                </h2>
                <button
                  type="button"
                  onClick={() => setMonth(addMonths(month, 1))}
                  className="p-2 text-prevca-blue hover:bg-prevca-blue/10 cursor-pointer"
                  aria-label="Mes siguiente"
                >
                  <FaChevronRight />
                </button>
              </CardHeader>
              <CardBody className="space-y-4">
                <MonthCalendar
                  month={month}
                  today={today}
                  nights={calendar?.nights ?? []}
                  nightlyPrice={calendar?.nightlyPrice ?? unit.lodging.nightlyPrice}
                  priceOverrides={calendar?.priceOverrides ?? {}}
                  selection={selection}
                  onDayClick={onDayClick}
                />
                <Legend />
              </CardBody>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardBody>
                  {clickedNight?.bookingId ? (
                    <div className="space-y-3">
                      <p className="text-xs font-ui font-bold uppercase tracking-widest text-gray-500">
                        {formatDay(clickedNight.date)}
                      </p>
                      <p className="font-display font-bold text-prevca-dark">
                        {clickedNight.status === 'HOLD' ? 'Apartada por un cliente que está pagando' : 'Noche reservada'}
                      </p>
                      <Link
                        to={`/bookings/${clickedNight.bookingId}`}
                        className="inline-flex items-center gap-2 text-sm font-ui font-bold text-prevca-blue hover:underline"
                      >
                        Ver reserva {clickedNight.bookingCode} <FaExternalLinkAlt className="text-xs" />
                      </Link>
                    </div>
                  ) : selection ? (
                    <SelectionPanel key={`${unit.id}-${selection.from}-${selection.to}`} unit={unit} selection={selection} onClear={clearSelection} />
                  ) : (
                    <p className="text-sm text-gray-500 font-body">
                      Haga clic en un día para empezar a seleccionar. Un segundo clic marca el último día del rango.
                    </p>
                  )}
                </CardBody>
              </Card>
              <UnitConfigCard unit={unit} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
