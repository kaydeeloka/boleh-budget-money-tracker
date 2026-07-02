import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart2, ChevronLeft, ChevronRight, TrendingDown, TrendingUp, Calendar } from 'lucide-react-native';
import { useAppContext } from '../../src/context/AppContext';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function StatsScreen() {
  const { expenses, accounts, categories } = useAppContext();

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activeCurrency, setActiveCurrency] = useState<'KRW' | 'MYR'>('KRW');

  const sym = activeCurrency === 'KRW' ? '₩' : 'RM';
  const filteredExpenses = expenses.filter(e => e.currency === activeCurrency);

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
    setSelectedDate(null);
  };

  const getDayStr = (day: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const getDayTotal = (day: number) => {
    const dateStr = getDayStr(day);
    const dayExps = filteredExpenses.filter(e => e.date === dateStr);
    const spending = dayExps.filter(e => e.type !== 'income').reduce((s, e) => s + e.amount, 0);
    const income = dayExps.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    return { spending, income };
  };

  const monthExpenses = filteredExpenses.filter(e => {
    const d = new Date(e.date);
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
  });
  const monthSpending = monthExpenses.filter(e => e.type !== 'income').reduce((s, e) => s + e.amount, 0);
  const monthIncome = monthExpenses.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const monthNet = monthIncome - monthSpending;

  const categoryTotals = categories
    .map(cat => ({
      ...cat,
      total: monthExpenses.filter(e => e.category === cat.name && e.type !== 'income').reduce((s, e) => s + e.amount, 0),
    }))
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total);
  const maxCategoryTotal = Math.max(...categoryTotals.map(c => c.total), 1);

  const weeklyTotals = [3, 2, 1, 0].map(weeksAgo => {
    const end = new Date();
    end.setDate(end.getDate() - weeksAgo * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    const total = filteredExpenses
      .filter(e => e.type !== 'income')
      .filter(e => { const d = new Date(e.date); return d >= start && d <= end; })
      .reduce((s, e) => s + e.amount, 0);
    return { label: `W${Math.ceil(end.getDate() / 7)}`, total };
  });
  const maxWeekly = Math.max(...weeklyTotals.map(w => w.total), 1);

  const selectedDateExpenses = selectedDate ? filteredExpenses.filter(e => e.date === selectedDate) : [];

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const fmtAmount = (val: number) =>
    activeCurrency === 'KRW'
      ? Math.round(val).toLocaleString()
      : val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <SafeAreaView className="flex-1 bg-[#faf8f5]" edges={['top']}>
      {/* Screen Header */}
      <View className="bg-white border-b border-stone-200 px-4 py-3">
        <View className="flex-row items-center gap-3">
          <View className="w-9 h-9 rounded-2xl bg-[#14B8A6] items-center justify-center">
            <BarChart2 size={18} color="white" />
          </View>
          <View>
            <Text className="text-[9px] font-extrabold tracking-widest text-stone-500 uppercase">Analytics</Text>
            <Text className="font-bold text-stone-900 text-lg">Stats & Calendar</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        <View className="gap-6 pb-8">

          {/* Currency Toggle */}
          <View className="bg-stone-50 p-4 rounded-3xl border border-stone-200">
            <View className="flex-row bg-stone-200/50 p-1 rounded-2xl border border-stone-200">
              <TouchableOpacity
                onPress={() => setActiveCurrency('KRW')}
                className={`flex-1 py-1.5 rounded-xl items-center ${activeCurrency === 'KRW' ? 'bg-white shadow-sm' : ''}`}
              >
                <Text className={`text-xs font-bold ${activeCurrency === 'KRW' ? 'text-stone-900' : 'text-stone-500'}`}>₩ KRW (Korea)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveCurrency('MYR')}
                className={`flex-1 py-1.5 rounded-xl items-center ${activeCurrency === 'MYR' ? 'bg-white shadow-sm' : ''}`}
              >
                <Text className={`text-xs font-bold ${activeCurrency === 'MYR' ? 'text-stone-900' : 'text-stone-500'}`}>RM MYR (Malaysia)</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Monthly Summary Cards */}
          <View className="flex-row gap-3">
            <View className="flex-1 bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
              <View className="flex-row items-center gap-1 mb-1">
                <TrendingDown size={12} color="#EF4444" />
                <Text className="text-[10px] font-bold text-stone-400 uppercase">Month Spending</Text>
              </View>
              <Text className="font-bold text-red-500 text-base">{sym}{fmtAmount(monthSpending)}</Text>
            </View>
            <View className="flex-1 bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
              <View className="flex-row items-center gap-1 mb-1">
                <TrendingUp size={12} color="#16A34A" />
                <Text className="text-[10px] font-bold text-stone-400 uppercase">Month Income</Text>
              </View>
              <Text className="font-bold text-green-600 text-base">{sym}{fmtAmount(monthIncome)}</Text>
            </View>
          </View>

          <View className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
            <Text className="text-[10px] font-bold text-stone-400 uppercase mb-1">
              Net ({MONTH_NAMES[viewMonth]} {viewYear})
            </Text>
            <Text className={`font-bold text-xl ${monthNet >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {monthNet >= 0 ? '+' : ''}{sym}{fmtAmount(monthNet)}
            </Text>
            <Text className="text-[10px] text-stone-400 mt-0.5 font-medium">
              {monthNet >= 0 ? 'Surplus — you saved money this month!' : 'Deficit — spending exceeded income this month'}
            </Text>
          </View>

          {/* Weekly Bar Chart */}
          <View className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200">
            <Text className="font-bold text-stone-800 text-base mb-1">Weekly Spending</Text>
            <Text className="text-xs text-stone-400 mb-4 font-medium">Rolling 4-week comparison</Text>
            <View className="flex-row items-end gap-2" style={{ height: 120 }}>
              {weeklyTotals.map((week, i) => {
                const barH = Math.max((week.total / maxWeekly) * 88, 4);
                return (
                  <View key={i} className="flex-1 items-center gap-1.5">
                    <Text className="text-[9px] text-stone-400 font-bold" numberOfLines={1}>
                      {activeCurrency === 'KRW' ? `${Math.round(week.total / 1000)}k` : week.total.toFixed(0)}
                    </Text>
                    <View className="w-full items-center justify-end" style={{ height: 88 }}>
                      <View className="w-full bg-green-600 rounded-t-lg" style={{ height: barH }} />
                    </View>
                    <Text className="text-[10px] text-stone-500 font-semibold">{week.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Category Breakdown */}
          {categoryTotals.length > 0 && (
            <View className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200">
              <Text className="font-bold text-stone-800 text-base mb-1">Spending by Category</Text>
              <Text className="text-xs text-stone-400 mb-4 font-medium">{MONTH_NAMES[viewMonth]} {viewYear}</Text>
              <View className="gap-3">
                {categoryTotals.map(cat => {
                  const pct = (cat.total / maxCategoryTotal) * 100;
                  return (
                    <View key={cat.id} className="gap-1">
                      <View className="flex-row justify-between">
                        <Text className="text-xs font-semibold text-stone-700">{cat.name}</Text>
                        <Text className="text-xs text-stone-500">{sym}{fmtAmount(cat.total)}</Text>
                      </View>
                      <View className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <View className="h-full bg-green-700 rounded-full" style={{ width: `${pct}%` }} />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Calendar */}
          <View className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200">
            <View className="flex-row items-center gap-2 mb-4">
              <Calendar size={16} color="#22C55E" />
              <Text className="font-bold text-stone-800 text-base flex-1">Transaction Calendar</Text>
              <TouchableOpacity onPress={prevMonth} className="p-1.5 bg-stone-100 rounded-lg">
                <ChevronLeft size={16} color="#44403c" />
              </TouchableOpacity>
              <Text className="text-sm font-bold text-stone-800 w-32 text-center">
                {MONTH_NAMES[viewMonth].slice(0, 3)} {viewYear}
              </Text>
              <TouchableOpacity onPress={nextMonth} className="p-1.5 bg-stone-100 rounded-lg">
                <ChevronRight size={16} color="#44403c" />
              </TouchableOpacity>
            </View>

            <View className="flex-row mb-1">
              {DAYS_OF_WEEK.map(d => (
                <View key={d} style={{ width: '14.285714%' }} className="items-center">
                  <Text className="text-[10px] font-bold text-stone-400">{d}</Text>
                </View>
              ))}
            </View>

            <View className="flex-row flex-wrap">
              {calendarCells.map((day, idx) => {
                if (day === null) {
                  return <View key={`e-${idx}`} style={{ width: '14.285714%', aspectRatio: 1 }} />;
                }
                const dayStr = getDayStr(day);
                const { spending, income } = getDayTotal(day);
                const isToday = dayStr === todayStr;
                const isSelected = dayStr === selectedDate;
                const hasSpending = spending > 0;
                const hasIncome = income > 0;

                return (
                  <View key={day} style={{ width: '14.285714%', aspectRatio: 1, padding: 2 }}>
                    <TouchableOpacity
                      onPress={() => setSelectedDate(isSelected ? null : dayStr)}
                      style={{
                        flex: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
                        position: 'relative',
                        backgroundColor: isSelected ? '#22C55E' : isToday ? '#ecfdf5' : '#fafaf9',
                        borderWidth: isToday && !isSelected ? 1 : 0,
                        borderColor: '#6ee7b7',
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: isSelected ? 'white' : isToday ? '#22C55E' : '#44403c' }}>
                        {day}
                      </Text>
                      {(hasSpending || hasIncome) && !isSelected && (
                        <View style={{ position: 'absolute', bottom: 2, flexDirection: 'row', gap: 1 }}>
                          {hasSpending && <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#f87171' }} />}
                          {hasIncome && <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#34d399' }} />}
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>

            {selectedDate && (
              <View className="mt-4 pt-4 border-t border-stone-100">
                <Text className="font-bold text-stone-700 text-sm mb-2">
                  {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long' })}
                </Text>
                {selectedDateExpenses.length === 0 ? (
                  <Text className="text-xs text-stone-400 font-medium py-2">No transactions on this day.</Text>
                ) : (
                  <View className="gap-2">
                    {selectedDateExpenses.map(exp => {
                      const acc = accounts.find(a => a.id === exp.accountId);
                      const isIncome = exp.type === 'income';
                      return (
                        <View key={exp.id} className="flex-row items-center justify-between bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                          <View className="flex-1 mr-2">
                            <Text className="text-xs font-semibold text-stone-700" numberOfLines={1}>{exp.note}</Text>
                            <Text className="text-[10px] text-stone-400">{exp.category} • {acc?.bankName || '?'}</Text>
                          </View>
                          <Text className={`text-xs font-bold ${isIncome ? 'text-green-700' : 'text-red-500'}`}>
                            {isIncome ? '+' : '-'}{sym}{fmtAmount(Math.abs(exp.amount))}
                          </Text>
                        </View>
                      );
                    })}
                    <View className="flex-row justify-between pt-1.5">
                      <Text className="text-[10px] text-stone-400 font-semibold">Total spent:</Text>
                      <Text className="text-xs font-bold text-stone-700">
                        {sym}{fmtAmount(selectedDateExpenses.filter(e => e.type !== 'income').reduce((s, e) => s + e.amount, 0))}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
