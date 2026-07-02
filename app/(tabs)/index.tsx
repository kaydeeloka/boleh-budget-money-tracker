import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GraduationCap, Wallet, RefreshCw, Award, CalendarDays } from 'lucide-react-native';
import { useAppContext } from '../../src/context/AppContext';
import BankAccounts from '../../src/components/BankAccounts';
import CurrencyConverter from '../../src/components/CurrencyConverter';
import { useRouter } from 'expo-router';

export default function VaultTab() {
  const {
    exchangeRate, setExchangeRate,
    accounts, expenses,
    totalInMyr, totalInKrw,
    handleAdjustBalance, handleRecordTransfer,
    handleAddAccount, handleDeleteAccount, handleUpdateAccountNo,
    handleUseCalculatedAmount,
    setQuickAmountToFill,
  } = useAppContext();

  const router = useRouter();
  const [netWorthCurrency, setNetWorthCurrency] = useState<'MYR' | 'KRW'>('MYR');

  const getPocketMood = () => {
    const totalSpentInMyr = expenses.reduce((sum, exp) => {
      if (exp.amount < 0) return sum;
      return sum + (exp.currency === 'KRW' ? (exp.amount / 1000) * exchangeRate : exp.amount);
    }, 0);
    if (totalSpentInMyr < 250) return { label: 'Extremely Chill & Saving', color: 'text-green-500 bg-green-50 border-green-100' };
    if (totalSpentInMyr < 750) return { label: 'Perfect Budget Balance', color: 'text-amber-900 bg-amber-50 border-amber-200' };
    return { label: 'Olive Young or K-BBQ Shopping Spree!', color: 'text-orange-900 bg-orange-50 border-orange-200' };
  };

  const pocketMood = getPocketMood();

  return (
    <SafeAreaView className="flex-1 bg-[#faf8f5]" edges={['top']}>
      {/* Header */}
      <View className="bg-white border-b border-stone-200 px-4 py-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="w-9 h-9 rounded-2xl bg-green-500 items-center justify-center">
              <GraduationCap size={18} color="white" />
            </View>
            <View>
              <Text className="text-[9px] font-extrabold tracking-widest text-stone-500 uppercase">BolehBudget</Text>
              <Text className="font-bold text-stone-900 text-lg">Student Pocket Vault</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/calendar')}
            className="w-9 h-9 rounded-2xl bg-stone-100 border border-stone-200 items-center justify-center"
          >
            <CalendarDays size={18} color="#22C55E" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        {/* Net Worth Card */}
        <View className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200 mb-4">
          <View className="flex-row items-center gap-1.5 mb-3">
            <Wallet size={16} color="#22C55E" />
            <Text className="text-xs font-bold uppercase tracking-wider text-stone-400">Total Available Pocket Cash</Text>
          </View>

          {netWorthCurrency === 'MYR' ? (
            <View>
              <Text className="text-3xl font-bold text-stone-900">
                RM {totalInMyr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <Text className="text-xs text-stone-400 mt-1">≈ ₩{Math.round(totalInKrw).toLocaleString()} total value</Text>
            </View>
          ) : (
            <View>
              <Text className="text-3xl font-bold text-stone-900">₩{Math.round(totalInKrw).toLocaleString()}</Text>
              <Text className="text-xs text-stone-400 mt-1">
                ≈ RM {totalInMyr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total value
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={() => setNetWorthCurrency(prev => prev === 'MYR' ? 'KRW' : 'MYR')}
            className="flex-row items-center gap-1 bg-green-50 px-3 py-1.5 rounded-xl mt-3 self-start"
          >
            <RefreshCw size={12} color="#22C55E" />
            <Text className="text-xs font-semibold text-green-500">
              Show in {netWorthCurrency === 'MYR' ? 'Korean Won' : 'Ringgit'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Scholarship Card */}
        <View className="bg-stone-900 rounded-3xl p-6 mb-4 border border-stone-800">
          <View className="flex-row items-center gap-1.5 mb-2">
            <Award size={16} color="#fde68a" />
            <Text className="text-xs font-bold uppercase tracking-widest text-stone-300">Scholarship & Allowance Mode</Text>
          </View>
          <Text className="font-bold text-lg text-white leading-tight">Annyeong & Selamat Datang!</Text>
          <Text className="text-xs text-stone-300 mt-2 leading-relaxed font-medium">
            Manage your Malaysian card (MYR) and scholarship Hana account (KRW) side-by-side with zero clutter.
          </Text>
          <View className="flex-row items-center justify-between border-t border-stone-800 mt-4 pt-3">
            <Text className="text-[11px] font-medium text-stone-400">Designed for Study Abroad</Text>
            <Text className="font-bold text-white text-xs bg-white/10 px-2 py-0.5 rounded-full">V2.0</Text>
          </View>
        </View>

        {/* Bank Accounts */}
        <BankAccounts
          accounts={accounts}
          exchangeRate={exchangeRate}
          onAdjustBalance={handleAdjustBalance}
          onRecordTransfer={handleRecordTransfer}
          onAddAccount={handleAddAccount}
          onDeleteAccount={handleDeleteAccount}
          onUpdateAccountNo={handleUpdateAccountNo}
        />

        {/* Currency Converter */}
        <View className="mt-4 mb-4">
          <CurrencyConverter
            exchangeRate={exchangeRate}
            onUseCalculatedAmount={(amt, curr) => {
              handleUseCalculatedAmount(amt, curr);
              setQuickAmountToFill(amt);
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

