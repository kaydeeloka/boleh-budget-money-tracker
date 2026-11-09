/**
 * Shared building blocks for the Cash Book look, used by every screen:
 * green app bar, light-green sub bar, flat white sections with a grey title row,
 * table rows, bordered stat cells and square-ish buttons.
 */
import React from 'react';
import { View, Text, TouchableOpacity, TextInput, TextInputProps, StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { T, useIsWide } from '../../theme';
import { ScopeButton } from '@/src/features/navigation/ScopePicker';

// ── Page shell ──────────────────────────────────────────────────────────
export function Page({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.brandDark }} edges={['top']}>
      <View style={{ flex: 1, backgroundColor: T.page }}>{children}</View>
    </SafeAreaView>
  );
}

/** Green header bar. `back` shows an arrow on phones (the sidebar handles navigation on wide screens). */
export function AppBar({ icon, title, subtitle, back, right, children, noScope }: {
  icon?: React.ReactNode; title: string; subtitle?: string; back?: boolean;
  right?: React.ReactNode; children?: React.ReactNode; noScope?: boolean;
}) {
  const router = useRouter();
  const isWide = useIsWide();
  return (
    <View style={{ backgroundColor: T.brand }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: children ? 10 : 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {back && !isWide && (
          <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.navigate('/'))} accessibilityLabel="Back" style={{ paddingRight: 2 }}>
            <ArrowLeft size={22} color={T.white} />
          </TouchableOpacity>
        )}
        {icon}
        <View style={{ flex: 1 }}>
          <Text style={{ color: T.white, fontSize: 20, fontWeight: '800' }} numberOfLines={1}>{title}</Text>
          {!!subtitle && <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 1 }} numberOfLines={1}>{subtitle}</Text>}
        </View>
        {right}
        {/* Phones have no sidebar, so the global KRW/MYR + account picker lives in the header */}
        {!isWide && !noScope && <ScopeButton />}
      </View>
      {children}
    </View>
  );
}

/** White-outline button for the app bar. */
export function BarButton({ label, icon, onPress }: { label?: string; icon?: React.ReactNode; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} accessibilityLabel={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: T.white, borderRadius: 999, paddingHorizontal: label ? 12 : 8, paddingVertical: 6 }}>
      {icon}
      {!!label && <Text style={{ color: T.white, fontWeight: '700', fontSize: 13 }}>{label}</Text>}
    </TouchableOpacity>
  );
}

