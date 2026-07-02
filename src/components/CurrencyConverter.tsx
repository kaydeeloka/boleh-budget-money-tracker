import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { ArrowRightLeft, RefreshCw, Calculator, Sparkles } from 'lucide-react-native';

interface CurrencyConverterProps {
  exchangeRate: number;
  onExchangeRateChange: (newRate: number) => void;
  onUseCalculatedAmount?: (amount: number, currency: 'KRW' | 'MYR') => void;
}

export default function CurrencyConverter({ exchangeRate, onExchangeRateChange, onUseCalculatedAmount }: CurrencyConverterProps) {
  const [krwVal, setKrwVal] = useState<string>('10000');
  const [myrVal, setMyrVal] = useState<string>((10 * exchangeRate).toFixed(2));
  const [activeDirection, setActiveDirection] = useState<'krwToMyr' | 'myrToKrw'>('krwToMyr');
  const [tempRate, setTempRate] = useState<string>(exchangeRate.toString());
  const [isEditingRate, setIsEditingRate] = useState(false);

  const krwPresets = [
    { label: 'Bus/Subway', value: 1500 },
    { label: 'Mega Coffee', value: 2000 },
    { label: 'Campus Meal', value: 6500 },
    { label: 'Conv. Store', value: 5000 },
    { label: 'K-Chicken', value: 22000 },
    { label: 'Olive Young', value: 35000 },
  ];

  const myrPresets = [
    { label: 'Nasi Lemak', value: 5 },
    { label: 'Milo Ais', value: 3.5 },
    { label: 'Mobile Plan', value: 35 },
    { label: 'Souvenirs', value: 100 },
  ];

  const handleKrwChange = (val: string) => {
    setKrwVal(val);
    const numeric = parseFloat(val);
    if (!isNaN(numeric)) setMyrVal(((numeric / 1000) * exchangeRate).toFixed(2));
    else setMyrVal('');
  };

  const handleMyrChange = (val: string) => {
    setMyrVal(val);
    const numeric = parseFloat(val);
    if (!isNaN(numeric)) setKrwVal((numeric * (1000 / exchangeRate)).toFixed(0));
    else setKrwVal('');
  };

  const applyRateUpdate = () => {
    const rateNum = parseFloat(tempRate);
    if (!isNaN(rateNum) && rateNum > 0) {
      onExchangeRateChange(rateNum);
      setIsEditingRate(false);
      if (activeDirection === 'krwToMyr') {
        const krw = parseFloat(krwVal);
        if (!isNaN(krw)) setMyrVal(((krw / 1000) * rateNum).toFixed(2));
      } else {
        const myr = parseFloat(myrVal);
        if (!isNaN(myr)) setKrwVal((myr * (1000 / rateNum)).toFixed(0));
      }
    }
  };

  const handlePresetClick = (val: number, currency: 'KRW' | 'MYR') => {
    if (currency === 'KRW') {
      setActiveDirection('krwToMyr');
      setKrwVal(val.toString());
      setMyrVal(((val / 1000) * exchangeRate).toFixed(2));
    } else {
      setActiveDirection('myrToKrw');
      setMyrVal(val.toString());
      setKrwVal((val * (1000 / exchangeRate)).toFixed(0));
    }
  };

  return (
    <View className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200">
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-2">
          <View className="p-2 bg-green-50 rounded-xl">
            <ArrowRightLeft size={20} color="#22C55E" />
          </View>
          <View>
            <Text className="font-bold text-stone-800 text-lg">Ringgit ↔ Won Converter</Text>
            <Text className="text-xs text-stone-400">Easy math for study abroad expenses</Text>
          </View>
        </View>
        <View className="flex-row items-center gap-1 bg-stone-50 px-2.5 py-1 rounded-full border border-stone-200">
          <Sparkles size={12} color="#d97706" />
          <Text className="text-[11px] text-stone-600">Persisted Rates</Text>
        </View>
      </View>

      {/* Rate Editor */}
      <View className="bg-stone-50 rounded-2xl p-3 mb-5 border border-stone-200">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs text-stone-500 font-medium">Standard Bank Rate:</Text>
          {isEditingRate ? (
            <View className="flex-row items-center gap-1">
              <Text className="text-stone-600 text-xs">₩1,000 = RM</Text>
              <TextInput
                className="w-16 px-1.5 py-0.5 bg-white border border-stone-200 rounded font-bold text-stone-700 text-xs text-right"
                keyboardType="numeric"
                value={tempRate}
                onChangeText={setTempRate}
              />
              <TouchableOpacity onPress={applyRateUpdate} className="bg-green-500 px-2.5 py-0.5 rounded">
                <Text className="text-white text-[10px] font-medium">Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row items-center gap-1.5">
              <Text className="font-bold text-stone-700 text-xs bg-white px-2 py-0.5 rounded border border-stone-200">₩1,000 ≈ RM {exchangeRate.toFixed(3)}</Text>
              <TouchableOpacity onPress={() => { setTempRate(exchangeRate.toString()); setIsEditingRate(true); }}>
                <Text className="text-green-500 text-[11px] font-semibold">Change</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* KRW Input */}
      <View className={`p-4 rounded-2xl border mb-2 ${activeDirection === 'krwToMyr' ? 'bg-amber-50/30 border-amber-300' : 'bg-stone-50/50 border-stone-200'}`}>
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-xs font-semibold text-stone-500">Korean Won (KRW)</Text>
          <Text className="text-xs text-stone-400">₩ South Korea</Text>
        </View>
        <View className="flex-row items-baseline gap-2">
          <Text className="text-2xl font-bold text-stone-400">₩</Text>
          <TextInput
            className="flex-1 text-2xl font-bold text-stone-800 p-0"
            keyboardType="numeric"
            placeholder="0"
            value={krwVal}
            onChangeText={(v) => { setActiveDirection('krwToMyr'); handleKrwChange(v); }}
          />
        </View>
      </View>

      {/* Swap */}
      <View className="items-center my-1 z-10">
        <TouchableOpacity onPress={() => setActiveDirection(prev => prev === 'krwToMyr' ? 'myrToKrw' : 'krwToMyr')} className="bg-white border border-stone-200 p-2 rounded-full shadow-sm">
          <RefreshCw size={16} color="#78716c" />
        </TouchableOpacity>
      </View>

      {/* MYR Input */}
      <View className={`p-4 rounded-2xl border mt-2 ${activeDirection === 'myrToKrw' ? 'bg-green-50/30 border-green-200' : 'bg-stone-50/50 border-stone-200'}`}>
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-xs font-semibold text-stone-500">Malaysian Ringgit (MYR)</Text>
          <Text className="text-xs text-stone-400">RM Malaysia</Text>
        </View>
        <View className="flex-row items-baseline gap-2">
          <Text className="text-2xl font-bold text-stone-400">RM</Text>
          <TextInput
            className="flex-1 text-2xl font-bold text-stone-800 p-0"
            keyboardType="numeric"
            placeholder="0.00"
            value={myrVal}
            onChangeText={(v) => { setActiveDirection('myrToKrw'); handleMyrChange(v); }}
          />
        </View>
      </View>

      {/* Presets */}
      <View className="mt-5 pt-4 border-t border-stone-200">
        <Text className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2">Student Presets</Text>
        <Text className="text-[10px] text-stone-400 mb-1.5 font-semibold">Korean items:</Text>
        <View className="flex-row flex-wrap gap-1.5 mb-3">
          {krwPresets.map((preset) => (
            <TouchableOpacity key={preset.value} onPress={() => handlePresetClick(preset.value, 'KRW')} className="bg-stone-50 border border-stone-200 rounded-lg px-2 py-1">
              <Text className="text-[11px] text-stone-600 font-semibold">{preset.label} (₩{(preset.value / 1000).toFixed(1)}k)</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-[10px] text-stone-400 mb-1.5 font-semibold">Malaysian items:</Text>
        <View className="flex-row flex-wrap gap-1.5 mb-3">
          {myrPresets.map((preset) => (
            <TouchableOpacity key={preset.value} onPress={() => handlePresetClick(preset.value, 'MYR')} className="bg-stone-50 border border-stone-200 rounded-lg px-2 py-1">
              <Text className="text-[11px] text-stone-600 font-semibold">{preset.label} (RM {preset.value})</Text>
            </TouchableOpacity>
          ))}
        </View>

        {onUseCalculatedAmount && (
          <TouchableOpacity
            onPress={() => {
              if (activeDirection === 'krwToMyr') {
                const amt = parseFloat(krwVal);
                if (!isNaN(amt)) onUseCalculatedAmount(amt, 'KRW');
              } else {
                const amt = parseFloat(myrVal);
                if (!isNaN(amt)) onUseCalculatedAmount(amt, 'MYR');
              }
            }}
            disabled={!krwVal || !myrVal}
            className="w-full mt-2 bg-green-500 py-2.5 px-3 rounded-xl flex-row items-center justify-center gap-1.5"
          >
            <Calculator size={14} color="white" />
            <Text className="text-white text-xs font-semibold">Use amount in transaction form</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

