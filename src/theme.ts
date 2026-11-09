import { useEffect, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

/** Shared colours for the ledger-style pages (Cash Book, Calendar) and the web sidebar. */
// Cash-book layout (flat app bar, white tables, square-ish buttons). Brand colours follow the currency system:
// green for KRW, dark pastel purple for MYR (see applySystemTheme). Cash In stays green and Cash Out red in both.
export const T = {
  brand:     '#15803d', // app bar
  brandDark: '#166534', // status-bar strip
  brandMid:  '#16a34a', // period navigator, links, selected day
  brandSoft: '#dcfce7',
  green:     '#22c55e',
  green50:   '#f0fdf4',
  in:        '#15803d', // cash in
  out:       '#dc2626', // cash out
  outSoft:   '#fef2f2',
  ink:       '#1c1917',
  ink2:      '#44403c',
  muted:     '#78716c',
  faint:     '#a8a29e',
  line:      '#e7e5e4',
  line2:     '#f5f5f4',
  bg:        '#ffffff',
  page:      '#f5f5f5', // behind the centred content on wide screens
  white:     '#ffffff',
};

const BRAND = {
  KRW: { brand: '#15803d', brandDark: '#166534', brandMid: '#16a34a', brandSoft: '#dcfce7', green: '#22c55e', green50: '#f0fdf4' },
  MYR: { brand: '#6f5a8e', brandDark: '#594573', brandMid: '#806aa3', brandSoft: '#eeeaf4', green: '#9a88b8', green50: '#f4f1f7' },
};
/** Switch the app's brand colours for the selected currency system. */
export function applySystemTheme(system: 'KRW' | 'MYR') {
  Object.assign(T, BRAND[system]);
}

/** ≥ 900px wide → "website" layout (sidebar, multi-column). */
export const WIDE_BREAKPOINT = 900;
export function useIsWide() {
  const { width } = useWindowDimensions();
  // The static web build is pre-rendered without a window (phone layout). Report "narrow" until
  // mounted so the first client render matches that HTML, then switch — avoids React hydration error #418.
  const [mounted, setMounted] = useState(Platform.OS !== 'web');
  useEffect(() => setMounted(true), []);
  return mounted && width >= WIDE_BREAKPOINT;
}

export const won = (n: number) => `${n < 0 ? '-' : ''}₩${Math.abs(Math.round(n)).toLocaleString()}`;
export const num = (n: number) => Math.round(n).toLocaleString();
/** ₩ for KRW, RM with 2 decimals for MYR; minus sign before the symbol. */
export const money = (n: number, cur: 'KRW' | 'MYR') =>
  cur === 'KRW' ? won(n) : `${n < 0 ? '-' : ''}RM ${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
/** 'YYYY-MM-DD' → local Date (avoids the UTC shift of new Date('YYYY-MM-DD')). */
export function fromDateStr(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
/** '2026-11-03' → '3 Nov 2026' */
export function fmtDate(s: string) {
  const d = fromDateStr(s);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
export function fmtShort(d: Date) {
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** Newest first: by date, then by the timestamp embedded in the id (exp-<ts>, imp-<ts>-<i>). */
export function byNewest<E extends { date: string; id: string }>(a: E, b: E) {
  if (a.date !== b.date) return b.date.localeCompare(a.date);
  const ta = Number(a.id.match(/\d{10,}/)?.[0] ?? 0);
  const tb = Number(b.id.match(/\d{10,}/)?.[0] ?? 0);
  return tb - ta;
}
