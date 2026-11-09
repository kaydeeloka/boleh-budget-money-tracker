import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { useAppContext } from '@/src/context/AppContext';
import { Budget } from '@/src/types';
import { T, useIsWide, money, toDateStr, MONTHS_LONG } from '@/src/theme';
import Dropdown from '@/src/components/ui/Dropdown';
import { usageFor, STATUS } from './BudgetRow';

const MAX_MONTHS = 12;

/** Month the budget was created: saved startMonth, or the timestamp in its id (older budgets). */
function createdMonth(b: Budget) {
  if (b.startMonth) return b.startMonth;
  const ts = Number(b.id.match(/\d{10,}/)?.[0]);
  return ts ? toDateStr(new Date(ts)).slice(0, 7) : toDateStr(new Date()).slice(0, 7);
}

/** Month-by-month results for a budget: spent vs that month's limit, newest first. */
export default function BudgetHistory({ open, onClose, initialId }: { open: boolean; onClose: () => void; initialId?: string }) {
  const { budgets: all, expenses, scopeIds, system } = useAppContext();
  const isWide = useIsWide();
  const budgets = all.filter(b => b.currency === system);
  const [id, setId] = useState<string>('');
  useEffect(() => { if (open) setId(initialId && budgets.some(b => b.id === initialId) ? initialId : budgets[0]?.id ?? ''); }, [open, initialId]);
  const budget = budgets.find(b => b.id === id);

  const months = useMemo(() => {
    if (!budget) return [];
    // From the earliest month with spending in this currency (max 12 back) up to this month
    const now = new Date();
    const thisKey = toDateStr(now).slice(0, 7);
    const earliest = expenses.filter(e => e.currency === budget.currency && e.type !== 'income').reduce((m, e) => (e.date < m ? e.date : m), thisKey).slice(0, 7);
    const out: string[] = [];
    for (let i = 0; i < MAX_MONTHS; i++) {
      const k = toDateStr(new Date(now.getFullYear(), now.getMonth() - i, 1)).slice(0, 7);
      if (k < earliest && i > 0) break;
      out.push(k);
    }
    const created = createdMonth(budget);
    return out.map(k => ({ key: k, before: k < created, current: k === thisKey, ...usageFor(budget, expenses, scopeIds, k) }));
  }, [budget, expenses, scopeIds]);

  const finished = months.filter(m => !m.current);
  const overCount = finished.filter(m => m.status === 'over').length;
  const avg = finished.length ? finished.reduce((t, m) => t + m.spent, 0) / finished.length : 0;
  const fmt = (n: number) => money(n, system);
  const label = (k: string) => { const [y, m] = k.split('-').map(Number); return `${MONTHS_LONG[m - 1].slice(0, 3)} ${y}`; };

  return (
    <Modal visible={open} transparent animationType={isWide ? 'fade' : 'slide'} onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(28,25,23,0.45)', justifyContent: isWide ? 'center' : 'flex-end', alignItems: 'center', padding: isWide ? 24 : 0 }}>
        <Pressable onPress={() => {}} style={{ width: '100%', maxWidth: isWide ? 520 : undefined, height: isWide ? '80%' : '85%', backgroundColor: T.white, borderRadius: isWide ? 14 : 0, borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden' }}>
          <View style={{ backgroundColor: T.brand, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ flex: 1, color: T.white, fontSize: 18, fontWeight: '800' }}>Budget History</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close" style={{ padding: 4 }}>
              <X size={20} color={T.white} />
            </TouchableOpacity>
          </View>

          {budgets.length === 0 ? (
            <Text style={{ textAlign: 'center', color: T.faint, padding: 32 }}>No {system} budgets yet.</Text>
          ) : (
            <>
              <View style={{ padding: 12, gap: 10, borderBottomWidth: 1, borderBottomColor: T.line }}>
                <Dropdown
                  title="Budget"
                  options={budgets.map(b => ({ label: `${b.category === 'all' ? 'All spending' : b.category} · ${fmt(b.amount)}/month`, value: b.id }))}
                  selectedValue={id}
                  onValueChange={setId}
                />
                {finished.length > 0 && (
                  <View style={{ flexDirection: 'row' }}>
                    <View style={{ flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: T.line }}>
                      <Text style={{ fontSize: 11, color: T.muted }}>Over budget</Text>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: overCount ? T.out : T.in }}>{overCount} of {finished.length} months</Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, color: T.muted }}>Average spent</Text>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: T.ink }}>{fmt(avg)}</Text>
                    </View>
                  </View>
                )}
              </View>

              <ScrollView style={{ flex: 1 }}>
                {months.map((m, i) => {
                  const st = STATUS[m.status];
                  return (
                    <View key={m.key} style={{ paddingHorizontal: 16, paddingVertical: 11, gap: 6, backgroundColor: i % 2 ? '#fcfcfb' : T.white, borderBottomWidth: 1, borderBottomColor: T.line2, opacity: m.before ? 0.7 : 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: T.ink }}>
                          {label(m.key)}
                          {m.current ? <Text style={{ fontSize: 11, fontWeight: '600', color: T.muted }}>  · this month</Text> : null}
                          {m.before ? <Text style={{ fontSize: 11, fontWeight: '600', color: T.muted }}>  · before budget</Text> : null}
                        </Text>
                        <st.Icon size={13} color={st.color} />
                        <Text style={{ fontSize: 11, fontWeight: '800', color: st.color }}>{st.label}</Text>
                      </View>
                      <View style={{ height: 8, borderRadius: 4, backgroundColor: T.line2 }}>
                        <View style={{ width: `${Math.min(100, m.pct)}%` as any, height: 8, borderRadius: 4, backgroundColor: st.color }} />
                      </View>
                      <View style={{ flexDirection: 'row' }}>
                        <Text style={{ flex: 1, fontSize: 12, color: T.muted }}>
                          <Text style={{ fontWeight: '700', color: T.ink }}>{fmt(m.spent)}</Text> of {fmt(m.limit)} · {m.pct.toFixed(0)}%
                        </Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: m.left < 0 ? T.out : T.in }}>
                          {m.left < 0 ? `Over by ${fmt(-m.left)}` : `Saved ${fmt(m.left)}`}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
