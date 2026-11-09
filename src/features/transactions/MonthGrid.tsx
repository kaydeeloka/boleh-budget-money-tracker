import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Expense } from '@/src/types';
import { T, toDateStr, fmtDate } from '@/src/theme';

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const ACCENT = '#d97706'; // weekday letters

interface Props {
  year: number;
  month: number;                       // 0-11
  selected: string | null;             // YYYY-MM-DD
  onSelect: (date: string) => void;
  byDate: Record<string, Expense[]>;   // entries per day → green/red dots
  scheduled?: Set<string>;             // future scheduled dates → grey dot
  showAmounts?: boolean;               // show each day's in / out as short numbers instead of dots
}

/** 35000 → "35k", 1948650 → "1.9M", RM 12.5 → "12.5" */
function short(n: number) {
  if (n >= 1e6) return `${+(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${+(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}k`;
  return `${+n.toFixed(n % 1 ? 1 : 0)}`;
}

/** Sunday-first month grid: selected day = filled circle, today = ring, dots = cash in / cash out. */
export default function MonthGrid({ year, month, selected, onSelect, byDate, scheduled, showAmounts }: Props) {
  const cellH = showAmounts ? 66 : 48;
  const today = toDateStr(new Date());
  const lead = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const w = `${100 / 7}%` as any;

  return (
    <View>
      <View style={{ flexDirection: 'row' }}>
        {DAY_LETTERS.map((d, i) => (
          <Text key={i} style={{ width: w, textAlign: 'center', fontSize: 14, fontWeight: '600', color: ACCENT, paddingVertical: 6 }}>{d}</Text>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((d, i) => {
          if (d === null) return <View key={i} style={{ width: w, height: cellH }} />;
          const ds = toDateStr(new Date(year, month, d));
          const items = byDate[ds] ?? [];
          const hasIn = items.some(e => e.type === 'income');
          const hasOut = items.some(e => e.type !== 'income');
          const inSum = items.filter(e => e.type === 'income').reduce((t, e) => t + e.amount, 0);
          const outSum = items.filter(e => e.type !== 'income').reduce((t, e) => t + e.amount, 0);
          const isSel = ds === selected;
          const isToday = ds === today;
          return (
            <TouchableOpacity key={i} onPress={() => onSelect(ds)} style={{ width: w, height: cellH, alignItems: 'center', justifyContent: showAmounts ? 'flex-start' : 'center', paddingTop: showAmounts ? 4 : 0, borderTopWidth: showAmounts ? 1 : 0, borderTopColor: T.line2 }} accessibilityLabel={fmtDate(ds)}>
              <View style={{
                width: showAmounts ? 28 : 38, height: showAmounts ? 28 : 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
                backgroundColor: isSel ? T.brandMid : 'transparent', borderWidth: isToday && !isSel ? 1.5 : 0, borderColor: T.brandMid,
              }}>
                <Text style={{ fontSize: showAmounts ? 13 : 15, fontWeight: isSel || isToday ? '700' : '400', color: isSel ? T.white : T.ink }}>{d}</Text>
              </View>
              {showAmounts ? (
                <View style={{ alignItems: 'center', marginTop: 2 }}>
                  {inSum > 0 && <Text style={{ fontSize: 10, fontWeight: '700', color: T.in }} numberOfLines={1}>{short(inSum)}</Text>}
                  {outSum > 0 && <Text style={{ fontSize: 10, fontWeight: '700', color: T.out }} numberOfLines={1}>-{short(outSum)}</Text>}
                  {!inSum && !outSum && scheduled?.has(ds) && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: T.faint, marginTop: 3 }} />}
                </View>
              ) : (
                <View style={{ flexDirection: 'row', gap: 3, height: 5, marginTop: 1 }}>
                  {hasIn && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: T.in }} />}
                  {hasOut && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: T.out }} />}
                  {scheduled?.has(ds) && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: T.faint }} />}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
