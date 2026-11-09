import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { T, money } from '@/src/theme';
import { Currency } from '@/src/types';

/** Ring split into income (green) and expenses (red) share. Grey when the month is empty. */
function Donut({ inAmt, outAmt, size = 46, stroke = 8 }: { inAmt: number; outAmt: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = inAmt + outAmt;
  const inLen = total ? (inAmt / total) * c : 0;
  const center = size / 2;
  return (
    <Svg width={size} height={size}>
      <Circle cx={center} cy={center} r={r} stroke={total ? T.out : T.line} strokeWidth={stroke} fill="none" />
      {inLen > 0 && (
        <Circle
          cx={center} cy={center} r={r} stroke={T.in} strokeWidth={stroke} fill="none"
          strokeDasharray={`${inLen} ${c}`}
          // start at 12 o'clock
          transform={`rotate(-90 ${center} ${center})`}
        />
      )}
    </Svg>
  );
}

interface Props {
  title: string;      // "June 2026"
  inAmt: number;
  outAmt: number;
  selected?: boolean;
  currency?: Currency;
  onPress?: () => void;
}

/** compact: narrow card (two side by side on phones) — small ring beside the title, figures below. */
export default function MonthSummaryCard({ title, inAmt, outAmt, selected, onPress, currency = 'KRW', compact = false }: Props & { compact?: boolean }) {
  const won = (n: number) => money(n, currency);
  const net = inAmt - outAmt;
  const line = (label: string, value: string, color: string, bold = false) => (
    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
      <Text style={{ width: compact ? undefined : 66, fontSize: compact ? 11 : 12, color: T.ink2, fontWeight: bold ? '700' : '400' }}>{label}</Text>
      <Text style={{ flex: 1, textAlign: 'right', fontSize: compact ? 12 : 12, fontWeight: '700', color }} numberOfLines={1}>{value}</Text>
    </View>
  );
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={`${title} summary`}
      style={{
        backgroundColor: selected ? T.green50 : T.white, borderRadius: 10, borderWidth: selected ? 1.5 : 1,
        borderColor: selected ? T.brandMid : T.line, padding: 10, gap: 6,
      }}
    >
      {compact ? (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ flex: 1, fontSize: 14, fontWeight: '800', color: T.ink }} numberOfLines={1}>{title}</Text>
            <Donut inAmt={inAmt} outAmt={outAmt} size={30} stroke={6} />
          </View>
          <View style={{ gap: 2 }}>
            {line('Income', won(inAmt), T.in)}
            {line('Expense', outAmt ? `-${won(outAmt)}` : won(0), T.out)}
            {line('Total', won(net), net < 0 ? T.out : T.in, true)}
          </View>
        </>
      ) : (<>
      <Text style={{ fontSize: 14, fontWeight: '800', color: T.ink }}>{title}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Donut inAmt={inAmt} outAmt={outAmt} />
        <View style={{ flex: 1, gap: 2 }}>
          {line('Income:', won(inAmt), T.in)}
          {line('Expenses:', outAmt ? `-${won(outAmt)}` : won(0), T.out)}
          {line('Total:', won(net), net < 0 ? T.out : T.in, true)}
        </View>
      </View>
      </>)}
    </TouchableOpacity>
  );
}
