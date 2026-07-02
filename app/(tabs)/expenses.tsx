import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import {
  Plus, Trash2, Search, Filter, ShoppingBag, BookOpen, Coffee,
  HelpCircle, Sparkles, Smile, Plane, Utensils, Tag, Globe,
  Compass, TrendingUp, TrendingDown, Receipt,
} from 'lucide-react-native';
import { useAppContext } from '../../src/context/AppContext';
import { BudgetCategory, Currency } from '../../src/types';

const PRESET_ICONS = [
  { name: 'Utensils', component: Utensils },
  { name: 'Coffee', component: Coffee },
  { name: 'ShoppingBag', component: ShoppingBag },
  { name: 'BookOpen', component: BookOpen },
  { name: 'Plane', component: Plane },
  { name: 'Smile', component: Smile },
  { name: 'Sparkles', component: Sparkles },
  { name: 'Tag', component: Tag },
];

const PRESET_COLORS = [
  { name: 'Rose', bg: 'bg-rose-500', iconColor: '#f43f5e' },
  { name: 'Emerald', bg: 'bg-green-500', iconColor: '#10b981' },
  { name: 'Blue', bg: 'bg-blue-500', iconColor: '#3b82f6' },
  { name: 'Violet', bg: 'bg-violet-500', iconColor: '#8b5cf6' },
  { name: 'Amber', bg: 'bg-amber-500', iconColor: '#f59e0b' },
  { name: 'Cyan', bg: 'bg-cyan-500', iconColor: '#06b6d4' },
];

