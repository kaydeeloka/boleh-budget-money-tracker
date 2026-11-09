import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { T } from '@/src/theme';

export interface PieSlice { key: string; label: string; value: number; color: string }

const MAX_SLICES = 6;        // more than this → the rest fold into "Other"
const OTHER_COLOR = '#a8a29e';
// Used when two slices would share a colour (e.g. categories saved with the same colour)
const SPARE = ['#2563eb', '#d97706', '#7c3aed', '#0d9488', '#db2777', '#65a30d', '#ea580c', '#0891b2', '#4f46e5', '#b45309'];

/** Donut segment path from angle a0 to a1 (radians, 0 = 12 o'clock, clockwise). */
function arc(cx: number, cy: number, R: number, r: number, a0: number, a1: number) {
  const p = (rad: number, ang: number) => [cx + rad * Math.sin(ang), cy - rad * Math.cos(ang)];
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = p(R, a0), [x1, y1] = p(R, a1), [x2, y2] = p(r, a1), [x3, y3] = p(r, a0);
  return `M${x0} ${y0} A${R} ${R} 0 ${large} 1 ${x1} ${y1} L${x2} ${y2} A${r} ${r} 0 ${large} 0 ${x3} ${y3} Z`;
}

/**
 * Spending donut. Each slice keeps its category's colour (same as the bar view);
 * identity is never colour-alone: the legend names every slice with amount and %.
 * Tap a slice or a legend row to highlight it and show it in the centre.
 */
export default function CategoryPie({ slices, total, format, centerLabel = 'Total spent', compact = false }: {
  slices: PieSlice[]; total: number; format: (n: number) => string; centerLabel?: string;
  /** compact: small donut on the left, "name (%)" legend on the right, top 4 + Others */
  compact?: boolean;
}) {
  const [sel, setSel] = useState<string | null>(null);

  const sorted = [...slices].sort((a, b) => b.value - a.value);
  const maxSlices = compact ? 4 : MAX_SLICES;
  const shown = (sorted.length > maxSlices + 1 ? sorted.slice(0, maxSlices) : sorted).map(s => ({ ...s }));
  const rest = sorted.slice(shown.length);
  const data = rest.length
    ? [...shown, { key: '__other', label: compact ? 'Others' : `Other (${rest.length})`, value: rest.reduce((t, s) => t + s.value, 0), color: OTHER_COLOR }]
    : shown;
  // No two slices with the same colour
  const used = new Set<string>();
  for (const d of data) {
    let c = d.color.toLowerCase();
    if (used.has(c)) { c = SPARE.find(x => !used.has(x)) ?? c; d.color = c; }
    used.add(c);
  }

  const size = compact ? 150 : 220, cx = size / 2, cy = size / 2, R = compact ? 70 : 104, r = compact ? 50 : 66;
  let a = 0;
  const segs = data.map(d => {
    const a0 = a; a += (d.value / total) * Math.PI * 2;
    return { ...d, a0, a1: a };
  });
  const active = segs.find(s => s.key === sel);
  const pct = (v: number) => `${((v / total) * 100).toFixed(compact || v / total < 0.1 ? 1 : 0)}%`;

  return (
    <View style={compact ? { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 10 } : { padding: 16, gap: 16 }}>
      <View style={{ alignItems: 'center' }}>
        <View style={{ width: size, height: size }}>
          <Svg width={size} height={size}>
            {segs.length === 1 ? (
              // single category: a full ring (an arc path can't draw 360°)
              <Circle cx={cx} cy={cy} r={(R + r) / 2} stroke={segs[0].color} strokeWidth={R - r} fill="none" onPress={() => setSel(sel ? null : segs[0].key)} />
            ) : (
              <G>
                {segs.map(s => (
                  <Path
                    key={s.key}
                    d={arc(cx, cy, s.key === sel ? R + 4 : R, r, s.a0, s.a1)}
                    fill={s.color}
                    opacity={sel && s.key !== sel ? 0.35 : 1}
                    stroke={T.white}
                    strokeWidth={2}            // 2px surface gap between slices
                    onPress={() => setSel(sel === s.key ? null : s.key)}
                  />
                ))}
              </G>
            )}
          </Svg>
          {/* Centre label: total, or the tapped slice */}
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: compact ? 26 : 44 }}>
            <Text style={{ fontSize: compact ? 10 : 11, color: T.muted, textAlign: 'center' }} numberOfLines={2}>{active ? active.label : centerLabel}</Text>
            {(() => {
              // shrink long amounts so they fit the hole (adjustsFontSizeToFit doesn't work on web)
              const txt = format(active ? active.value : total);
              const fs = compact ? (txt.length <= 9 ? 13 : txt.length <= 11 ? 12 : 10) : txt.length <= 9 ? 16 : txt.length <= 11 ? 14 : txt.length <= 13 ? 12 : 11;
              return <Text style={{ fontSize: fs, fontWeight: '800', color: T.ink, marginTop: 2 }} numberOfLines={1}>{txt}</Text>;
            })()}
            {active && <Text style={{ fontSize: 12, fontWeight: '700', color: T.ink2 }}>{pct(active.value)}</Text>}
          </View>
        </View>
      </View>

      {/* Compact legend: "● Bills (25.5%)" */}
      {compact && (
        <View style={{ flex: 1, gap: 2 }}>
          {segs.map(s => (
            <TouchableOpacity key={s.key} onPress={() => setSel(sel === s.key ? null : s.key)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5, opacity: sel && s.key !== sel ? 0.45 : 1 }}>
              <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: s.color }} />
              <Text style={{ flex: 1, fontSize: 14, color: T.ink }} numberOfLines={1}>{s.label}</Text>
              <Text style={{ fontSize: 13, color: T.ink2 }}>({pct(s.value)})</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Legend = the readable record of every slice */}
      {!compact && <View style={{ borderTopWidth: 1, borderTopColor: T.line2 }}>
        {segs.map(s => (
          <TouchableOpacity
            key={s.key}
            onPress={() => setSel(sel === s.key ? null : s.key)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: T.line2, backgroundColor: s.key === sel ? T.line2 : 'transparent', opacity: sel && s.key !== sel ? 0.6 : 1 }}
          >
            <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: s.color }} />
            <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: T.ink }} numberOfLines={1}>{s.label}</Text>
            <Text style={{ width: 48, textAlign: 'right', fontSize: 12, color: T.muted }}>{pct(s.value)}</Text>
            <Text style={{ width: 100, textAlign: 'right', fontSize: 13, fontWeight: '700', color: T.ink }}>{format(s.value)}</Text>
          </TouchableOpacity>
        ))}
      </View>}
    </View>
  );
}
