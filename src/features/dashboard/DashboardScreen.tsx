import React, { useMemo, useState } from 'react';
import AddFab from '@/src/features/transactions/AddFab';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LayoutDashboard, ArrowLeftRight, ChevronRight } from 'lucide-react-native';
import { useAppContext } from '@/src/context/AppContext';
import CurrencyConverter from '@/src/features/dashboard/CurrencyConverter';
import MonthSummaryCard from '@/src/features/transactions/MonthSummaryCard';
import TransferModal from '@/src/features/transactions/TransferModal';
import BudgetRow, { budgetUsage } from '@/src/features/budgets/BudgetRow';
import BudgetHistory from '@/src/features/budgets/BudgetHistory';
import { cardColorFor } from '@/src/features/accounts/BankCard';
import { T, money, toDateStr, fmtDate, MONTHS_LONG, useIsWide } from '@/src/theme';
import { Page, AppBar, Body, Section, Btn } from '@/src/components/ui/Ledger';

/** 1234567 → "1.2M", 16800 → "16.8k" (₩) ; RM keeps decimals */
function compact(n: number, cur: 'KRW' | 'MYR') {
  if (cur === 'MYR') return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toFixed(0);
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(Math.round(n));
}

export default function OverviewTab() {
  const { exchangeRate, expenses, system, systemAccounts, scopeIds, scopeName, handleUseCalculatedAmount, setQuickAmountToFill, budgets: allBudgets, categories } = useAppContext();
  const router = useRouter();
  const [transferOpen, setTransferOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const isWide = useIsWide();

  // Entries in scope, without transfers (moving your own money isn't income or spending)
  const real = useMemo(() => expenses.filter(e => scopeIds.has(e.accountId) && !e.transferId), [expenses, scopeIds]);

  // Summary: this month + last month
  const now = new Date();
  const months = [0, 1].map(back => {
    const d = new Date(now.getFullYear(), now.getMonth() - back, 1);
    const key = toDateStr(d).slice(0, 7);
    const list = real.filter(e => e.date.startsWith(key));
    return {
      key, title: `${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`, short: `${MONTHS_LONG[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`,
      inAmt: list.filter(e => e.type === 'income').reduce((t, e) => t + e.amount, 0),
      outAmt: list.filter(e => e.type !== 'income').reduce((t, e) => t + e.amount, 0),
    };
  });

  // Expenses, last 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6 + i);
    const ds = toDateStr(d);
    return { ds, label: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`, value: real.filter(e => e.date === ds && e.type !== 'income').reduce((t, e) => t + e.amount, 0) };
  });
  const maxDay = Math.max(...days.map(d => d.value), 1);
  const weekTotal = days.reduce((t, d) => t + d.value, 0);

  // Accounts in the chosen system, with last-used date
  const accounts = systemAccounts.filter(a => scopeIds.has(a.id));
  const lastUsed = (id: string) => expenses.filter(e => e.accountId === id).reduce<string | null>((m, e) => (!m || e.date > m ? e.date : m), null);
  const total = accounts.reduce((t, a) => t + a.balance, 0);

  const summary = (
    <Section title="Summary" subtitle="Tap a month to open it in the Cash Book">
      {/* Always one row, two columns; phones get the compact card with short month names */}
      <View style={{ flexDirection: 'row', gap: isWide ? 10 : 8, padding: isWide ? 12 : 8 }}>
        {months.map(m => (
          <View key={m.key} style={{ flex: 1, minWidth: 0 }}>
            <MonthSummaryCard compact={!isWide} title={isWide ? m.title : m.short} inAmt={m.inAmt} outAmt={m.outAmt} currency={system} onPress={() => router.navigate('/cashbook?view=monthly')} />
          </View>
        ))}
      </View>
    </Section>
  );

  const accountsCard = (
    <Section
      title="Accounts"
      subtitle={`${system} · ${scopeName}`}
      right={<Btn small label="Transfer" icon={<ArrowLeftRight size={13} color={T.white} />} onPress={() => setTransferOpen(true)} />}
    >
      {accounts.length === 0 ? (
        <Text style={{ textAlign: 'center', color: T.faint, padding: 24 }}>No {system} accounts yet</Text>
      ) : accounts.map((a, i) => {
        const used = lastUsed(a.id);
        return (
          <TouchableOpacity key={a.id} onPress={() => router.navigate('/accounts')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: i % 2 ? '#fcfcfb' : T.white, borderBottomWidth: 1, borderBottomColor: T.line2 }}>
            <View style={{ width: 8, height: 34, borderRadius: 4, backgroundColor: cardColorFor(a) }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, color: T.ink, fontWeight: '600' }} numberOfLines={1}>{a.name}</Text>
              <Text style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{used ? `Last used: ${fmtDate(used)}` : a.bankName}</Text>
            </View>
            <Text style={{ fontSize: 17, fontWeight: '800', color: a.balance < 0 ? T.out : T.in }}>{money(a.balance, a.currency)}</Text>
            <ChevronRight size={16} color={T.faint} />
          </TouchableOpacity>
        );
      })}
      {accounts.length > 1 && (
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10 }}>
          <Text style={{ flex: 1, fontSize: 14, color: T.ink2 }}>Total</Text>
          <Text style={{ fontSize: 16, fontWeight: '800', color: total < 0 ? T.out : T.in }}>{money(total, system)}</Text>
        </View>
      )}
    </Section>
  );

  // Budgets: over-budget first, then by % used
  const budgets = allBudgets
    .filter(b => b.currency === system)
    .map(b => ({ b, u: budgetUsage(b, expenses, scopeIds) }))
    .sort((x, y) => y.u.pct - x.u.pct);
  const overCount = budgets.filter(x => x.u.status === 'over').length;
  const budgetsCard = (
    <Section
      title="Budgets"
      subtitle={budgets.length ? (overCount ? `${overCount} over budget this month` : 'All within budget this month') : 'No budgets yet'}
      right={
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {budgets.length > 0 && <Btn small kind="ghost" label="History" onPress={() => setHistoryOpen(true)} />}
          <Btn small kind="ghost" label={budgets.length ? 'Manage' : '+ Budget'} onPress={() => router.navigate('/goals-debts')} />
        </View>
      }
    >
      {budgets.length === 0 ? (
        <Text style={{ textAlign: 'center', color: T.faint, padding: 20 }}>Set monthly limits in Tabung → Monthly Budgets.</Text>
      ) : budgets.map(({ b }, i) => <BudgetRow key={b.id} budget={b} expenses={expenses} scopeIds={scopeIds} categories={categories} index={i} />)}
    </Section>
  );

  const week = (
    <Section title="Expenses – last 7 days" subtitle={`${money(weekTotal, system)} in total`}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 16, paddingTop: 24, height: 190 }}>
        {days.map(d => {
          const h = d.value ? Math.max(4, (d.value / maxDay) * 120) : 0;
          return (
            <View key={d.ds} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' }} accessibilityLabel={`${d.label}: ${money(d.value, system)}`}>
              <Text style={{ fontSize: 11, color: T.ink2, marginBottom: 4 }} numberOfLines={1}>{compact(d.value, system)}</Text>
              <View style={{ width: '100%', maxWidth: 44, height: h, backgroundColor: T.out, borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 12, borderTopWidth: 1, borderTopColor: T.ink2, marginHorizontal: 0 }}>
        {days.map(d => (
          <Text key={d.ds} style={{ flex: 1, textAlign: 'center', fontSize: 11, color: d.ds === toDateStr(now) ? T.ink : T.muted, fontWeight: d.ds === toDateStr(now) ? '800' : '400', paddingTop: 6 }}>{d.label}</Text>
        ))}
      </View>
    </Section>
  );

  return (
    <Page>
      <AppBar
        icon={<LayoutDashboard size={20} color="rgba(255,255,255,0.85)" />}
        title="Overview"
        subtitle={`${system} · ${scopeName}`}
      />
      <ScrollView style={{ flex: 1 }}>
        <Body
          aside={
            <CurrencyConverter
              exchangeRate={exchangeRate}
              onUseCalculatedAmount={(amt, curr) => { handleUseCalculatedAmount(amt, curr); setQuickAmountToFill(amt); }}
            />
          }
        >
          {summary}
          {budgetsCard}
          {accountsCard}
          {week}
        </Body>
      </ScrollView>
      <TransferModal open={transferOpen} onClose={() => setTransferOpen(false)} />
      <BudgetHistory open={historyOpen} onClose={() => setHistoryOpen(false)} />
      <AddFab />
    </Page>
  );
}