export default function ExpensesScreen() {
  const {
    expenses, accounts, categories, exchangeRate,
    handleAddExpense, handleDeleteExpense, handleAddCategory,
    quickAmountToFill, quickCurrencyToFill, setQuickAmountToFill,
  } = useAppContext();

  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [currency, setCurrency] = useState<Currency>('KRW');
  const [accountId, setAccountId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeProfile, setActiveProfile] = useState<Currency>(() => accounts[0]?.currency || 'KRW');
  const [showCategoryCreator, setShowCategoryCreator] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Utensils');
  const [newCatColor, setNewCatColor] = useState('Rose');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterAccount, setFilterAccount] = useState('all');

  React.useEffect(() => {
    const profileAccounts = accounts.filter(a => a.currency === activeProfile);
    if (profileAccounts.length > 0) {
      const currentInProfile = profileAccounts.find(a => a.id === accountId);
      if (!currentInProfile) {
        setAccountId(profileAccounts[0].id);
        setCurrency(profileAccounts[0].currency);
      }
    }
  }, [activeProfile, accounts]);

  React.useEffect(() => {
    if (categories.length > 0 && !selectedCategory) setSelectedCategory(categories[0].name);
  }, [categories]);

  React.useEffect(() => {
    if (quickAmountToFill > 0) {
      setAmount(quickAmountToFill.toString());
      setCurrency(quickCurrencyToFill);
      setActiveProfile(quickCurrencyToFill);
      const matched = accounts.find(a => a.currency === quickCurrencyToFill);
      if (matched) setAccountId(matched.id);
      setQuickAmountToFill(0);
    }
  }, [quickAmountToFill, quickCurrencyToFill]);

  React.useEffect(() => { setFilterAccount('all'); }, [activeProfile]);

  const handleAccountChange = (id: string) => {
    setAccountId(id);
    const acc = accounts.find(a => a.id === id);
    if (acc) setCurrency(acc.currency);
  };

  const handleCreateCategory = () => {
    if (!newCatName.trim()) return;
    if (categories.some(c => c.name.toLowerCase() === newCatName.toLowerCase())) {
      Alert.alert('Category exists', 'This category already exists!');
      return;
    }
    const newCategory: BudgetCategory = {
      id: `cat-${Date.now()}`, name: newCatName.trim(),
      icon: newCatIcon, color: newCatColor, isCustom: true,
    };
    handleAddCategory(newCategory);
    setSelectedCategory(newCategory.name);
    setNewCatName('');
    setShowCategoryCreator(false);
  };

  const handleSubmit = () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;
    handleAddExpense({
      date, amount: parsedAmount, currency, category: selectedCategory,
      accountId,
      note: note.trim() || `${selectedCategory} ${transactionType === 'income' ? 'income' : 'spending'}`,
      type: transactionType,
    });
    setAmount('');
    setNote('');
  };

  const renderCategoryIcon = (categoryName: string, size = 16) => {
    const cat = categories.find(c => c.name === categoryName);
    const iconName = cat ? cat.icon : 'HelpCircle';
    const preset = PRESET_ICONS.find(i => i.name === iconName) || { component: HelpCircle };
    const IconComponent = preset.component;
    const colorConfig = PRESET_COLORS.find(c => c.name === (cat?.color || 'Rose')) || PRESET_COLORS[0];
    return (
      <View className="p-2 rounded-xl bg-slate-50">
        <IconComponent size={size} color={colorConfig.iconColor} />
      </View>
    );
  };

  const filteredExpenses = expenses.filter(exp => {
    if (exp.currency !== activeProfile) return false;
    const matchesSearch =
      exp.note.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || exp.category === filterCategory;
    const matchesAccount = filterAccount === 'all' || exp.accountId === filterAccount;
    return matchesSearch && matchesCategory && matchesAccount;
  });

  const categorySpendingSums = expenses
    .filter(exp => exp.currency === activeProfile)
    .reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

  const totalSpending = Object.values(categorySpendingSums).reduce((sum, v) => sum + v, 0);
  const sym = activeProfile === 'KRW' ? '₩' : 'RM';

  return (
    <SafeAreaView className="flex-1 bg-[#faf8f5]" edges={['top']}>
      {/* Screen Header */}
      <View className="bg-white border-b border-stone-200 px-4 py-3">
        <View className="flex-row items-center gap-3">
          <View className="w-9 h-9 rounded-2xl bg-red-500 items-center justify-center">
            <Receipt size={18} color="white" />
          </View>
          <View>
            <Text className="text-[9px] font-extrabold tracking-widest text-stone-500 uppercase">Daily Costs</Text>
            <Text className="font-bold text-stone-900 text-lg">Expense Tracker</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        <View className="gap-6 pb-8">

          {/* Profile Toggle */}
          <View className="bg-stone-50 p-4 rounded-3xl border border-stone-200">
            <Text className="text-[10px] font-extrabold tracking-wider text-stone-400 uppercase">Daily Expense Filter Profile</Text>
            <Text className="font-bold text-stone-800 text-sm mt-0.5">
              Viewing: {activeProfile === 'KRW' ? 'South Korea Accounts (₩ KRW)' : 'Malaysia Accounts (RM MYR)'}
            </Text>
            <View className="flex-row bg-stone-200/50 p-1 rounded-2xl border border-stone-200 mt-3">
              <TouchableOpacity
                onPress={() => setActiveProfile('KRW')}
                className={`flex-1 flex-row items-center justify-center gap-1.5 px-4 py-2 rounded-xl ${activeProfile === 'KRW' ? 'bg-white shadow-sm' : ''}`}
              >
                <Globe size={14} color="#2563eb" />
                <Text className={`text-xs font-bold ${activeProfile === 'KRW' ? 'text-stone-900' : 'text-stone-500'}`}>KR Accounts</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveProfile('MYR')}
                className={`flex-1 flex-row items-center justify-center gap-1.5 px-4 py-2 rounded-xl ${activeProfile === 'MYR' ? 'bg-white shadow-sm' : ''}`}
              >
                <Compass size={14} color="#d97706" />
                <Text className={`text-xs font-bold ${activeProfile === 'MYR' ? 'text-stone-900' : 'text-stone-500'}`}>MY Accounts</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Add Transaction Form */}
          <View className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200">
            <Text className="font-bold text-stone-800 text-lg mb-1">Add Daily Transaction</Text>
            <Text className="text-xs text-stone-400 mb-4 font-medium">Record your daily student expenses or income here.</Text>

            <View className="mb-4">
              <Text className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Transaction Type</Text>
              <View className="flex-row gap-1 bg-stone-100 p-1 rounded-xl">
                <TouchableOpacity
                  onPress={() => setTransactionType('expense')}
                  className={`flex-1 py-1.5 rounded-lg flex-row justify-center items-center gap-1.5 ${transactionType === 'expense' ? 'bg-red-500' : ''}`}
                >
                  <TrendingDown size={14} color={transactionType === 'expense' ? 'white' : '#78716c'} />
                  <Text className={`text-xs font-semibold ${transactionType === 'expense' ? 'text-white' : 'text-stone-500'}`}>Expense</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setTransactionType('income')}
                  className={`flex-1 py-1.5 rounded-lg flex-row justify-center items-center gap-1.5 ${transactionType === 'income' ? 'bg-green-600' : ''}`}
                >
                  <TrendingUp size={14} color={transactionType === 'income' ? 'white' : '#78716c'} />
                  <Text className={`text-xs font-semibold ${transactionType === 'income' ? 'text-white' : 'text-stone-500'}`}>Income</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">
                  {transactionType === 'income' ? 'Deposit To' : 'Paid From'}
                </Text>
                <View className="border border-stone-200 rounded-xl overflow-hidden bg-stone-50">
                  <Picker selectedValue={accountId} onValueChange={handleAccountChange} style={{ height: 44 }}>
                    {accounts.filter(a => a.currency === activeProfile).map(a => (
                      <Picker.Item key={a.id} label={a.bankName} value={a.id} />
                    ))}
                  </Picker>
                </View>
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Date (YYYY-MM-DD)</Text>
                <TextInput
                  className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs"
                  placeholder="YYYY-MM-DD"
                  value={date}
                  onChangeText={setDate}
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">
                {transactionType === 'income' ? 'Amount Received' : 'Amount Spent'}
              </Text>
              <View className="flex-row items-center bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 gap-1">
                <Text className="text-sm font-bold text-stone-400">{currency === 'KRW' ? '₩' : 'RM'}</Text>
                <TextInput
                  className="flex-1 text-sm font-bold text-stone-800"
                  keyboardType="numeric"
                  placeholder="0.00"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>
            </View>

            <View className="mb-4">
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-xs font-bold text-stone-500 uppercase tracking-wider">Category</Text>
                <TouchableOpacity
                  onPress={() => setShowCategoryCreator(!showCategoryCreator)}
                  className="flex-row items-center gap-0.5"
                >
                  <Plus size={14} color="#22C55E" />
                  <Text className="text-[11px] text-green-500 font-semibold">Create custom</Text>
                </TouchableOpacity>
              </View>

              {!showCategoryCreator ? (
                <View className="border border-stone-200 rounded-xl overflow-hidden bg-stone-50">
                  <Picker selectedValue={selectedCategory} onValueChange={setSelectedCategory} style={{ height: 44 }}>
                    {categories.map(c => <Picker.Item key={c.id} label={c.name} value={c.name} />)}
                  </Picker>
                </View>
              ) : (
                <View className="bg-stone-50 p-3 rounded-2xl border border-stone-200 gap-3">
                  <Text className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">New custom label</Text>
                  <TextInput
                    className="bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs"
                    placeholder="e.g. Ramadhan Bazaar, K-Pop"
                    value={newCatName}
                    onChangeText={setNewCatName}
                  />
                  <View>
                    <Text className="text-[9px] text-stone-400 font-semibold mb-1">Pick Icon:</Text>
                    <View className="flex-row flex-wrap gap-1">
                      {PRESET_ICONS.map(pi => {
                        const Icon = pi.component;
                        const isSelected = newCatIcon === pi.name;
                        return (
                          <TouchableOpacity
                            key={pi.name}
                            onPress={() => setNewCatIcon(pi.name)}
                            className={`p-1.5 rounded-md border ${isSelected ? 'bg-stone-800 border-stone-800' : 'bg-white border-stone-200'}`}
                          >
                            <Icon size={14} color={isSelected ? 'white' : '#78716c'} />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                  <View>
                    <Text className="text-[9px] text-stone-400 font-semibold mb-1">Pick Color:</Text>
                    <View className="flex-row gap-2">
                      {PRESET_COLORS.map(pc => {
                        const isSelected = newCatColor === pc.name;
                        return (
                          <TouchableOpacity
                            key={pc.name}
                            onPress={() => setNewCatColor(pc.name)}
                            style={{
                              width: 18, height: 18, borderRadius: 9,
                              backgroundColor: pc.iconColor,
                              borderWidth: isSelected ? 2.5 : 0,
                              borderColor: '#1c1917',
                            }}
                          />
                        );
                      })}
                    </View>
                  </View>
                  <View className="flex-row gap-1.5 pt-1">
                    <TouchableOpacity onPress={handleCreateCategory} className="flex-1 bg-green-500 py-1.5 rounded-lg items-center">
                      <Text className="text-white text-[11px] font-semibold">Add Label</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowCategoryCreator(false)} className="bg-stone-200 px-3 py-1.5 rounded-lg">
                      <Text className="text-stone-600 text-[11px] font-semibold">Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            <View className="mb-4">
              <Text className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Notes / Description</Text>
              <TextInput
                className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs"
                placeholder="e.g. Ice Americano at Backery"
                value={note}
                onChangeText={setNote}
              />
            </View>

            <TouchableOpacity onPress={handleSubmit} className="w-full bg-green-500 py-2.5 px-4 rounded-xl items-center">
              <Text className="text-white text-xs font-semibold">Log Transaction</Text>
            </TouchableOpacity>
          </View>

          {/* Pocket Meters */}
          <View className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200">
            <Text className="font-bold text-stone-800 text-base mb-1">Where is my pocket money going?</Text>
            <Text className="text-xs text-stone-400 mb-4 font-medium">
              Percentages of total {activeProfile === 'KRW' ? 'Korean Won' : 'Malaysian Ringgit'} expenditures
            </Text>
            <View className="gap-3">
              {categories.map(c => {
                const spent = categorySpendingSums[c.name] || 0;
                const pct = totalSpending > 0 ? (spent / totalSpending) * 100 : 0;
                const colorConfig = PRESET_COLORS.find(pc => pc.name === c.color) || PRESET_COLORS[0];
                return (
                  <View key={c.id} className="gap-1">
                    <View className="flex-row justify-between items-center">
                      <Text className="font-semibold text-stone-700 text-xs">{c.name}</Text>
                      <Text className="text-stone-500 text-xs font-medium">
                        {pct.toFixed(0)}% ({sym}{' '}
                        {activeProfile === 'KRW'
                          ? Math.round(spent).toLocaleString()
                          : spent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                      </Text>
                    </View>
                    <View className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                      <View className={`h-full ${colorConfig.bg} rounded-full`} style={{ width: `${pct}%` }} />
                    </View>
                  </View>
                );
              })}
              {expenses.filter(exp => exp.currency === activeProfile).length === 0 && (
                <Text className="text-xs text-stone-400 text-center py-4">
                  No {activeProfile === 'KRW' ? 'Korean' : 'Malaysian'} expenses recorded yet.
                </Text>
              )}
            </View>
          </View>

          {/* Expense Log */}
          <View className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200">
            <View className="mb-3">
              <Text className="font-bold text-stone-800 text-lg">My Pocket Check Log</Text>
              <Text className="text-xs text-stone-400 font-medium">Chronological history of daily transactions</Text>
            </View>

            <View className="flex-row items-center bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 gap-2 mb-3">
              <Search size={16} color="#a8a29e" />
              <TextInput
                className="flex-1 text-xs"
                placeholder="Search note or label..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <View className="flex-row gap-2 mb-4 flex-wrap">
              <View className="flex-row items-center gap-1 bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200">
                <Filter size={12} color="#a8a29e" />
                <Text className="text-xs text-stone-600 font-medium">Filter:</Text>
              </View>
              <View className="border border-stone-200 rounded-lg bg-stone-50 overflow-hidden">
                <Picker selectedValue={filterAccount} onValueChange={setFilterAccount} style={{ height: 32, width: 140 }}>
                  <Picker.Item label="All Accounts" value="all" />
                  {accounts.filter(a => a.currency === activeProfile).map(a => (
                    <Picker.Item key={a.id} label={a.bankName} value={a.id} />
                  ))}
                </Picker>
              </View>
              <View className="border border-stone-200 rounded-lg bg-stone-50 overflow-hidden">
                <Picker selectedValue={filterCategory} onValueChange={setFilterCategory} style={{ height: 32, width: 150 }}>
                  <Picker.Item label="All Categories" value="all" />
                  {categories.map(c => <Picker.Item key={c.id} label={c.name} value={c.name} />)}
                </Picker>
              </View>
            </View>

            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              <View className="gap-2.5">
                {filteredExpenses.map(exp => {
                  const matchedAccount = accounts.find(a => a.id === exp.accountId);
                  const isPositive = exp.type === 'income' || exp.amount < 0;
                  return (
                    <View key={exp.id} className="flex-row items-center justify-between p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
                      <View className="flex-row items-center gap-3 flex-1 mr-2">
                        {renderCategoryIcon(exp.category)}
                        <View className="flex-1">
                          <Text className="font-semibold text-stone-800 text-xs" numberOfLines={1}>{exp.note}</Text>
                          <View className="flex-row items-center gap-1 mt-0.5 flex-wrap">
                            <Text className="bg-stone-100 px-1.5 py-0.5 rounded text-stone-600 font-semibold text-[10px]">{exp.category}</Text>
                            <Text className="text-stone-400 text-[10px]">•</Text>
                            <Text className="text-stone-400 text-[10px] font-medium">{matchedAccount?.bankName || '?'}</Text>
                            <Text className="text-stone-400 text-[10px]">•</Text>
                            <Text className="text-stone-400 text-[10px]">{exp.date}</Text>
                          </View>
                        </View>
                      </View>
                      <View className="flex-row items-center gap-2">
                        {exp.type && (
                          <View className={`px-1.5 py-0.5 rounded-md ${exp.type === 'income' ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
                            <Text className={`text-[10px] font-extrabold uppercase ${exp.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>{exp.type}</Text>
                          </View>
                        )}
                        <Text className={`font-bold text-xs ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                          {isPositive ? '+' : '-'} {exp.currency === 'KRW' ? '₩' : 'RM'}{' '}
                          {Math.abs(exp.amount).toLocaleString(undefined, { minimumFractionDigits: exp.currency === 'KRW' ? 0 : 2 })}
                        </Text>
                        <TouchableOpacity onPress={() => handleDeleteExpense(exp.id)} className="p-1">
                          <Trash2 size={15} color="#d4d0ce" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
                {filteredExpenses.length === 0 && (
                  <View className="py-10 items-center">
                    <Text className="text-xs text-stone-400 font-medium">No transactions match your current filters.</Text>
                  </View>
                )}
              </View>
            </ScrollView>

            <View className="mt-4 pt-4 border-t border-stone-200 items-end">
              <Text className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Total spent ({activeProfile})</Text>
              <Text className="font-bold text-stone-900 text-xl">
                {sym}{' '}
                {activeProfile === 'KRW'
                  ? Math.round(totalSpending).toLocaleString()
                  : totalSpending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <Text className="text-xs text-stone-400 mt-0.5 font-medium">
                ≈ {activeProfile === 'KRW' ? 'RM' : '₩'}{' '}
                {activeProfile === 'KRW'
                  ? ((totalSpending / 1000) * exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : Math.round(totalSpending * (1000 / exchangeRate)).toLocaleString()}
              </Text>
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