/** Pill row inside the app bar (like Daily / Weekly / Monthly / Yearly). */
export function BarPills<K extends string>({ options, value, onChange }: { options: { key: K; label: string }[]; value: K; onChange: (k: K) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingBottom: 10 }}>
      {options.map(o => {
        const active = o.key === value;
        return (
          <TouchableOpacity key={o.key} onPress={() => onChange(o.key)} style={{ flex: 1, paddingVertical: 7, borderRadius: 999, alignItems: 'center', borderWidth: 1.5, borderColor: T.white, backgroundColor: active ? 'transparent' : T.white }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: active ? T.white : T.ink }}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/** Lighter strip under the app bar with ‹ label ›. */
export function SubBar({ label, onPrev, onNext, onLabel, nextDisabled }: { label: string; onPrev?: () => void; onNext?: () => void; onLabel?: () => void; nextDisabled?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)', backgroundColor: T.brandMid }}>
      <TouchableOpacity disabled={!onPrev} onPress={onPrev} style={{ padding: 12, opacity: onPrev ? 1 : 0 }} accessibilityLabel="Previous">
        <ChevronLeft size={20} color={T.white} />
      </TouchableOpacity>
      <TouchableOpacity disabled={!onLabel} onPress={onLabel} style={{ flex: 1, alignItems: 'center' }}>
        <Text style={{ color: T.white, fontSize: 16, fontWeight: '700' }}>{label}</Text>
      </TouchableOpacity>
      <TouchableOpacity disabled={!onNext || nextDisabled} onPress={onNext} style={{ padding: 12, opacity: onNext ? (nextDisabled ? 0.3 : 1) : 0 }} accessibilityLabel="Next">
        <ChevronRight size={20} color={T.white} />
      </TouchableOpacity>
    </View>
  );
}

// ── Content ─────────────────────────────────────────────────────────────
/** Page body: stacked sections on phones, optional two columns on wide screens. */
export function Body({ children, aside, asideWidth = 380, asideFirst }: { children: React.ReactNode; aside?: React.ReactNode; asideWidth?: number; asideFirst?: boolean }) {
  const isWide = useIsWide();
  if (isWide && aside) {
    return (
      <View style={{ flex: 1, flexDirection: 'row', gap: 16, padding: 16 }}>
        <View style={{ flex: 1, gap: 16 }}>{children}</View>
        <View style={{ width: asideWidth, gap: 16 }}>{aside}</View>
      </View>
    );
  }
  return <View style={{ gap: isWide ? 16 : 8, padding: isWide ? 16 : 0, paddingBottom: 24 }}>{asideFirst ? aside : null}{children}{asideFirst ? null : aside}</View>;
}

/** Flat white block with a grey title row — the cash book's table look. */
export function Section({ title, subtitle, right, children, style }: {
  title?: string; subtitle?: string; right?: React.ReactNode; children?: React.ReactNode; style?: StyleProp<ViewStyle>;
}) {
  const isWide = useIsWide();
  return (
    <View style={[{ backgroundColor: T.white, borderColor: T.line, borderTopWidth: 1, borderBottomWidth: 1, borderLeftWidth: isWide ? 1 : 0, borderRightWidth: isWide ? 1 : 0, borderRadius: isWide ? 14 : 0, overflow: 'hidden' }, style]}>
      {!!title && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fafafa', borderBottomWidth: 1, borderBottomColor: T.line }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: T.ink }}>{title}</Text>
            {!!subtitle && <Text style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{subtitle}</Text>}
          </View>
          {right}
        </View>
      )}
      {children}
    </View>
  );
}

/** Table column header row. Columns after the first are right-aligned, fixed width. */
export function ColHeader({ cols, colors, width = 112 }: { cols: string[]; colors?: string[]; width?: number }) {
  return (
    <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 9, backgroundColor: '#fafafa', borderBottomWidth: 1, borderBottomColor: T.line }}>
      {cols.map((c, i) => (
        <Text key={c} style={[{ fontSize: 13, fontWeight: '800', color: colors?.[i] ?? T.ink }, i === 0 ? { flex: 1 } : { width, textAlign: 'right' }]}>{c}</Text>
      ))}
    </View>
  );
}

/** Ledger-style list row: small caption, main text, faint detail, then a right side. */
export function Row({ caption, title, detail, right, left, onPress, index = 0, dim }: {
  caption?: string; title: string; detail?: string; right?: React.ReactNode; left?: React.ReactNode;
  onPress?: () => void; index?: number; dim?: boolean;
}) {
  const content = (
    <>
      {left}
      <View style={{ flex: 1, paddingRight: 8 }}>
        {!!caption && <Text style={{ fontSize: 12, color: T.muted }} numberOfLines={1}>{caption}</Text>}
        <Text style={{ fontSize: 15, color: T.ink, fontWeight: '600', marginTop: caption ? 3 : 0 }} numberOfLines={1}>{title}</Text>
        {!!detail && <Text style={{ fontSize: 11, color: T.faint, marginTop: 1 }} numberOfLines={1}>{detail}</Text>}
      </View>
      {right}
    </>
  );
  const style = { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: index % 2 ? '#fcfcfb' : T.white, borderBottomWidth: 1, borderBottomColor: T.line2, opacity: dim ? 0.55 : 1 };
  return onPress
    ? <TouchableOpacity onPress={onPress} activeOpacity={0.6} style={style}>{content}</TouchableOpacity>
    : <View style={style}>{content}</View>;
}

/** Right-aligned amount column for a Row. */
export function Amount({ value, color, width = 112, size = 16 }: { value: string; color: string; width?: number; size?: number }) {
  return <Text style={{ width, textAlign: 'right', fontSize: size, fontWeight: '700', color }} numberOfLines={1}>{value}</Text>;
}

