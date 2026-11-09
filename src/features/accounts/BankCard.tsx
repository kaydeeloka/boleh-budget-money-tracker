import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Globe, Compass, Eye, EyeOff, Copy } from 'lucide-react-native';
import { BankAccount } from '@/src/types';

/** Card colours — deliberately not the app green, so cards stand apart from the total box. */
export const CARD_COLORS = ['#1e3a8a', '#0f766e', '#7c2d12', '#581c87', '#334155', '#9f1239', '#0e7490', '#3f6212', '#1c1917', '#a16207'];
/** Saved colour, or a stable one picked from the account id. */
export function cardColorFor(a: { id: string; cardColor?: string }) {
  if (a.cardColor) return a.cardColor;
  let h = 0;
  for (const ch of a.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return CARD_COLORS[h % CARD_COLORS.length];
}
const CHIP_GOLD = '#d4a843';
const CHIP_LINE = '#b8962e';

function CardChip() {
  return (
    <View style={{ width: 36, height: 28, backgroundColor: CHIP_GOLD, borderRadius: 5, borderWidth: 0.5, borderColor: CHIP_LINE, overflow: 'hidden' }}>
      <View style={{ position: 'absolute', left: 12, top: 0, bottom: 0, width: 0.8, backgroundColor: CHIP_LINE, opacity: 0.5 }} />
      <View style={{ position: 'absolute', left: 24, top: 0, bottom: 0, width: 0.8, backgroundColor: CHIP_LINE, opacity: 0.5 }} />
      <View style={{ position: 'absolute', top: 9, left: 0, right: 0, height: 0.8, backgroundColor: CHIP_LINE, opacity: 0.5 }} />
      <View style={{ position: 'absolute', top: 18, left: 0, right: 0, height: 0.8, backgroundColor: CHIP_LINE, opacity: 0.5 }} />
    </View>
  );
}

function Contactless() {
  return (
    <View style={{ opacity: 0.35, alignItems: 'center', justifyContent: 'center', width: 20, height: 20 }}>
      {[14, 10, 6].map((r, i) => (
        <View key={i} style={{ width: r, height: r, borderRadius: r / 2, borderWidth: 1.5, borderColor: 'white', position: 'absolute', transform: [{ scaleX: 0.6 }] }} />
      ))}
    </View>
  );
}

/** Physical bank-card look: bank name, account name, masked number (show / copy), chip, balance. */
export default function BankCard({ account, reference, footer }: { account: BankAccount; reference?: string; footer?: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);
  const a = account;
  const sym = a.currency === 'KRW' ? '₩' : 'RM';
  const balance = a.balance.toLocaleString(undefined, { minimumFractionDigits: a.currency === 'KRW' ? 0 : 2, maximumFractionDigits: a.currency === 'KRW' ? 0 : 2 });

  return (
    <View style={{ backgroundColor: cardColorFor(account), borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 }}>
      {/* Top row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <Text style={{ flex: 1, color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' }} numberOfLines={1}>
          {a.bankName}
        </Text>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {a.currency === 'KRW' ? <Globe size={11} color="white" /> : <Compass size={11} color="white" />}
          <Text style={{ color: 'white', fontSize: 11, fontWeight: 'bold' }}>{a.currency}</Text>
        </View>
      </View>

      {/* Account name */}
      <Text style={{ color: 'white', fontSize: 17, fontWeight: 'bold', lineHeight: 22, marginBottom: 6 }} numberOfLines={1}>{a.name}</Text>

      {/* Account number */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14, minHeight: 16 }}>
        <Text style={{ color: a.accountNo ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.3)', fontSize: 12, fontFamily: 'monospace', letterSpacing: 0.5 }}>
          {a.accountNo ? (show ? a.accountNo : `•••• ${a.accountNo.replace(/-/g, '').slice(-4)}`) : '——'}
        </Text>
        {a.accountNo && (
          <>
            <TouchableOpacity onPress={() => setShow(v => !v)} accessibilityLabel="Show account number">
              {show ? <EyeOff size={14} color="rgba(255,255,255,0.5)" /> : <Eye size={14} color="rgba(255,255,255,0.5)" />}
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityLabel="Copy account number"
              onPress={async () => { await Clipboard.setStringAsync(a.accountNo!); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
            >
              {copied ? <Text style={{ color: '#86efac', fontSize: 10, fontWeight: 'bold' }}>Copied!</Text> : <Copy size={14} color="rgba(255,255,255,0.5)" />}
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Chip row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <CardChip />
        <Contactless />
      </View>

      {/* Balance */}
      <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 'bold', marginBottom: 2 }}>{sym}</Text>
      <Text style={{ color: 'white', fontSize: 28, fontWeight: 'bold', letterSpacing: -0.5 }} numberOfLines={1} adjustsFontSizeToFit>{balance}</Text>
      {!!reference && <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 3 }}>{reference}</Text>}

      {footer && <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)' }}>{footer}</View>}
    </View>
  );
}
