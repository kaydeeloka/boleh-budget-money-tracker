import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Wallet, Settings, Eye, EyeOff, Plus, Landmark, Repeat } from 'lucide-react-native';
import { useAppContext } from '@/src/context/AppContext';
import { cardColorFor } from '@/src/features/accounts/BankCard';
import { budgetUsage } from '@/src/features/budgets/BudgetRow';
import { T, money, fmtDate } from '@/src/theme';
import { FREQ_LABEL, monthlyEquivalent } from '@/src/schedules';
import { Page, AppBar, BarButton, Body, Section, Progress } from '@/src/components/ui/Ledger';

/**
 * Account hub (phones' "Account" tab): balance, account tiles, and short previews of
 * budgets, goals, debts and recurring entries — each linking to its full page.
 */
export default function AccountHub() {
  const router = useRouter();
  const { system, systemAccounts, scopeIds, expenses, budgets: allBudgets, goals: allGoals, records: allRecords, schedules } = useAppContext();
  const [hidden, setHidden] = useState(false);

  const accounts = systemAccounts.filter(a => scopeIds.has(a.id));
  const total = accounts.reduce((t, a) => t + a.balance, 0);
  const budgets = allBudgets.filter(b => b.currency === system);
  const goals = allGoals.filter(g => g.currency === system);
  const debts = allRecords.filter(r => r.currency === system && r.status !== 'paid');
  const recurring = schedules.filter(s => s.active && s.currency === system).sort((a, b) => a.nextDate.localeCompare(b.nextDate));
  const fmt = (n: number) => money(n, system);
  const subsMonthly = recurring.filter(s => s.category === 'Subscriptions' && s.type === 'expense').reduce((t, s) => t + monthlyEquivalent(s), 0);

  const manage = (label: string, href: string) => (
    <TouchableOpacity onPress={() => router.navigate(href as any)} style={{ paddingHorizontal: 6, paddingVertical: 2 }}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: T.brand }}>{label}</Text>
    </TouchableOpacity>
  );
  const addRow = (label: string, href: string) => (
    <TouchableOpacity onPress={() => router.navigate(href as any)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12 }}>
      <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: T.faint, alignItems: 'center', justifyContent: 'center' }}>
        <Plus size={15} color={T.ink2} />
      </View>
      <Text style={{ fontSize: 14, fontWeight: '700', color: T.ink }}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Page>
      <AppBar
        icon={<Wallet size={20} color="rgba(255,255,255,0.85)" />}
        title="Account"
        subtitle={system}
        right={<BarButton icon={<Settings size={16} color={T.white} />} onPress={() => router.navigate('/stats')} label="Settings" />}
      />
      <ScrollView style={{ flex: 1 }}>
        <Body>
          {/* Balance */}
          <View style={{ backgroundColor: T.white, alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: T.line }}>
            <Text style={{ fontSize: 13, color: T.muted }}>Account balance</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <Text style={{ fontSize: 28, fontWeight: '800', color: total < 0 ? T.out : T.ink }}>{hidden ? '••••••' : fmt(total)}</Text>
              <TouchableOpacity onPress={() => setHidden(h => !h)} accessibilityLabel={hidden ? 'Show balance' : 'Hide balance'}>
                {hidden ? <EyeOff size={18} color={T.faint} /> : <Eye size={18} color={T.faint} />}
              </TouchableOpacity>
            </View>
          </View>

          {/* Wallet tiles */}
          <Section title="WALLET" right={manage(`Manage (${accounts.length})`, '/accounts')}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 10 }}>
              {accounts.map(a => (
                <TouchableOpacity key={a.id} onPress={() => router.navigate('/accounts')} style={{ width: '48.5%' as any, borderRadius: 10, padding: 12, alignItems: 'center', gap: 6, backgroundColor: cardColorFor(a) }}>
                  <View style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                    <Landmark size={18} color={T.white} />
                  </View>
                  <Text style={{ color: T.white, fontSize: 14, fontWeight: '700' }} numberOfLines={1}>{a.name}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }} numberOfLines={1}>{hidden ? '••••' : money(a.balance, a.currency)}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => router.navigate('/accounts')} accessibilityLabel="Add account" style={{ width: '48.5%' as any, minHeight: 96, borderRadius: 10, borderWidth: 1.5, borderStyle: 'dashed', borderColor: T.faint, alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={26} color={T.ink2} />
              </TouchableOpacity>
            </View>
          </Section>

          {/* Budgets */}
          <Section title="BUDGET" subtitle="Monthly" right={manage(`Manage (${budgets.length})`, '/goals-debts')}>
            {budgets.map(b => {
              const u = budgetUsage(b, expenses, scopeIds);
              return (
                <View key={b.id} style={{ paddingHorizontal: 16, paddingVertical: 10, gap: 6, borderBottomWidth: 1, borderBottomColor: T.line2 }}>
                  <View style={{ flexDirection: 'row' }}>
                    <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: T.ink }}>{b.category === 'all' ? 'All spending' : b.category}</Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: u.left < 0 ? T.out : T.ink2 }}>{u.left < 0 ? `Over ${fmt(-u.left)}` : `Remain ${fmt(u.left)}`}</Text>
                  </View>
                  <Progress pct={u.pct} color={u.status === 'over' ? T.out : u.status === 'near' ? '#b45309' : T.in} />
                </View>
              );
            })}
            {addRow('Add Budget', '/goals-debts')}
          </Section>

          {/* Goals */}
          <Section title="GOAL" right={manage('Manage', '/goals-debts')}>
            {goals.map(g => {
              const pct = Math.min(100, (g.currentAmount / g.targetAmount) * 100);
              return (
                <View key={g.id} style={{ paddingHorizontal: 16, paddingVertical: 10, gap: 6, borderBottomWidth: 1, borderBottomColor: T.line2 }}>
                  <View style={{ flexDirection: 'row' }}>
                    <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: T.ink }} numberOfLines={1}>{g.title}</Text>
                    <Text style={{ fontSize: 13, color: T.ink2 }}>{fmt(g.currentAmount)} / {fmt(g.targetAmount)}</Text>
                  </View>
                  <Progress pct={pct} />
                </View>
              );
            })}
            {addRow('Add Goal', '/goals-debts')}
          </Section>

          {/* Debts */}
          <Section title="DEBT" right={manage(`Manage (${debts.length})`, '/goals-debts')}>
            {debts.map(r => (
              <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: T.line2 }}>
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: T.brandSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontWeight: '800', color: T.brandDark }}>{r.person.trim()[0]?.toUpperCase() ?? '?'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: T.ink }} numberOfLines={1}>{r.type === 'borrow' ? `I owe ${r.person}` : `${r.person} owes me`}</Text>
                  {!!r.note && <Text style={{ fontSize: 12, color: T.muted }} numberOfLines={1}>{r.note}</Text>}
                </View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: r.type === 'borrow' ? T.out : T.in }}>{r.type === 'borrow' ? '-' : ''}{fmt(r.amount - r.repaidAmount)}</Text>
              </View>
            ))}
            {addRow('Add Debt', '/goals-debts')}
          </Section>

          {/* Recurring */}
          <Section
            title="RECURRING"
            subtitle={`Subscriptions & scheduled${subsMonthly ? ` · subscriptions ≈ ${fmt(subsMonthly)}/month` : ''}`}
            right={manage(`Manage (${recurring.length})`, '/scheduled')}
          >
            {recurring.slice(0, 6).map(s => (
              <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: T.line2 }}>
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: T.line2, alignItems: 'center', justifyContent: 'center' }}>
                  <Repeat size={16} color={T.ink2} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ flexShrink: 1, fontSize: 14, fontWeight: '700', color: T.ink }} numberOfLines={1}>{s.note}</Text>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: s.category === 'Subscriptions' ? '#4f46e5' : T.muted, borderWidth: 1, borderColor: s.category === 'Subscriptions' ? '#c7d2fe' : T.line, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
                      {s.category === 'Subscriptions' ? 'Subscription' : 'Scheduled'}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 12, color: T.muted }}>{FREQ_LABEL[s.frequency]} · next {fmtDate(s.nextDate)}</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: s.type === 'income' ? T.in : T.out }}>{s.type === 'income' ? '+' : '-'}{fmt(s.amount)}</Text>
              </View>
            ))}
            {addRow('Add Subscription', '/scheduled?add=sub')}
            {addRow('Add Scheduled', '/scheduled?add=other')}
          </Section>
        </Body>
      </ScrollView>
    </Page>
  );
}