/** Bordered row of totals: label on top, bold value below (Total Cash In / Out / Balance). */
export function StatCells({ cells }: { cells: { label: string; value: string; color: string }[] }) {
  return (
    <View style={{ flexDirection: 'row', backgroundColor: T.white }}>
      {cells.map((c, i) => (
        <View key={c.label} style={{ flex: 1, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4, borderRightWidth: i < cells.length - 1 ? 1 : 0, borderRightColor: T.line }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: c.color }} numberOfLines={1}>{c.label}</Text>
          <Text style={{ fontSize: 17, fontWeight: '800', color: c.color, marginTop: 2 }} numberOfLines={1} adjustsFontSizeToFit>{c.value}</Text>
        </View>
      ))}
    </View>
  );
}

/** "Label ........ value" line, like Opening / Closing Balance. */
export function KeyValue({ label, value, color = T.ink }: { label: string; value: string; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1, borderTopColor: T.line2 }}>
      <Text style={{ flex: 1, fontSize: 14, color: T.ink2 }}>{label}</Text>
      <Text style={{ fontSize: 15, fontWeight: '700', color }}>{value}</Text>
    </View>
  );
}

// ── Controls ────────────────────────────────────────────────────────────
type BtnKind = 'in' | 'out' | 'primary' | 'ghost' | 'dark';
// A function, not a constant, so buttons follow the KRW green / MYR purple theme
const BTN = (): Record<BtnKind, { bg: string; fg: string }> => ({
  in: { bg: T.in, fg: T.white },
  out: { bg: T.out, fg: T.white },
  primary: { bg: T.brand, fg: T.white },
  dark: { bg: T.ink, fg: T.white },
  ghost: { bg: T.line2, fg: T.ink2 },
});
/** Square-ish button (radius 6) like the Cash In / Cash Out buttons. */
export function Btn({ label, onPress, kind = 'primary', icon, big, small, flex, disabled }: {
  label: string; onPress: () => void; kind?: BtnKind; icon?: React.ReactNode; big?: boolean; small?: boolean; flex?: boolean; disabled?: boolean;
}) {
  const c = BTN()[kind];
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={{ flex: flex ? 1 : undefined, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, backgroundColor: disabled ? T.line : c.bg, borderRadius: 6, paddingVertical: big ? 14 : small ? 6 : 10, paddingHorizontal: small ? 10 : 14 }}
    >
      {icon}
      <Text style={{ color: disabled ? T.faint : c.fg, fontWeight: '800', fontSize: big ? 18 : small ? 12 : 14 }}>{label}</Text>
    </TouchableOpacity>
  );
}

/** Two-option toggle on a white background (green outline = active). */
export function Segmented<K extends string>({ options, value, onChange, colors }: { options: { key: K; label: string }[]; value: K; onChange: (k: K) => void; colors?: Partial<Record<K, string>> }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {options.map(o => {
        const active = o.key === value;
        const col = colors?.[o.key] ?? T.brand;
        return (
          <TouchableOpacity key={o.key} onPress={() => onChange(o.key)} style={{ flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center', borderWidth: 1.5, borderColor: active ? col : T.line, backgroundColor: active ? col : T.white }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: active ? T.white : T.ink2 }}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function Label({ children }: { children: string }) {
  return <Text style={{ fontSize: 10, fontWeight: '800', color: T.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>{children}</Text>;
}

/** Labelled text input in the ledger style. */
export function Field({ label, style, ...props }: TextInputProps & { label?: string }) {
  return (
    <View style={{ flex: 1 }}>
      {!!label && <Label>{label}</Label>}
      <TextInput
        placeholderTextColor={T.faint}
        {...props}
        style={[{ backgroundColor: T.white, borderWidth: 1, borderColor: T.line, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: T.ink }, style]}
      />
    </View>
  );
}

export function Empty({ text, sub }: { text: string; sub?: string }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 32, gap: 4 }}>
      <Text style={{ fontSize: 14, fontWeight: '700', color: T.faint }}>{text}</Text>
      {!!sub && <Text style={{ fontSize: 12, color: T.faint }}>{sub}</Text>}
    </View>
  );
}

/** Thin progress bar. */
export function Progress({ pct, color = T.in }: { pct: number; color?: string }) {
  return (
    <View style={{ height: 6, backgroundColor: T.line2, borderRadius: 3, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(100, pct))}%` as any, height: 6, backgroundColor: color }} />
    </View>
  );
}
