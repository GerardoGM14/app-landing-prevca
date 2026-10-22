/** Fechas de calendario 'YYYY-MM-DD', sin hora ni zona (hora de Perú). */

export const todayLima = (): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date());

export const addDays = (date: string, days: number): string => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export const diffDays = (from: string, to: string): number =>
  Math.round(
    (new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / 86_400_000,
  );

/** Primer día del mes de una fecha ('2026-10-22' → '2026-10-01'). */
export const monthStart = (date: string): string => `${date.slice(0, 7)}-01`;

export const addMonths = (month: string, n: number): string => {
  const d = new Date(`${month}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + n, 1);
  return d.toISOString().slice(0, 10);
};

export const monthEnd = (month: string): string => addDays(addMonths(month, 1), -1);

/**
 * Celdas de un mes empezando en lunes; null = hueco antes del día 1.
 */
export const monthCells = (month: string): (string | null)[] => {
  const first = new Date(`${month}T00:00:00Z`);
  const offset = (first.getUTCDay() + 6) % 7; // lunes = 0
  const days = diffDays(month, addMonths(month, 1));
  return [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: days }, (_, i) => addDays(month, i)),
  ];
};

export const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export const monthLabel = (month: string): string => {
  const label = new Date(`${month}T12:00:00Z`).toLocaleDateString('es-PE', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

/** '2026-10-22' → '22 oct 2026' */
export const formatDay = (date: string): string =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

export const formatMoney = (n: number | null | undefined): string =>
  n === null || n === undefined ? '—' : `S/ ${n.toFixed(2)}`;
