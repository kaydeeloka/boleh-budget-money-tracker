import React, { useState, useMemo, useEffect } from 'react';
import AddFab from '@/src/features/transactions/AddFab';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { BarChart2, Search, PieChart } from 'lucide-react-native';
import CategoryPie from '@/src/features/transactions/CategoryPie';
import { categoryStyle, categoryLabel } from '@/src/categories';
import { useLocalSearchParams } from 'expo-router';
import { useAppContext } from '@/src/context/AppContext';
import { Expense } from '@/src/types';
import Dropdown from '@/src/components/ui/Dropdown';
import TxnDetailModal from '@/src/features/transactions/TxnDetailModal';
import { T, money, fmtDate, byNewest, MONTHS_LONG } from '@/src/theme';
import { Page, AppBar, SubBar, Body, Section, StatCells, Row, Amount, Empty, Progress, KeyValue } from '@/src/components/ui/Ledger';


export default function StatsScreen() {
  const { expenses, accounts, categories, exchangeRate, system: profile, scopeIds, scopeName } = useAppContext();

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [detail, setDetail] = useState<Expense | null>(null);
  const [chart, setChartState] = useState<'bars' | 'pie'>('bars');
  // Category breakdown for expenses or income (/expenses?show=income opens on income)
  const { show } = useLocalSearchParams<{ show?: string }>();
  const [kind, setKind] = useState<'expense' | 'income'>('expense');
  useEffect(() => { if (show === 'income' || show === 'expense') setKind(show); }, [show]);
  const isKind = (e: { type?: string }) => (kind === 'income' ? e.type === 'income' : e.type !== 'income');
  // Remember Bar / Pie between visits
  useEffect(() => { AsyncStorage.getItem('saku_stats_chart').then(v => { if (v === 'bars' || v === 'pie') setChartState(v); }).catch(() => {}); }, []);
  const setChart = (k: 'bars' | 'pie') => { setChartState(k); AsyncStorage.setItem('saku_stats_chart', k).catch(() => {}); };

  const shiftMonth = (d: -1 | 1) => {
    const n = new Date(viewYear, viewMonth + d, 1);
    setViewYear(n.getFullYear()); setViewMonth(n.getMonth());
  };
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();

  const monthKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  const monthItems = useMemo(
    () => expenses.filter(e => scopeIds.has(e.accountId) && !e.transferId && e.date.startsWith(monthKey)), // transfers aren't income/spending
    [expenses, scopeIds, monthKey],
  );
  const monthIncome = monthItems.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const monthSpend = monthItems.filter(e => e.type !== 'income').reduce((s, e) => s + e.amount, 0);
  const monthNet = monthIncome - monthSpend;

  // Spending by category for the selected month
  const catSums = useMemo(() => {
    const sums: Record<string, number> = {};
    monthItems.filter(isKind).forEach(e => { sums[e.category] = (sums[e.category] || 0) + e.amount; });
    return sums;
  }, [monthItems, kind]);
  // Subcategory breakdown inside each category
  const subSums = useMemo(() => {
    const m: Record<string, Record<string, number>> = {};
    monthItems.filter(isKind).forEach(e => {
      const sub = e.subcategory || 'Other';
      (m[e.category] ??= {})[sub] = (m[e.category]?.[sub] || 0) + e.amount;
    });
    return m;
  }, [monthItems, kind]);
  const totalSpend = Object.values(catSums).reduce((s, v) => s + v, 0);
  const catRows = Object.entries(catSums).sort((a, b) => b[1] - a[1]);

  const logItems = useMemo(
    () => expenses.filter(e => {
      if (!scopeIds.has(e.accountId)) return false;
      const q = search.toLowerCase();
      if (q && !e.note.toLowerCase().includes(q) && !categoryLabel(e).toLowerCase().includes(q)) return false;
      if (filterCat !== 'all' && e.category !== filterCat) return false;
      return true;
    }).sort(byNewest),
    [expenses, scopeIds, search, filterCat],
  );

  const catStyle = (name: string) => categoryStyle(categories, name);
  const other = (v: number) => profile === 'KRW' ? money((v / 1000) * exchangeRate, 'MYR') : money(v * (1000 / exchangeRate), 'KRW');

  const categories_ = (
    <Section
      title={kind === 'income' ? 'Income by Category' : 'Spending by Category'}
      subtitle={`${MONTHS_LONG[viewMonth]} ${viewYear}`}
      right={
        <View style={{ flexDirection: 'row', borderWidth: 1, borderColor: T.line, borderRadius: 6, overflow: 'hidden' }}>
          {(['bars', 'pie'] as const).map(k => (
            <TouchableOpacity
              key={k}
              onPress={() => setChart(k)}
              accessibilityRole="tab"
              accessibilityState={{ selected: chart === k }}
              accessibilityLabel={k === 'bars' ? 'Bar chart' : 'Pie chart'}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: chart === k ? T.brand : T.white }}
            >
              {k === 'bars' ? <BarChart2 size={13} color={chart === k ? T.white : T.ink2} /> : <PieChart size={13} color={chart === k ? T.white : T.ink2} />}
              <Text style={{ fontSize: 12, fontWeight: '700', color: chart === k ? T.white : T.ink2 }}>{k === 'bars' ? 'Bar' : 'Pie'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      }
    >
      <View style={{ flexDirection: 'row', gap: 6, padding: 10, borderBottomWidth: 1, borderBottomColor: T.line2 }}>
        {(['expense', 'income'] as const).map(k => (
          <TouchableOpacity key={k} onPress={() => setKind(k)} accessibilityRole="tab" accessibilityState={{ selected: kind === k }}
            style={{ flex: 1, paddingVertical: 7, borderRadius: 6, alignItems: 'center', borderWidth: 1.5, borderColor: kind === k ? (k === 'income' ? T.in : T.out) : T.line, backgroundColor: kind === k ? (k === 'income' ? T.in : T.out) : T.white }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: kind === k ? T.white : T.ink2 }}>{k === 'income' ? 'Income' : 'Expense'}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {catRows.length > 0 && chart === 'pie' && (
        <CategoryPie
          total={totalSpend}
          centerLabel={kind === 'income' ? 'Total income' : 'Total spent'}
          format={v => money(v, profile)}
          slices={catRows.map(([name, spent]) => ({ key: name, label: name, value: spent, color: catStyle(name).color }))}
        />
      )}
      {catRows.length === 0 ? <Empty text={kind === 'income' ? 'No income this month' : 'No spending this month'} /> : chart === 'bars' && catRows.map(([name, spent], i) => {
        const pct = totalSpend ? (spent / totalSpend) * 100 : 0;
        const { Icon, color } = catStyle(name);
        return (
          <View key={name} style={{ paddingHorizontal: 16, paddingVertical: 10, gap: 6, backgroundColor: i % 2 ? '#fcfcfb' : T.white, borderBottomWidth: 1, borderBottomColor: T.line2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon size={16} color={color} />
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: T.ink }}>{name}</Text>
              <Text style={{ fontSize: 12, color: T.muted, width: 40, textAlign: 'right' }}>{pct.toFixed(0)}%</Text>
              <Amount value={money(spent, profile)} color={kind === 'income' ? T.in : T.out} size={14} width={100} />
            </View>
            <Progress pct={pct} color={color} />
            {Object.keys(subSums[name] ?? {}).length > 1 || (subSums[name] && !subSums[name].Other) ? (
              <View style={{ paddingLeft: 24, gap: 2 }}>
                {Object.entries(subSums[name]).sort((a, b) => b[1] - a[1]).map(([sub, v]) => (
                  <View key={sub} style={{ flexDirection: 'row' }}>
                    <Text style={{ flex: 1, fontSize: 12, color: T.muted }}>{sub}</Text>
                    <Text style={{ fontSize: 12, color: T.ink2, fontWeight: '600' }}>{money(v, profile)}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
      {totalSpend > 0 && <KeyValue label={`${kind === 'income' ? 'Total income' : 'Total spent'} (≈ ${other(totalSpend)})`} value={money(totalSpend, profile)} color={kind === 'income' ? T.in : T.out} />}
    </Section>
  );

  const log = (
    <Section title="Transaction Log" subtitle={`${logItems.length} transaction${logItems.length !== 1 ? 's' : ''} · tap one for details`}>
      <View style={{ padding: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: T.line }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: T.line, borderRadius: 6, paddingHorizontal: 10 }}>
          <Search size={15} color={T.faint} />
          <TextInput style={{ flex: 1, paddingVertical: 8, fontSize: 14, color: T.ink }} placeholder="Search note or category…" placeholderTextColor={T.faint} value={search} onChangeText={setSearch} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Dropdown compact options={[{ label: 'All Categories', value: 'all' }, ...categories.map(c => ({ label: c.name, value: c.name }))]} selectedValue={filterCat} onValueChange={setFilterCat} title="Filter by Category" />
          </View>
        </View>
      </View>
      {logItems.length === 0 ? <Empty text="No transactions match your filters" /> : logItems.slice(0, 200).map((e, i) => {
        const isIn = e.type === 'income';
        const acc = accounts.find(a => a.id === e.accountId);
        return (
          <Row
            key={e.id}
            index={i}
            caption={`${fmtDate(e.date)} · ${acc?.bankName ?? '—'}`}
            title={e.note}
            detail={categoryLabel(e)}
            onPress={() => setDetail(e)}
            right={<Amount value={`${isIn ? '+' : '−'}${money(e.amount, e.currency)}`} color={isIn ? T.in : T.out} />}
          />
        );
      })}
    </Section>
  );

  return (
    <Page>
      <AppBar icon={<BarChart2 size={20} color="rgba(255,255,255,0.85)" />} title="Stats" subtitle={`${profile} · ${scopeName}`}>
        <SubBar
          label={`${MONTHS_LONG[viewMonth]} ${viewYear}`}
          onPrev={() => shiftMonth(-1)}
          onNext={() => shiftMonth(1)}
          nextDisabled={isCurrentMonth}
          onLabel={() => { setViewYear(now.getFullYear()); setViewMonth(now.getMonth()); }}
        />
      </AppBar>
      <View style={{ borderBottomWidth: 1, borderBottomColor: T.line }}>
        <StatCells cells={[
          { label: 'Income', value: money(monthIncome, profile), color: T.in },
          { label: 'Spent', value: money(monthSpend, profile), color: T.out },
          { label: 'Net', value: money(monthNet, profile), color: monthNet < 0 ? T.out : T.ink },
        ]} />
      </View>
      <ScrollView style={{ flex: 1 }}>
        <Body aside={categories_} asideWidth={420} asideFirst>{log}</Body>
      </ScrollView>
      <TxnDetailModal txn={detail} onClose={() => setDetail(null)} />
      <AddFab />
    </Page>
  );
}
