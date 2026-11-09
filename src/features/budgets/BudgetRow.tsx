import React from 'react';
import { View, Text } from 'react-native';
import { AlertTriangle, CheckCircle2, Clock3 } from 'lucide-react-native';
import { Budget, Expense } from '@/src/types';
import { T, money, toDateStr } from '@/src/theme';
import { categoryStyle } from '@/src/categories';
import type { BudgetCategory } from '@/src/types';

export type BudgetStatus = 'ok' | 'near' | 'over';

/** The limit that applied in a given month (YYYY-MM). Months before the budget existed use its first limit. */
export function limitFor(b: Budget, month: string) {
  const limits = b.limits?.length ? b.limits : [{ from: b.startMonth ?? '0000-00', amount: b.amount }];
  let amt = limits[0].amount;
  for (const l of limits) if (l.from <= month) amt = l.amount;
  return amt;
}

/** Spending against a budget for one month (expenses only, no transfers, accounts in scope). */
export function usageFor(b: Budget, expenses: Expense[], scopeIds: Set<string>, month: string) {
  const spent = expenses
    .filter(e => e.type !== 'income' && !e.transferId && e.currency === b.currency && scopeIds.has(e.accountId) && e.date.startsWith(month))
    .filter(e => b.category === 'all' || e.category === b.category)
    .reduce((t, e) => t + e.amount, 0);
  const limit = limitFor(b, month);
  const pct = limit > 0 ? (spent / limit) * 100 : 0;
  const status: BudgetStatus = pct > 100 ? 'over' : pct >= 80 ? 'near' : 'ok';
  return { spent, limit, pct, status, left: limit - spent };
}

/** This month's spending against a budget, plus how far through the month we are. */
export function budgetUsage(b: Budget, expenses: Expense[], scopeIds: Set<string>, now = new Date()) {
  const u = usageFor(b, expenses, scopeIds, toDateStr(now).slice(0, 7));
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return { ...u, daysLeft: daysInMonth - now.getDate(), monthPct: (now.getDate() / daysInMonth) * 100 };
}

// Status colours always come with an icon + label (never colour alone)
export const STATUS = {
  ok: { color: '#15803d', label: 'On track', Icon: CheckCircle2 },
  near: { color: '#b45309', label: 'Almost', Icon: Clock3 },
  over: { color: '#dc2626', label: 'OVER BUDGET', Icon: AlertTriangle },
} as const;

export default function BudgetRow({ budget, expenses, scopeIds, categories, right, index = 0 }: {
  budget: Budget; expenses: Expense[]; scopeIds: Set<string>; categories: BudgetCategory[];
  right?: React.ReactNode; index?: number;
}) {
  const u = budgetUsage(budget, expenses, scopeIds);
  const st = STATUS[u.status];
  const name = budget.category === 'all' ? 'All spending' : budget.category;
  const { Icon: CatIcon, color: catColor } = categoryStyle(categories, budget.category);
  const fmt = (n: number) => money(n, budget.currency);

  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 12, gap: 7, backgroundColor: index % 2 ? '#fcfcfb' : T.white, borderBottomWidth: 1, borderBottomColor: T.line2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {budget.category === 'all' ? <View style={{ width: 16 }} /> : <CatIcon size={16} color={catColor} />}
        <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: T.ink }} numberOfLines={1}>{name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: u.status === 'over' ? '#fef2f2' : u.status === 'near' ? '#fffbeb' : '#f0fdf4' }}>
          <st.Icon size={12} color={st.color} />
          <Text style={{ fontSize: 11, fontWeight: '800', color: st.color }}>{st.label}</Text>
        </View>
        {right}
      </View>

      {/* Bar: fill = spent; thin dark tick = how far through the month we are */}
      <View style={{ height: 10, borderRadius: 5, backgroundColor: T.line2, overflow: 'visible' }}>
        <View style={{ width: `${Math.min(100, u.pct)}%` as any, height: 10, borderRadius: 5, backgroundColor: st.color }} />
        <View style={{ position: 'absolute', left: `${u.monthPct}%` as any, top: -3, width: 2, height: 16, backgroundColor: T.ink, borderRadius: 1 }} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
        <Text style={{ flex: 1, fontSize: 12, color: T.muted }}>
          <Text style={{ fontWeight: '700', color: T.ink }}>{fmt(u.spent)}</Text> of {fmt(u.limit)} · {u.pct.toFixed(0)}%
        </Text>
        <Text style={{ fontSize: 12, fontWeight: '700', color: u.left < 0 ? st.color : T.ink2 }}>
          {u.left < 0 ? `Over by ${fmt(-u.left)}` : `${fmt(u.left)} left · ${u.daysLeft}d`}
        </Text>
      </View>
    </View>
  );
}
