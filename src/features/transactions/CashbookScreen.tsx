import React, { useEffect, useMemo, useState } from 'react';
import AddFab from '@/src/features/transactions/AddFab';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react-native';
import { useAppContext } from '@/src/context/AppContext';
import { BankAccount, Expense } from '@/src/types';
import TxnFormModal from '@/src/features/transactions/TxnFormModal';
import TxnDetailModal from '@/src/features/transactions/TxnDetailModal';
import MonthGrid from '@/src/features/transactions/MonthGrid';
import { categoryLabel, categoryStyle } from '@/src/categories';
import CategoryPie from '@/src/features/transactions/CategoryPie';
import { occurrences, FREQ_LABEL } from '@/src/schedules';
import MonthSummaryCard from '@/src/features/transactions/MonthSummaryCard';
import { ScopeButton } from '@/src/features/navigation/ScopePicker';
import ImportPreviewModal from '@/src/features/transactions/ImportPreviewModal';
import { pickAndParseBankFile, ParseResult } from '@/src/utils/bankImport';
import { exportCashBook } from '@/src/utils/excelExport';
import { Download, Upload, Clock } from 'lucide-react-native';
import { T, useIsWide, money, toDateStr, fmtDate, fmtShort, byNewest, MONTHS_LONG } from '@/src/theme';

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';
const PERIODS: { key: Period; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** [start, end] as YYYY-MM-DD (inclusive) for the period containing `anchor`. */
function rangeFor(period: Period, anchor: Date): [string, string] {
  const y = anchor.getFullYear(), m = anchor.getMonth(), d = anchor.getDate();
  if (period === 'daily') return [toDateStr(anchor), toDateStr(anchor)];
  if (period === 'weekly') {
    const offset = (anchor.getDay() + 6) % 7; // Monday-start week
    return [toDateStr(new Date(y, m, d - offset)), toDateStr(new Date(y, m, d - offset + 6))];
  }
  if (period === 'monthly') return [toDateStr(new Date(y, m, 1)), toDateStr(new Date(y, m + 1, 0))];
  return [`${y}-01-01`, `${y}-12-31`];
}

function shift(period: Period, anchor: Date, dir: -1 | 1) {
  const y = anchor.getFullYear(), m = anchor.getMonth(), d = anchor.getDate();
  if (period === 'daily') return new Date(y, m, d + dir);
  if (period === 'weekly') return new Date(y, m, d + 7 * dir);
  if (period === 'monthly') return new Date(y, m + dir, 1);
  return new Date(y + dir, 0, 1);
}

function periodLabel(period: Period, anchor: Date) {
  const today = toDateStr(new Date());
  const r = rangeFor(period, anchor);
  if (period === 'yearly') return String(anchor.getFullYear());
  if (period === 'daily') {
    const yest = toDateStr(new Date(Date.now() - 86400000));
    return r[0] === today ? 'Today' : r[0] === yest ? 'Yesterday' : fmtDate(r[0]);
  }
  if (period === 'weekly') {
    if (today >= r[0] && today <= r[1]) return 'This Week';
    const [s, e] = r.map(x => { const [yy, mm, dd] = x.split('-').map(Number); return new Date(yy, mm - 1, dd); });
    return `${fmtShort(s)} – ${fmtShort(e)} ${e.getFullYear()}`;
  }
  return `${MONTHS_LONG[anchor.getMonth()]} ${anchor.getFullYear()}`;
}

export default function CashBookScreen() {
  const router = useRouter();
  const { expenses, schedules, categories, system, systemAccounts, scopeIds, scopeName, scopeAccountId } = useAppContext();
  const isWide = useIsWide();

  const [period, setPeriod] = useState<Period>('daily');
  const [anchor, setAnchor] = useState(new Date());
  const [formType, setFormType] = useState<'income' | 'expense' | null>(null);
  const [selected, setSelected] = useState<Expense | null>(null);

  // ── Excel export / import ──
  const [busy, setBusy] = useState(false);
  const [excelMsg, setExcelMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [importing, setImporting] = useState<{ account: BankAccount; result: ParseResult } | null>(null);
  // Import goes into the account picked in the sidebar, or the first account of this system
  const importAccount = () => systemAccounts.find(a => a.id === scopeAccountId) ?? systemAccounts[0];
  async function doImport() {
    setExcelMsg(null);
    const account = importAccount();
    if (!account) return setExcelMsg({ text: `Add a ${system} account first.`, error: true });
    try {
      setBusy(true);
      const result = await pickAndParseBankFile();
      if (result) setImporting({ account, result });
    } catch (e: any) {
      setExcelMsg({ text: e?.message ?? 'Could not read that file.', error: true });
    } finally {
      setBusy(false);
    }
  }

  // /cashbook?view=monthly opens straight into a view (used by the home screen's calendar icon)
  const { view } = useLocalSearchParams<{ view?: string }>();
  useEffect(() => {
    if (view && PERIODS.some(p => p.key === view)) { setPeriod(view as Period); setAnchor(new Date()); }
  }, [view]);

  const fmt = (n: number) => money(n, system);

  const range = rangeFor(period, anchor);
  const inScope = useMemo(() => expenses.filter(e => scopeIds.has(e.accountId)), [expenses, scopeIds]);
  const rows = useMemo(
    () => inScope.filter(e => e.date >= range[0] && e.date <= range[1]).sort(byNewest),
    [inScope, range[0], range[1]],
  );

  const signed = (e: Expense) => (e.type === 'income' ? e.amount : -e.amount);
  const totalIn = rows.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const totalOut = rows.filter(e => e.type !== 'income').reduce((s, e) => s + e.amount, 0);
  // Account balances are "now". Opening = now − everything that happened from the period start onward.
  const currentBalance = systemAccounts.filter(a => scopeIds.has(a.id)).reduce((s, a) => s + a.balance, 0);
  const netSinceStart = inScope.filter(e => e.date >= range[0]).reduce((s, e) => s + signed(e), 0);
  const opening = currentBalance - netSinceStart;
  const closing = opening + totalIn - totalOut;

  // Monthly view: calendar grid + details for the tapped date.
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  useEffect(() => {
    if (period !== 'monthly') return;
    const t = toDateStr(new Date());
    setSelectedDay(t >= range[0] && t <= range[1] ? t : null); // today if it's in this month
  }, [period, range[0]]);
  const byDate = useMemo(() => {
    const g: Record<string, Expense[]> = {};
    rows.forEach(e => { (g[e.date] ??= []).push(e); });
    return g;
  }, [rows]);
  const dayRows = selectedDay ? byDate[selectedDay] ?? [] : [];
  // Upcoming scheduled entries in this month (not added yet) — shown faded in Monthly view
  const upcoming = useMemo(() => {
    const m: Record<string, typeof schedules> = {};
    if (period !== 'monthly') return m;
    for (const s of schedules) {
      if (!s.active || s.currency !== system || !scopeIds.has(s.accountId)) continue;
      for (const d of occurrences(s, range[0], range[1])) (m[d] ??= []).push(s);
    }
    return m;
  }, [schedules, period, range[0], range[1], system, scopeIds]);
  const upcomingDays = useMemo(() => new Set(Object.keys(upcoming)), [upcoming]);
  const dayUpcoming = selectedDay ? upcoming[selectedDay] ?? [] : [];
  const dayIn = dayRows.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const dayOut = dayRows.filter(e => e.type !== 'income').reduce((s, e) => s + e.amount, 0);

  const isToday = period === 'daily' && range[0] === toDateStr(new Date());
  const defaultDate = !(toDateStr(new Date()) >= range[0] && toDateStr(new Date()) <= range[1]) ? range[0] : undefined;

  // ── pieces ────────────────────────────────────────────────
  const header = (
    <View style={{ backgroundColor: T.brand }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <BookOpen size={20} color="rgba(255,255,255,0.8)" />
        <View style={{ flex: 1 }}>
          <Text style={{ color: T.white, fontSize: 20, fontWeight: '800' }}>Cash Book</Text>
          <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 1 }} numberOfLines={1}>{system} · {scopeName}</Text>
        </View>
        {!isWide && <ScopeButton />}
      </View>

      {/* Period pills */}
      <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingBottom: 10 }}>
        {PERIODS.map(p => {
          const active = p.key === period;
          return (
            <TouchableOpacity
              key={p.key}
              onPress={() => { setPeriod(p.key); setAnchor(new Date()); }}
              style={{ flex: 1, paddingVertical: 7, borderRadius: 999, alignItems: 'center', borderWidth: 1.5, borderColor: T.white, backgroundColor: active ? 'transparent' : T.white }}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: active ? T.white : T.ink }}>{p.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Period navigator */}
      <View style={{ flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)', backgroundColor: T.brandMid }}>
        <TouchableOpacity onPress={() => setAnchor(a => shift(period, a, -1))} style={{ padding: 12, opacity: 1 }} accessibilityLabel="Previous period">
          <ChevronLeft size={20} color={T.white} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setAnchor(new Date())} style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ color: T.white, fontSize: 16, fontWeight: '700' }}>{periodLabel(period, anchor)}</Text>
        </TouchableOpacity>
        <TouchableOpacity disabled={isToday} onPress={() => setAnchor(a => shift(period, a, 1))} style={{ padding: 12, opacity: isToday ? 0.3 : 1 }} accessibilityLabel="Next period">
          <ChevronRight size={20} color={T.white} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const columnHeader = (
    <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fafafa', borderBottomWidth: 1, borderBottomColor: T.line }}>
      <Text style={{ flex: 1, fontSize: 13, fontWeight: '800', color: T.ink }}>Date</Text>
      <Text style={{ width: 112, textAlign: 'right', fontSize: 13, fontWeight: '800', color: T.in }}>Cash In</Text>
      <Text style={{ width: 112, textAlign: 'right', fontSize: 13, fontWeight: '800', color: T.out }}>Cash Out</Text>
    </View>
  );

  // hideDate: Monthly day list already shows the date in its header
  const renderRows = (list: Expense[], hideDate = false) => list.map((e, i) => {
    const bank = scopeAccountId === 'all' && systemAccounts.length > 1 ? systemAccounts.find(a => a.id === e.accountId)?.bankName ?? '' : '';
    const caption = hideDate ? bank : `${fmtDate(e.date)}${bank ? ` · ${bank}` : ''}`;
    const isIn = e.type === 'income';
    return (
      <TouchableOpacity
        key={e.id}
        onPress={() => setSelected(e)}
        activeOpacity={0.6}
        style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: i % 2 ? '#fcfcfb' : T.white, borderBottomWidth: 1, borderBottomColor: T.line2 }}
      >
        <View style={{ flex: 1, paddingRight: 8 }}>
          {!!caption && <Text style={{ fontSize: 12, color: T.muted }} numberOfLines={1}>{caption}</Text>}
          <Text style={{ fontSize: 15, color: T.ink, fontWeight: '600', marginTop: 3 }} numberOfLines={1}>{e.note}</Text>
          <Text style={{ fontSize: 11, color: T.faint, marginTop: 1 }} numberOfLines={1}>{categoryLabel(e)}</Text>
        </View>
        {isWide ? (
          <>
            <Text style={{ width: 112, textAlign: 'right', fontSize: 16, fontWeight: '700', color: T.in }}>{isIn ? fmt(e.amount) : ''}</Text>
            <Text style={{ width: 112, textAlign: 'right', fontSize: 16, fontWeight: '700', color: T.out }}>{isIn ? '' : fmt(e.amount)}</Text>
          </>
        ) : (
          // Phones: one signed amount column so the remark gets the width
          <Text style={{ fontSize: 16, fontWeight: '700', color: isIn ? T.in : T.out }}>{isIn ? '+' : '−'}{fmt(Math.abs(e.amount))}</Text>
        )}
      </TouchableOpacity>
    );
  });

  // Monthly: calendar on top, tapped date's entries below
  const excelRow = (
    <>
      {/* Excel: export this period / import a bank or BolehBudget file */}
      <View style={{ flexDirection: 'row', gap: 10, padding: 10, borderTopWidth: 1, borderTopColor: T.line }}>
        <TouchableOpacity onPress={doExport} disabled={busy} style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: T.in, borderRadius: 6, paddingVertical: 10, backgroundColor: T.white }}>
          <Download size={16} color={T.in} />
          <Text style={{ color: T.in, fontWeight: '800', fontSize: 14 }}>Export Excel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={doImport} disabled={busy} style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: T.ink2, borderRadius: 6, paddingVertical: 10, backgroundColor: T.white }}>
          <Upload size={16} color={T.ink2} />
          <Text style={{ color: T.ink2, fontWeight: '800', fontSize: 14 }}>Import Excel</Text>
        </TouchableOpacity>
      </View>
      {!!excelMsg && (
        <TouchableOpacity onPress={() => setExcelMsg(null)} style={{ paddingHorizontal: 12, paddingBottom: 10 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: excelMsg.error ? T.out : T.in }}>{excelMsg.text}</Text>
        </TouchableOpacity>
      )}
    </>
  );

  // ── Monthly: Balance (opening = carried over from last month) / Overview / Expense Structure ──
  const real = rows.filter(e => !e.transferId);          // transfers aren't income or expense
  const mIncome = real.filter(e => e.type === 'income').reduce((t, e) => t + e.amount, 0);
  const mExpense = real.filter(e => e.type !== 'income').reduce((t, e) => t + e.amount, 0);
  const incomeByCat = Object.entries(real.filter(e => e.type === 'income').reduce<Record<string, number>>((m, e) => { m[e.category] = (m[e.category] || 0) + e.amount; return m; }, {}));
  const expenseByCat = Object.entries(real.filter(e => e.type !== 'income').reduce<Record<string, number>>((m, e) => { m[e.category] = (m[e.category] || 0) + e.amount; return m; }, {}));
  const block = (title: string, children: React.ReactNode, onMore?: () => void) => (
    <View style={{ backgroundColor: T.white, borderBottomWidth: 8, borderBottomColor: T.page }}>
      <Text style={{ fontSize: 18, fontWeight: '800', color: T.ink, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 }}>{title}</Text>
      {children}
      {onMore && (
        <TouchableOpacity onPress={onMore} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: T.line2 }}>
          <Text style={{ flex: 1, fontSize: 14, color: T.ink2 }}>Show more</Text>
          <ChevronRight size={18} color={T.faint} />
        </TouchableOpacity>
      )}
    </View>
  );
  const monthlyPanel = (
    <View style={{ backgroundColor: T.page }}>
      {block('Balance', (
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 14, paddingTop: 4, gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, color: T.muted }}>Opening balance</Text>
            <Text style={{ fontSize: 17, fontWeight: '700', color: opening < 0 ? T.out : T.ink, marginTop: 2 }}>{fmt(opening)}</Text>
            <Text style={{ fontSize: 10, color: T.faint, marginTop: 1 }}>carried over from last month</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, color: T.muted }}>Ending balance</Text>
            <Text style={{ fontSize: 17, fontWeight: '700', color: closing < 0 ? T.out : T.ink, marginTop: 2 }}>{fmt(closing)}</Text>
          </View>
        </View>
      ))}
      {block('Expense Structure', expenseByCat.length ? (
        <CategoryPie
          compact
          centerLabel="Expense"
          total={mExpense}
          format={v => fmt(-v)}
          slices={expenseByCat.map(([name, v]) => ({ key: name, label: name, value: v, color: categoryStyle(categories, name).color }))}
        />
      ) : (
        <Text style={{ textAlign: 'center', color: T.faint, paddingVertical: 24 }}>No expenses this month</Text>
      ), () => router.navigate('/expenses'))}
      {block('Income Structure', incomeByCat.length ? (
        <CategoryPie
          compact
          centerLabel="Income"
          total={mIncome}
          format={v => fmt(v)}
          slices={incomeByCat.map(([name, v]) => ({ key: name, label: name, value: v, color: categoryStyle(categories, name).color }))}
        />
      ) : (
        <Text style={{ textAlign: 'center', color: T.faint, paddingVertical: 24 }}>No income this month</Text>
      ), () => router.navigate('/expenses?show=income'))}
      <View style={{ backgroundColor: T.white }}>{excelRow}</View>
    </View>
  );

  const byDateReal = useMemo(() => {
    const g: Record<string, Expense[]> = {};
    rows.filter(e => !e.transferId).forEach(e => { (g[e.date] ??= []).push(e); });
    return g;
  }, [rows]);
  const monthView = (
    <ScrollView style={{ flex: 1, backgroundColor: T.white }}>
      {/* Month overview above the calendar: Income | Expense | Total (no transfers) */}
      <View style={{ flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: T.line, backgroundColor: '#fafafa' }}>
        {([['Income', mIncome, T.in], ['Expense', -mExpense, T.out], ['Total', mIncome - mExpense, mIncome - mExpense < 0 ? T.out : T.ink]] as const).map(([k, v, c]) => (
          <View key={k} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 13, color: T.muted }}>{k}</Text>
            <Text style={{ fontSize: 16, fontWeight: '800', color: c, marginTop: 2 }} numberOfLines={1}>{fmt(v)}</Text>
          </View>
        ))}
      </View>
      <View style={{ paddingHorizontal: 4, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: T.line }}>
        <MonthGrid showAmounts year={anchor.getFullYear()} month={anchor.getMonth()} selected={selectedDay} onSelect={setSelectedDay} byDate={byDateReal} scheduled={upcomingDays} />
      </View>
      {selectedDay ? (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: T.green50, borderBottomWidth: 1, borderBottomColor: T.line }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: T.ink }}>{fmtDate(selectedDay)}</Text>
              <Text style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{dayRows.length} entr{dayRows.length === 1 ? 'y' : 'ies'}</Text>
            </View>
            <Text style={{ width: 112, textAlign: 'right', fontSize: 14, fontWeight: '800', color: T.in }}>{dayIn ? fmt(dayIn) : ''}</Text>
            <Text style={{ width: 112, textAlign: 'right', fontSize: 14, fontWeight: '800', color: T.out }}>{dayOut ? fmt(dayOut) : ''}</Text>
          </View>
          {dayRows.length ? renderRows(dayRows, true) : !dayUpcoming.length && (
            <Text style={{ textAlign: 'center', color: T.faint, fontSize: 13, paddingVertical: 28 }}>No entries on this day</Text>
          )}
          {dayUpcoming.map(s => (
            <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, opacity: 0.5, borderBottomWidth: 1, borderBottomColor: T.line2 }}>
              <Clock size={14} color={T.muted} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: T.muted }}>Scheduled · {FREQ_LABEL[s.frequency]}</Text>
                <Text style={{ fontSize: 15, color: T.ink, fontWeight: '600', marginTop: 2 }} numberOfLines={1}>{s.note}</Text>
              </View>
              <Text style={{ width: 112, textAlign: 'right', fontSize: 16, fontWeight: '700', color: T.in }}>{s.type === 'income' ? fmt(s.amount) : ''}</Text>
              <Text style={{ width: 112, textAlign: 'right', fontSize: 16, fontWeight: '700', color: T.out }}>{s.type === 'income' ? '' : fmt(s.amount)}</Text>
            </View>
          ))}
        </>
      ) : (
        <Text style={{ textAlign: 'center', color: T.faint, fontSize: 13, paddingVertical: 28 }}>Tap a date to see its details</Text>
      )}
      {!isWide && <View style={{ borderTopWidth: 8, borderTopColor: T.page }}>{monthlyPanel}</View>}
    </ScrollView>
  );


  // Yearly: summary cards per month (right / bottom); tapping one lists that month on the left
  const year = anchor.getFullYear();
  const thisMonthKey = toDateStr(new Date()).slice(0, 7);
  const monthTotals = MONTHS_SHORT.map((_, mi) => {
    const key = `${year}-${String(mi + 1).padStart(2, '0')}`;
    const list = rows.filter(e => e.date.startsWith(key));
    return {
      mi, key, list,
      inAmt: list.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0),
      outAmt: list.filter(e => e.type !== 'income').reduce((s, e) => s + e.amount, 0),
    };
  }).filter(m => m.key <= thisMonthKey || m.list.length > 0) // hide empty future months
    .reverse();                                                 // newest first

  const [selMonth, setSelMonth] = useState<number | null>(null);
  useEffect(() => {
    if (period !== 'yearly') return;
    const now = new Date();
    const withEntries = monthTotals.find(m => m.list.length);
    setSelMonth(year === now.getFullYear() ? now.getMonth() : withEntries?.mi ?? null);
  }, [period, year]);
  const selMonthData = monthTotals.find(m => m.mi === selMonth);

  const summaryCards = monthTotals.map(m => (
    <MonthSummaryCard
      key={m.key}
      title={`${MONTHS_LONG[m.mi]} ${year}`}
      inAmt={m.inAmt}
      outAmt={m.outAmt}
      currency={system}
      selected={m.mi === selMonth}
      onPress={() => setSelMonth(m.mi)}
    />
  ));

  const summaryPanel = isWide ? (
    <View style={{ backgroundColor: T.white }}>
      <Text style={{ textAlign: 'center', fontSize: 16, fontWeight: '800', color: T.ink, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: T.line }}>Summary {year}</Text>
      <ScrollView style={{ maxHeight: 560 }} contentContainerStyle={{ padding: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {summaryCards.map((c, i) => <View key={i} style={{ width: '48.5%' as any }}>{c}</View>)}
      </ScrollView>
    </View>
  ) : (
    <View style={{ backgroundColor: T.white, borderTopWidth: 1, borderTopColor: T.line }}>
      <Text style={{ textAlign: 'center', fontSize: 15, fontWeight: '800', color: T.ink, paddingTop: 8 }}>Summary {year}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 10, gap: 8 }}>
        {summaryCards.map((c, i) => <View key={i} style={{ width: 210 }}>{c}</View>)}
      </ScrollView>
    </View>
  );

  const yearView = (
    <View style={{ flex: 1, backgroundColor: T.white }}>
      {selMonthData && (
        <View style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: T.green50, borderBottomWidth: 1, borderBottomColor: T.line }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: T.ink }}>{MONTHS_LONG[selMonthData.mi]} {year}</Text>
          <Text style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{selMonthData.list.length} entr{selMonthData.list.length === 1 ? 'y' : 'ies'}</Text>
        </View>
      )}
      {columnHeader}
      <ScrollView style={{ flex: 1 }}>
        {!selMonthData ? (
          <Text style={{ textAlign: 'center', color: T.faint, fontSize: 13, paddingVertical: 40 }}>
            {monthTotals.length ? 'Tap a month in the summary to see its transactions' : `No entries in ${year}`}
          </Text>
        ) : selMonthData.list.length ? renderRows(selMonthData.list) : (
          <Text style={{ textAlign: 'center', color: T.faint, fontSize: 13, paddingVertical: 40 }}>No entries this month</Text>
        )}
      </ScrollView>
    </View>
  );

  const cell = (labelText: string, value: number, color: string, last = false) => (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRightWidth: last ? 0 : 1, borderRightColor: T.line }}>
      <Text style={{ fontSize: 12, fontWeight: '600', color }}>{labelText}</Text>
      <Text style={{ fontSize: 17, fontWeight: '800', color, marginTop: 2 }} numberOfLines={1} adjustsFontSizeToFit>{fmt(value)}</Text>
    </View>
  );

  const table = period === 'monthly' ? (
    <View style={{ flex: 1, backgroundColor: T.white }}>{monthView}</View>
  ) : period === 'yearly' ? yearView : (
    <View style={{ flex: 1, backgroundColor: T.white }}>
      {isWide && columnHeader}
      <ScrollView style={{ flex: 1 }}>
        {!isWide && (
          // Phones: totals scroll with the list instead of a big fixed panel
          <View style={{ borderBottomWidth: 8, borderBottomColor: T.page }}>
            <View style={{ flexDirection: 'row' }}>
              {cell('Cash In', totalIn, T.in)}
              {cell('Cash Out', totalOut, T.out)}
              {cell('Balance', totalIn - totalOut, totalIn - totalOut < 0 ? T.out : T.ink, true)}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1, borderTopColor: T.line2 }}>
              <Text style={{ flex: 1, fontSize: 12, color: T.muted }}>Opening <Text style={{ fontWeight: '700', color: opening < 0 ? T.out : T.ink }}>{fmt(opening)}</Text></Text>
              <Text style={{ fontSize: 12, color: T.muted }}>Closing <Text style={{ fontWeight: '700', color: closing < 0 ? T.out : T.ink }}>{fmt(closing)}</Text></Text>
            </View>
          </View>
        )}
        {rows.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 48, gap: 6 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: T.faint }}>No entries for {periodLabel(period, anchor).toLowerCase()}</Text>
            <Text style={{ fontSize: 12, color: T.faint }}>Use Cash In / Cash Out below to add one.</Text>
          </View>
        ) : renderRows(rows)}
        {!isWide && <View style={{ borderTopWidth: 8, borderTopColor: T.page }}>{excelRow}</View>}
      </ScrollView>
    </View>
  );


  async function doExport() {
    setExcelMsg(null);
    if (!rows.length) return setExcelMsg({ text: 'Nothing to export in this period.', error: true });
    try {
      setBusy(true);
      const label = periodLabel(period, anchor);
      await exportCashBook(rows, systemAccounts, system, { periodLabel: label, totalIn, totalOut, opening, closing }, `BolehBudget_${system}_${range[0]}_${range[1]}`);
      setExcelMsg({ text: `Exported ${rows.length} entr${rows.length === 1 ? 'y' : 'ies'} (${label}).` });
    } catch (e: any) {
      setExcelMsg({ text: e?.message ?? 'Export failed.', error: true });
    } finally {
      setBusy(false);
    }
  }

  const cashPanel = (
    <View style={{ backgroundColor: T.white, borderTopWidth: 1, borderTopColor: T.line }}>
      <View style={{ flexDirection: 'row', gap: 10, padding: 10 }}>
        <TouchableOpacity onPress={() => setFormType('income')} style={{ flex: 1, backgroundColor: T.in, borderRadius: 6, paddingVertical: 14, alignItems: 'center', elevation: 2 }}>
          <Text style={{ color: T.white, fontWeight: '800', fontSize: 18 }}>Cash In</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFormType('expense')} style={{ flex: 1, backgroundColor: T.out, borderRadius: 6, paddingVertical: 14, alignItems: 'center', elevation: 2 }}>
          <Text style={{ color: T.white, fontWeight: '800', fontSize: 18 }}>Cash Out</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: T.line }}>
        {cell('Total Cash In', totalIn, T.in)}
        {cell('Total Cash Out', totalOut, T.out)}
        {cell('Balance', totalIn - totalOut, totalIn - totalOut < 0 ? T.out : T.ink, true)}
      </View>
      {[['Opening Balance', opening], ['Closing Balance', closing]].map(([k, v]) => (
        <View key={k as string} style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: T.line2 }}>
          <Text style={{ fontSize: 14, color: T.ink2, marginRight: 24 }}>{k}</Text>
          <Text style={{ width: 120, textAlign: 'right', fontSize: 15, fontWeight: '700', color: (v as number) < 0 ? T.out : T.in }}>{fmt(v as number)}</Text>
        </View>
      ))}
      {excelRow}
    </View>
  );

  const slimBar = (
    <View style={{ flexDirection: 'row', gap: 8, padding: 8, backgroundColor: T.white, borderTopWidth: 1, borderTopColor: T.line }}>
      <TouchableOpacity onPress={() => setFormType('income')} style={{ flex: 1, backgroundColor: T.in, borderRadius: 6, paddingVertical: 10, alignItems: 'center' }}>
        <Text style={{ color: T.white, fontWeight: '800', fontSize: 15 }}>Cash In</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setFormType('expense')} style={{ flex: 1, backgroundColor: T.out, borderRadius: 6, paddingVertical: 10, alignItems: 'center' }}>
        <Text style={{ color: T.white, fontWeight: '800', fontSize: 15 }}>Cash Out</Text>
      </TouchableOpacity>
    </View>
  );
  const footer = period === 'yearly' ? summaryPanel : period === 'monthly' ? (isWide ? monthlyPanel : null) : isWide ? cashPanel : slimBar;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.brandDark }} edges={['top']}>
      <View style={{ flex: 1, backgroundColor: T.bg }}>
        {header}
        {isWide ? (
          // Website layout: table on the left, summary panel on the right
          <View style={{ flex: 1, flexDirection: 'row', gap: 16, padding: 16 }}>
            <View style={{ flex: 1, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: T.line }}>{table}</View>
            <View style={{ width: period === 'yearly' ? 480 : period === 'monthly' ? 380 : 340, alignSelf: 'flex-start', maxHeight: '100%', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: T.line }}>
              <ScrollView>{footer}</ScrollView>
            </View>
          </View>
        ) : (
          <>
            {table}
            {footer}
          </>
        )}
      </View>


      <TxnFormModal
        visible={formType !== null}
        type={formType ?? 'expense'}
        defaultDate={period === 'monthly' && selectedDay ? selectedDay : defaultDate}
        defaultAccountId={scopeAccountId !== 'all' ? scopeAccountId : undefined}
        onClose={() => setFormType(null)}
      />
      <TxnDetailModal txn={selected} onClose={() => setSelected(null)} />
      {importing && (
        <ImportPreviewModal
          account={importing.account}
          result={importing.result}
          onClose={added => {
            setImporting(null);
            if (added !== undefined) setExcelMsg({ text: added ? `Imported ${added} entr${added === 1 ? 'y' : 'ies'} into ${importing.account.name}.` : `Balance updated for ${importing.account.name}.` });
          }}
        />
      )}
      <AddFab />
    </SafeAreaView>
  );
}
