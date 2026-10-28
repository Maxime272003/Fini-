import type { Data, Task } from './types';

const DAY = 24 * 60 * 60 * 1000;

/** Lundi 00:00 (heure locale) de la semaine qui contient `date`. */
export function startOfIsoWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const offset = (d.getDay() + 6) % 7; // lundi = 0
  d.setDate(d.getDate() - offset);
  return d;
}

export function isoWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7; // dimanche = 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum); // jeudi de la même semaine
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart) / DAY + 1) / 7);
}

export interface WeekRange {
  start: Date;
  end: Date; // exclu : lundi suivant
  week: number;
  label: string;
}

const dayMonth = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
const dayOnly = new Intl.DateTimeFormat('fr-FR', { day: 'numeric' });
const shortDay = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

/** Semaine décalée de `offset` semaines par rapport à celle de `now` (-1 = semaine dernière). */
export function weekRange(offset: number, now = new Date()): WeekRange {
  const start = startOfIsoWeek(now);
  start.setDate(start.getDate() + offset * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  const last = new Date(end);
  last.setDate(last.getDate() - 1);
  const sameMonth = start.getMonth() === last.getMonth();
  const label =
    (sameMonth ? dayOnly.format(start) : dayMonth.format(start)) +
    ' – ' +
    dayMonth.format(last) +
    ' ' +
    last.getFullYear();
  return { start, end, week: isoWeekNumber(start), label };
}

/** « lun. 19 oct. » */
export function formatShortDay(iso: string): string {
  return shortDay.format(new Date(iso));
}

/** Cartes finies dans la semaine, tous decks confondus, par date de fin croissante. */
export function doneInWeek(d: Data, range: WeekRange): Task[] {
  const a = range.start.getTime();
  const b = range.end.getTime();
  return d.tasks
    .filter((t) => {
      if (!t.done || !t.doneAt) return false;
      const x = new Date(t.doneAt).getTime();
      return x >= a && x < b;
    })
    .sort((x, y) => (x.doneAt ?? '').localeCompare(y.doneAt ?? ''));
}
