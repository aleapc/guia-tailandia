import { trip } from './content';

const WEEKDAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** Parse a 'yyyy-mm-dd' string as a LOCAL date (no UTC shift). */
export function parseLocal(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Today's local date as 'yyyy-mm-dd'. */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** ISO weekday Mon=1..Sun=7 for a 'yyyy-mm-dd' string. */
export function isoWeekday(iso: string): number {
  const js = parseLocal(iso).getDay(); // 0=Sun..6=Sat
  return js === 0 ? 7 : js;
}

export function ptWeekday(iso: string): string {
  const w = WEEKDAYS[parseLocal(iso).getDay()];
  return w.charAt(0).toUpperCase() + w.slice(1);
}
export function ptWeekdayShort(iso: string): string {
  return ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'][parseLocal(iso).getDay()];
}
export function ptDateShort(iso: string): string {
  const d = parseLocal(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${MONTHS[d.getMonth()]}`;
}
export function ptDate(iso: string): string {
  const d = parseLocal(iso);
  return `${d.getDate()} de ${MONTHS[d.getMonth()]}`;
}

function daysBetween(a: string, b: string): number {
  return Math.round((parseLocal(b).getTime() - parseLocal(a).getTime()) / 86_400_000);
}

export function tripDayLabel(today = todayISO()): string {
  const total = daysBetween(trip.startDate, trip.endDate) + 1;
  if (parseLocal(today) < parseLocal(trip.startDate)) {
    return `Faltam ${daysBetween(today, trip.startDate)} dia(s) ✈️`;
  }
  if (parseLocal(today) > parseLocal(trip.endDate)) {
    return 'Boa viagem de volta 👋';
  }
  return `Dia ${daysBetween(trip.startDate, today) + 1} de ${total}`;
}
