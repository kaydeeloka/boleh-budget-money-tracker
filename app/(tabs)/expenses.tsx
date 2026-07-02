import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BarChart2, ChevronLeft, ChevronRight, Search, Filter,
  Trash2, TrendingDown, TrendingUp, Globe, Compass,
  ShoppingBag, BookOpen, Coffee, Smile, Plane, Utensils,
  Tag, Sparkles, HelpCircle,
} from 'lucide-react-native';
import { useAppContext } from '../../src/context/AppContext';
import { Currency } from '../../src/types';
import Dropdown from '../../src/components/ui/Dropdown';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Utensils, Coffee, ShoppingBag, BookOpen, Plane, Smile, Sparkles, Tag,
};
const COLOR_MAP: Record<string, string> = {
  Rose: '#f43f5e', Emerald: '#10b981', Blue: '#3b82f6',
  Violet: '#8b5cf6', Amber: '#f59e0b', Cyan: '#06b6d4',
};
const COLOR_BG: Record<string, string> = {
  Rose: '#fff1f2', Emerald: '#f0fdf4', Blue: '#eff6ff',
  Violet: '#f5f3ff', Amber: '#fffbeb', Cyan: '#ecfeff',
};

export default function StatsScreen() {
  const { expenses, accounts, categories, exchangeRate, handleDeleteExpense } = useAppContext();

  const now = new Date();
  const [profile, setProfile] = useState<Currency>('KRW');
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterAcc, setFilterAcc] = useState('all');

  const sym = profile === 'KRW' ? '₩' : 'RM';

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // Monthly items
  const monthItems = useMemo(
    () => expenses.filter(e =>
      e.currency === profile &&
      new Date(e.date).getFullYear() === viewYear &&
      new Date(e.date).getMonth() === viewMonth,
    ),
    [expenses, profile, viewYear, viewMonth],
  );
  const monthIncome = monthItems.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const monthSpend  = monthItems.filter(e => e.type !== 'income').reduce((s, e) => s + e.amount, 0);
  const monthNet    = monthIncome - monthSpend;

  // All-time category sums for current profile
  const catSums = useMemo(() => {
    const sums: Record<string, number> = {};
    expenses
      .filter(e => e.currency === profile && e.type !== 'income')
      .forEach(e => { sums[e.category] = (sums[e.category] || 0) + e.amount; });
    return sums;
  }, [expenses, profile]);
  const totalSpend = Object.values(catSums).reduce((s, v) => s + v, 0);

  // Filtered log
  const logItems = useMemo(
    () => expenses.filter(e => {
      if (filterAcc === 'all' && e.currency !== profile) return false;
      if (!e.note.toLowerCase().includes(search.toLowerCase()) &&
          !e.category.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCat !== 'all' && e.category !== filterCat) return false;
      if (filterAcc !== 'all' && e.accountId !== filterAcc) return false;
      return true;
    }),
    [expenses, profile, search, filterCat, filterAcc],
  );

  function fmt(val: number) {
    return profile === 'KRW'
      ? Math.round(val).toLocaleString()
      : val.toFixed(2);
  }

  function fmtOther(val: number) {
    return profile === 'KRW'
      ? ((val / 1000) * exchangeRate).toFixed(2)
      : Math.round(val * (1000 / exchangeRate)).toLocaleString();
  }

  function getCatIcon(catName: string) {
    const cat = categories.find(c => c.name === catName);
    const Icon = ICON_MAP[cat?.icon || ''] || HelpCircle;
    const color = COLOR_MAP[cat?.color || ''] || '#a8a29e';
    const bg    = COLOR_BG[cat?.color  || ''] || '#f5f5f4';
    return { Icon, color, bg };
  }

  return (
    <SafeAreaView className="flex-1 bg-[#faf8f5]" edges={['top']}>

      {/* Header */}
      <View className="bg-white border-b border-stone-200 px-4 py-3">
        <View className="flex-row items-center gap-3">
          <View className="w-9 h-9 rounded-2xl bg-violet-500 items-center justify-center">
            <BarChart2 size={18} color="white" />
          </View>
          <View>
            <Text className="text-[9px] font-extrabold tracking-widest text-stone-500 uppercase">Spending Analytics</Text>
            <Text className="font-bold text-stone-900 text-lg">Stats</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        <View className="gap-4 pb-8">

          {/* Currency profile toggle */}
          <View className="bg-stone-50 rounded-2xl border border-stone-200 p-3">
            <View className="flex-row bg-stone-200/50 p-1 rounded-xl border border-stone-200">
              <TouchableOpacity
                onPress={() => setProfile('KRW')}
                className={`flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-lg ${profile === 'KRW' ? 'bg-white' : ''}`}
              >
                <Globe size={13} color="#2563eb" />
                <Text className={`text-xs font-bold ${profile === 'KRW' ? 'text-stone-900' : 'text-stone-500'}`}>
                  ₩ KR Accounts
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setProfile('MYR')}
                className={`flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-lg ${profile === 'MYR' ? 'bg-white' : ''}`}
              >
                <Compass size={13} color="#d97706" />
                <Text className={`text-xs font-bold ${profile === 'MYR' ? 'text-stone-900' : 'text-stone-500'}`}>
                  RM MY Accounts
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Monthly summary */}
          <View className="bg-white rounded-3xl border border-stone-200 p-5">
            {/* Month nav */}
            <View className="flex-row items-center justify-between mb-4">
              <TouchableOpacity
                onPress={prevMonth}
                className="w-8 h-8 rounded-full bg-stone-100 items-center justify-center"
              >
                <ChevronLeft size={16} color="#44403c" />
              </TouchableOpacity>
              <Text className="font-extrabold text-stone-900 text-base">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </Text>
              <TouchableOpacity
                onPress={nextMonth}
                className="w-8 h-8 rounded-full bg-stone-100 items-center justify-center"
              >
                <ChevronRight size={16} color="#44403c" />
              </TouchableOpacity>
            </View>

            {/* Summary cards */}
            <View className="flex-row gap-2">
              <View className="flex-1 bg-green-50 rounded-2xl p-3 border border-green-100">
                <View className="flex-row items-center gap-1 mb-1">
                  <TrendingUp size={12} color="#16a34a" />
                  <Text className="text-[9px] font-extrabold text-green-700 uppercase tracking-wider">Income</Text>
                </View>
                <Text className="font-extrabold text-green-700 text-sm" numberOfLines={1} adjustsFontSizeToFit>
                  {sym}{fmt(monthIncome)}
                </Text>
              </View>
              <View className="flex-1 bg-red-50 rounded-2xl p-3 border border-red-100">
                <View className="flex-row items-center gap-1 mb-1">
                  <TrendingDown size={12} color="#dc2626" />
                  <Text className="text-[9px] font-extrabold text-red-600 uppercase tracking-wider">Spent</Text>
                </View>
                <Text className="font-extrabold text-red-600 text-sm" numberOfLines={1} adjustsFontSizeToFit>
                  -{sym}{fmt(monthSpend)}
                </Text>
              </View>
              <View className={`flex-1 rounded-2xl p-3 border ${monthNet >= 0 ? 'bg-stone-50 border-stone-200' : 'bg-orange-50 border-orange-100'}`}>
                <Text className="text-[9px] font-extrabold text-stone-500 uppercase tracking-wider mb-1">Net</Text>
                <Text
                  className={`font-extrabold text-sm ${monthNet >= 0 ? 'text-stone-800' : 'text-orange-600'}`}
                  numberOfLines={1} adjustsFontSizeToFit
                >
                  {monthNet < 0 ? '-' : ''}{sym}{fmt(Math.abs(monthNet))}
                </Text>
              </View>
            </View>

            {monthItems.length === 0 && (
              <Text className="text-xs text-stone-400 text-center mt-3 font-medium">
                No transactions recorded this month
              </Text>
            )}
          </View>

          {/* Category breakdown */}
          <View className="bg-white rounded-3xl border border-stone-200 p-5">
            <Text className="font-bold text-stone-800 text-base mb-0.5">Where is my money going?</Text>
            <Text className="text-xs text-stone-400 font-medium mb-4">
              All-time {profile === 'KRW' ? '₩ KRW' : 'RM MYR'} spending by category
            </Text>
            <View className="gap-3">
              {categories.map(c => {
                const spent = catSums[c.name] || 0;
                const pct   = totalSpend > 0 ? (spent / totalSpend) * 100 : 0;
                const { Icon, color, bg } = getCatIcon(c.name);
                return (
                  <View key={c.id} className="gap-1.5">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
                          <Icon size={14} color={color} />
                        </View>
                        <Text className="font-semibold text-stone-700 text-xs">{c.name}</Text>
                      </View>
                      <Text className="text-stone-500 text-xs font-medium">
                        {pct.toFixed(0)}% · {sym}{profile === 'KRW'
                          ? Math.round(spent).toLocaleString()
                          : spent.toFixed(2)}
                      </Text>
                    </View>
                    <View className="w-full bg-stone-100 rounded-full overflow-hidden" style={{ height: 5 }}>
                      <View style={{ width: `${pct}%`, height: 5, backgroundColor: color, borderRadius: 99 }} />
                    </View>
                  </View>
                );
              })}
              {totalSpend === 0 && (
                <Text className="text-xs text-stone-400 text-center py-4">
                  No expenses recorded yet for {profile}
                </Text>
              )}
            </View>

            {/* Total */}
            {totalSpend > 0 && (
              <View className="mt-4 pt-4 border-t border-stone-100 items-end">
                <Text className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Total spent ({profile})</Text>
                <Text className="font-bold text-stone-900 text-xl">{sym}{fmt(totalSpend)}</Text>
                <Text className="text-xs text-stone-400 mt-0.5 font-medium">
                  ≈ {profile === 'KRW' ? 'RM' : '₩'} {fmtOther(totalSpend)}
                </Text>
              </View>
            )}
          </View>

          {/* Transaction log */}
          <View className="bg-white rounded-3xl border border-stone-200 p-5">
            <Text className="font-bold text-stone-800 text-base mb-0.5">Transaction Log</Text>
            <Text className="text-xs text-stone-400 font-medium mb-3">Full history with filters</Text>

            {/* Search */}
            <View className="flex-row items-center bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 gap-2 mb-3">
              <Search size={15} color="#a8a29e" />
              <TextInput
                className="flex-1 text-xs text-stone-800"
                placeholder="Search note or category..."
                placeholderTextColor="#d6d3d1"
                value={search}
                onChangeText={setSearch}
              />
            </View>

            {/* Filters */}
            <View className="flex-row gap-2 mb-4 items-center">
              <View className="flex-row items-center gap-1 bg-stone-50 px-2 py-1.5 rounded-lg border border-stone-200">
                <Filter size={11} color="#a8a29e" />
                <Text className="text-[10px] text-stone-500 font-bold">Filter</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Dropdown
                  compact
                  options={[{ label: 'All Accounts', value: 'all' }, ...accounts.map(a => ({ label: a.bankName, value: a.id }))]}
                  selectedValue={filterAcc}
                  onValueChange={setFilterAcc}
                  title="Filter by Account"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Dropdown
                  compact
                  options={[{ label: 'All Categories', value: 'all' }, ...categories.map(c => ({ label: c.name, value: c.name }))]}
                  selectedValue={filterCat}
                  onValueChange={setFilterCat}
                  title="Filter by Category"
                />
              </View>
            </View>

            {/* List */}
            <View className="gap-2">
              {logItems.map(exp => {
                const acc       = accounts.find(a => a.id === exp.accountId);
                const isIncome  = exp.type === 'income';
                const { Icon, color, bg } = getCatIcon(exp.category);
                const expSym    = exp.currency === 'KRW' ? '₩' : 'RM';
                const formatted = exp.currency === 'KRW'
                  ? Math.round(exp.amount).toLocaleString()
                  : exp.amount.toFixed(2);
                return (
                  <View
                    key={exp.id}
                    className="flex-row items-center justify-between p-3 bg-stone-50 rounded-2xl border border-stone-200"
                  >
                    <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={16} color={color} />
                      </View>
                      <View className="flex-1">
                        <Text className="font-semibold text-stone-800 text-xs" numberOfLines={1}>{exp.note}</Text>
                        <Text className="text-stone-400 text-[10px] mt-0.5">
                          {exp.category} · {acc?.bankName || '?'} · {exp.date}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Text className={`font-bold text-xs ${isIncome ? 'text-green-600' : 'text-red-500'}`}>
                        {isIncome ? '+' : '-'}{expSym}{formatted}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleDeleteExpense(exp.id)}
                        style={{ padding: 5, borderRadius: 8, backgroundColor: '#fef2f2' }}
                      >
                        <Trash2 size={13} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
              {logItems.length === 0 && (
                <View className="py-10 items-center">
                  <Text className="text-xs text-stone-400 font-medium">No transactions match your filters</Text>
                </View>
              )}
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
