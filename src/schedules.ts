import type { Schedule } from './types';
import { toDateStr, fromDateStr } from './theme';

export const FREQ_LABEL: Record<Schedule['frequency'], string> = { weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' };

/** Next date after `date` for this schedule. Monthly/yearly keep the start day (31st → 30th/28th in short months). */
export function advance(s: Pick<Schedule, 'frequency' | 'startDate'>, date: string): string {
  const d = fromDateStr(date);
  if (s.frequency === 'weekly') return toDateStr(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7));
  const day = fromDateStr(s.startDate).getDate();
  const y = d.getFullYear() + (s.frequency === 'yearly' ? 1 : 0);
  const m = s.frequency === 'monthly' ? d.getMonth() + 1 : fromDateStr(s.startDate).getMonth();
  const last = new Date(y, m + 1, 0).getDate(); // days in target month (handles year rollover)
  return toDateStr(new Date(y, m, Math.min(day, last)));
}

const within = (s: Schedule, d: string) => !s.endDate || d <= s.endDate;

/** Dates this schedule falls on between `from` and `to` (inclusive), starting at nextDate. */
export function occurrences(s: Schedule, from: string, to: string, max = 400): string[] {
  const out: string[] = [];
  let d = s.nextDate;
  for (let i = 0; i < max && d <= to && within(s, d); i++) {
    if (d >= from) out.push(d);
    d = advance(s, d);
  }
  return out;
}

/**
 * Everything due up to `today`: the entry dates to create per schedule and the schedule's new nextDate.
 * Entry ids are deterministic (`sch-<id>-<date>`) so an occurrence can never be added twice.
 */
export function dueRuns(schedules: Schedule[], today: string) {
  const runs: { schedule: Schedule; dates: string[]; nextDate: string; finished: boolean }[] = [];
  for (const s of schedules) {
    if (!s.active || s.nextDate > today || !within(s, s.nextDate)) continue;
    const dates: string[] = [];
    let d = s.nextDate;
    for (let i = 0; i < 400 && d <= today && within(s, d); i++) { dates.push(d); d = advance(s, d); }
    runs.push({ schedule: s, dates, nextDate: d, finished: !within(s, d) });
  }
  return runs;
}

/** Rough monthly cost, for the Subscriptions total. */
export const monthlyEquivalent = (s: Schedule) =>
  s.frequency === 'monthly' ? s.amount : s.frequency === 'weekly' ? (s.amount * 52) / 12 : s.amount / 12;
