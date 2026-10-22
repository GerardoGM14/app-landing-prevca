import { LODGING_RULES } from '../../config/constants';

/**
 * Fechas de calendario como texto 'YYYY-MM-DD' (sin hora ni zona), siempre
 * interpretadas en hora de Perú. Una "noche" se identifica por la fecha en que
 * empieza: del 10 al 12 son las noches '10' y '11' (el 12 es el día de salida).
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const isValidDate = (value: string): boolean => {
  if (!DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
};

/** Fecha de hoy en Perú. */
export const todayLima = (): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: LODGING_RULES.TIMEZONE }).format(new Date());

export const addDays = (date: string, days: number): string => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/** Días entre dos fechas (to - from). */
export const diffDays = (from: string, to: string): number =>
  Math.round(
    (new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / 86_400_000,
  );

/** Noches de una estadía: desde checkIn (incluido) hasta checkOut (excluido). */
export const nightsBetween = (checkIn: string, checkOut: string): string[] => {
  const out: string[] = [];
  for (let d = checkIn; d < checkOut; d = addDays(d, 1)) out.push(d);
  return out;
};

/** Días de un rango del admin: desde `from` hasta `to`, ambos incluidos. */
export const daysInclusive = (from: string, to: string): string[] => nightsBetween(from, addDays(to, 1));
