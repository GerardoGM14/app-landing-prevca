import type { CalendarNight } from '../types';
import { WEEKDAYS, monthCells } from '../utils/dates';

interface MonthCalendarProps {
  month: string;
  today: string;
  nights: CalendarNight[];
  nightlyPrice: number | null;
  priceOverrides: Record<string, number>;
  /** Rango seleccionado (ambos incluidos) */
  selection: { from: string; to: string } | null;
  onDayClick: (date: string) => void;
}

const statusStyles = {
  BOOKED: 'bg-prevca-blue text-white',
  HOLD: 'bg-yellow-100 text-yellow-800',
  BLOCKED: 'bg-gray-200 text-gray-500 line-through',
} as const;

const statusLabel = {
  BOOKED: 'Reservado',
  HOLD: 'Apartado',
  BLOCKED: 'Bloqueado',
} as const;

export const MonthCalendar = ({
  month,
  today,
  nights,
  nightlyPrice,
  priceOverrides,
  selection,
  onDayClick,
}: MonthCalendarProps) => {
  const byDate = new Map(nights.map((n) => [n.date, n]));

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="text-center text-[10px] font-ui font-bold uppercase tracking-widest text-gray-400 py-2"
          >
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {monthCells(month).map((date, i) => {
          if (!date) return <div key={`empty-${i}`} />;

          const night = byDate.get(date);
          const special = priceOverrides[date];
          const price = special ?? nightlyPrice;
          const isPast = date < today;
          const selected = selection && date >= selection.from && date <= selection.to;
          const base = night ? statusStyles[night.status] : 'bg-white text-prevca-dark hover:bg-gray-50';

          return (
            <button
              key={date}
              type="button"
              onClick={() => onDayClick(date)}
              title={
                night
                  ? `${statusLabel[night.status]}${night.bookingCode ? ` · ${night.bookingCode}` : ''}${night.note ? ` · ${night.note}` : ''}`
                  : undefined
              }
              className={`relative min-h-[72px] border p-2 text-left transition-colors cursor-pointer ${base} ${
                selected ? 'ring-2 ring-offset-1 ring-prevca-dark border-prevca-dark' : 'border-gray-200'
              } ${isPast ? 'opacity-40' : ''}`}
            >
              <span className="block text-sm font-ui font-bold">{Number(date.slice(8))}</span>
              {price !== null && price !== undefined && (
                <span
                  className={`block text-[11px] font-body mt-1 ${
                    special !== undefined && !night ? 'text-orange-600 font-bold' : ''
                  }`}
                >
                  S/ {price % 1 === 0 ? price : price.toFixed(2)}
                </span>
              )}
              {night && (
                <span className="block text-[9px] font-ui font-bold uppercase tracking-wider mt-1 no-underline truncate">
                  {night.bookingCode ?? statusLabel[night.status]}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
