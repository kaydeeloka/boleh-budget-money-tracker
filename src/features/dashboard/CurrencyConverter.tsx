import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { ArrowUpDown, RefreshCw, Calculator } from 'lucide-react-native';
import { useAppContext } from '@/src/context/AppContext';
import { T } from '@/src/theme';
import { Section, Btn, KeyValue } from '@/src/components/ui/Ledger';

interface CurrencyConverterProps {
  exchangeRate: number;
  onUseCalculatedAmount?: (amount: number, currency: 'KRW' | 'MYR') => void;
}


export default function CurrencyConverter({ exchangeRate, onUseCalculatedAmount }: CurrencyConverterProps) {
  const { rateUpdatedAt, rateLoading, fetchLiveRate, system } = useAppContext();
  const myrFirst = system === 'MYR'; // MYR system: ringgit box on top
  const [krwVal, setKrwVal] = useState('10000');
  const [myrVal, setMyrVal] = useState((10 * exchangeRate).toFixed(2));
  const [dir, setDir] = useState<'krwToMyr' | 'myrToKrw'>(myrFirst ? 'myrToKrw' : 'krwToMyr');
  // Switching KRW/MYR: start from the top box (₩10,000 or RM 10)
  React.useEffect(() => {
    if (myrFirst) { setDir('myrToKrw'); setMyrVal('10'); setKrwVal((10 * (1000 / exchangeRate)).toFixed(0)); }
    else { setDir('krwToMyr'); setKrwVal('10000'); setMyrVal((10 * exchangeRate).toFixed(2)); }
  }, [myrFirst]);
  // Live rate arrives after mount: recompute the box you're not typing in
  React.useEffect(() => {
    if (dir === 'krwToMyr') { const n = parseFloat(krwVal); if (!isNaN(n)) setMyrVal(((n / 1000) * exchangeRate).toFixed(2)); }
    else { const n = parseFloat(myrVal); if (!isNaN(n)) setKrwVal((n * (1000 / exchangeRate)).toFixed(0)); }
  }, [exchangeRate]);

  const onKrw = (v: string) => {
    setDir('krwToMyr'); setKrwVal(v);
    const n = parseFloat(v); setMyrVal(isNaN(n) ? '' : ((n / 1000) * exchangeRate).toFixed(2));
  };
  const onMyr = (v: string) => {
    setDir('myrToKrw'); setMyrVal(v);
    const n = parseFloat(v); setKrwVal(isNaN(n) ? '' : (n * (1000 / exchangeRate)).toFixed(0));
  };

  const box = (cur: 'KRW' | 'MYR') => {
    const active = (cur === 'KRW') === (dir === 'krwToMyr');
    return (
      <View style={{ borderWidth: 1.5, borderColor: active ? T.brand : T.line, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: active ? T.green50 : T.white }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: T.muted }}>{cur === 'KRW' ? 'Korean Won (KRW)' : 'Malaysian Ringgit (MYR)'}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: T.faint }}>{cur === 'KRW' ? '₩' : 'RM'}</Text>
          <TextInput
            style={{ flex: 1, minWidth: 0, fontSize: 22, fontWeight: '800', color: T.ink, paddingVertical: 2 }}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={T.faint}
            value={cur === 'KRW' ? krwVal : myrVal}
            onChangeText={cur === 'KRW' ? onKrw : onMyr}
          />
        </View>
      </View>
    );
  };


  return (
    <Section
      title="Ringgit ↔ Won Converter"
      subtitle={rateUpdatedAt ? `Updated ${rateUpdatedAt} · ExchangeRate-API` : 'ExchangeRate-API'}
      right={
        <TouchableOpacity onPress={fetchLiveRate} disabled={rateLoading} accessibilityLabel="Refresh rate" style={{ padding: 6, borderRadius: 6, backgroundColor: T.line2 }}>
          <RefreshCw size={15} color={rateLoading ? T.faint : T.brand} />
        </TouchableOpacity>
      }
    >
      <KeyValue label="Bank rate" value={myrFirst ? `RM 1 ≈ ₩${Math.round(1000 / exchangeRate).toLocaleString()}` : `₩1,000 ≈ RM ${exchangeRate.toFixed(3)}`} color={T.in} />
      <View style={{ padding: 16, gap: 8, borderTopWidth: 1, borderTopColor: T.line2 }}>
        {box(myrFirst ? 'MYR' : 'KRW')}
        <TouchableOpacity onPress={() => setDir(d => (d === 'krwToMyr' ? 'myrToKrw' : 'krwToMyr'))} accessibilityLabel="Swap direction" style={{ alignSelf: 'center', padding: 6, borderRadius: 6, borderWidth: 1, borderColor: T.line, backgroundColor: T.white }}>
          <ArrowUpDown size={16} color={T.muted} />
        </TouchableOpacity>
        {box(myrFirst ? 'KRW' : 'MYR')}
      </View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12 }}>
        {onUseCalculatedAmount && (
          <Btn
            label="Use amount in transaction form"
            icon={<Calculator size={14} color={T.white} />}
            disabled={!krwVal || !myrVal}
            onPress={() => {
              const n = parseFloat(dir === 'krwToMyr' ? krwVal : myrVal);
              if (!isNaN(n)) onUseCalculatedAmount(n, dir === 'krwToMyr' ? 'KRW' : 'MYR');
            }}
          />
        )}
      </View>
    </Section>
  );
}
