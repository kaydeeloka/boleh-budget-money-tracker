import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { Plus, Check, Sparkles, HandCoins, TrendingUp, TrendingDown } from 'lucide-react-native';
import Svg, { Rect, Circle, Path } from 'react-native-svg';
import { useAppContext } from '../../src/context/AppContext';
import { Currency, BorrowRecord } from '../../src/types';

function TabungIcon({ size = 24, color = '#22C55E' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Jar body */}
      <Path
        d="M11 11 L21 11 C25 12 26 14 26 15.5 L26 27.5 C26 29 24.7 30 23 30 L9 30 C7.3 30 6 29 6 27.5 L6 15.5 C6 14 7 12 11 11 Z"
        fill="#DEE6FF" stroke="#B8C4EE" strokeWidth="0.8"
      />
      {/* Glass shine */}
      <Path d="M8.5 15 C8.2 17 8 20 8.3 24" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.75" />
      {/* Lid */}
      <Rect x="6" y="7.5" width="20" height="5" rx="2.5" fill="#8B5E3C" />
      {/* Lid top highlight */}
      <Rect x="6.5" y="7.5" width="19" height="2" rx="1.5" fill="#A87848" />
      {/* Coin slot */}
      <Rect x="13.5" y="5.8" width="5" height="3" rx="1" fill="#5A3820" />
      {/* Top coin (partially above lid) */}
      <Circle cx="16" cy="5" r="3.8" fill="#F5C518" />
      <Circle cx="16" cy="5" r="3.8" stroke="#D4A017" strokeWidth="0.7" fill="none" />
      <Circle cx="16" cy="5" r="2.4" stroke="#D4A017" strokeWidth="0.5" fill="none" />
      <Path d="M16 2.5 L16 7.5" stroke="#D4A017" strokeWidth="0.8" strokeLinecap="round" fill="none" />
      <Path d="M14.3 3.7 C14.8 3.3 15.3 3.1 16 3.1 C17.2 3.1 17.8 3.8 17.8 4.5 C17.8 5.2 17 5.5 16 5.5 C14.9 5.5 14.3 6 14.3 6.6 C14.3 7.2 15 7.6 16 7.6" stroke="#D4A017" strokeWidth="0.7" strokeLinecap="round" fill="none" />
      {/* Coin 1 inside (upper-left) */}
      <Circle cx="13" cy="18.5" r="4.8" fill="#F5C518" />
      <Circle cx="13" cy="18.5" r="4.8" stroke="#D4A017" strokeWidth="0.7" fill="none" />
      <Circle cx="13" cy="18.5" r="3" stroke="#D4A017" strokeWidth="0.5" fill="none" />
      <Path d="M13 15.5 L13 21.5" stroke="#D4A017" strokeWidth="0.9" strokeLinecap="round" fill="none" />
      <Path d="M11.1 16.9 C11.6 16.4 12.2 16.2 13 16.2 C14.4 16.2 15.1 17 15.1 17.8 C15.1 18.6 14.2 18.9 13 18.9 C11.7 18.9 11.1 19.5 11.1 20.1 C11.1 20.8 12 21.2 13 21.2" stroke="#D4A017" strokeWidth="0.8" strokeLinecap="round" fill="none" />
      {/* Coin 2 inside (lower-right) */}
      <Circle cx="19" cy="25.5" r="4.2" fill="#F5C518" />
      <Circle cx="19" cy="25.5" r="4.2" stroke="#D4A017" strokeWidth="0.7" fill="none" />
      <Circle cx="19" cy="25.5" r="2.6" stroke="#D4A017" strokeWidth="0.5" fill="none" />
      <Path d="M19 22.8 L19 28.2" stroke="#D4A017" strokeWidth="0.9" strokeLinecap="round" fill="none" />
      <Path d="M17.2 24.1 C17.7 23.7 18.2 23.5 19 23.5 C20.3 23.5 21 24.2 21 24.9 C21 25.7 20.1 26 19 26 C17.8 26 17.2 26.5 17.2 27.1 C17.2 27.7 18 28.1 19 28.1" stroke="#D4A017" strokeWidth="0.8" strokeLinecap="round" fill="none" />
    </Svg>
  );
}

export default function GoalsDebtsScreen() {
  const {
    goals, accounts, records,
    handleAddGoal, handleAddContribution, handleDeleteGoal,
    handleAddBorrowRecord, handleRecordRepayment, handleRecordCollection,
  } = useAppContext();

  // ── Savings Goals state ──────────────────────────────────────────────
  const [showAddGoalForm, setShowAddGoalForm] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrency, setGoalCurrency] = useState<Currency>('KRW');
  const [goalDeadline, setGoalDeadline] = useState('');
  const [activeContributingGoalId, setActiveContributingGoalId] = useState<string | null>(null);
  const [contribAmount, setContribAmount] = useState('');
  const [contribAccountId, setContribAccountId] = useState('');

  // ── Debt Tracker state ───────────────────────────────────────────────
  const [showAddDebtForm, setShowAddDebtForm] = useState(false);
  const [debtType, setDebtType] = useState<'borrow' | 'lend'>('borrow');
  const [debtPerson, setDebtPerson] = useState('');
  const [debtAmount, setDebtAmount] = useState('');
  const [debtCurrency, setDebtCurrency] = useState<Currency>('KRW');
  const [debtDate, setDebtDate] = useState(new Date().toISOString().split('T')[0]);
  const [debtNote, setDebtNote] = useState('');
  const [activeActionRecordId, setActiveActionRecordId] = useState<string | null>(null);
  const [actionAmount, setActionAmount] = useState('');
  const [actionAccountId, setActionAccountId] = useState('');

  React.useEffect(() => {
    if (accounts.length > 0 && !contribAccountId) setContribAccountId(accounts[0].id);
  }, [accounts]);

  React.useEffect(() => {
    if (accounts.length > 0 && !actionAccountId) setActionAccountId(accounts[0].id);
  }, [accounts]);

  // ── Goals handlers ────────────────────────────────────────────────────
  const handleCreateGoal = () => {
    const targetVal = parseFloat(goalTarget);
    if (!goalTitle.trim() || isNaN(targetVal) || targetVal <= 0) return;
    handleAddGoal({
      title: goalTitle.trim(), targetAmount: targetVal,
      currentAmount: 0, currency: goalCurrency,
      deadline: goalDeadline || undefined,
    });
    setGoalTitle(''); setGoalTarget(''); setGoalDeadline('');
    setShowAddGoalForm(false);
  };

  const handleContributionSubmit = (goalId: string) => {
    const amt = parseFloat(contribAmount);
    if (isNaN(amt) || amt <= 0 || !contribAccountId) return;
    handleAddContribution(goalId, contribAccountId, amt);
    setContribAmount('');
    setActiveContributingGoalId(null);
  };

  // ── Debt handlers ─────────────────────────────────────────────────────
  const handleAddDebtRecord = () => {
    const parsedAmt = parseFloat(debtAmount);
    if (!debtPerson.trim() || isNaN(parsedAmt) || parsedAmt <= 0) return;
    handleAddBorrowRecord({
      type: debtType, person: debtPerson.trim(), amount: parsedAmt,
      repaidAmount: 0, currency: debtCurrency, date: debtDate,
      note: debtNote.trim() || undefined, status: 'unpaid',
    });
    setDebtPerson(''); setDebtAmount(''); setDebtNote('');
    setShowAddDebtForm(false);
  };

  const handleDebtActionSubmit = (record: BorrowRecord) => {
    const amt = parseFloat(actionAmount);
    if (isNaN(amt) || amt <= 0 || !actionAccountId) return;
    if (record.type === 'borrow') {
      handleRecordRepayment(record.id, actionAccountId, amt);
    } else {
      handleRecordCollection(record.id, actionAccountId, amt);
    }
    setActionAmount('');
    setActiveActionRecordId(null);
  };

  const getStatusColor = (status: string) => {
    if (status === 'paid') return 'text-green-600';
    if (status === 'partial') return 'text-amber-600';
    return 'text-red-500';
  };

  const getStatusBg = (status: string) => {
    if (status === 'paid') return 'bg-green-50 border-green-100';
    if (status === 'partial') return 'bg-amber-50 border-amber-200';
    return 'bg-red-50 border-red-200';
  };

  const borrowRecords = records.filter(r => r.type === 'borrow');
  const lendRecords = records.filter(r => r.type === 'lend');
  const totalOwedByMe = borrowRecords.reduce((sum, r) => sum + (r.amount - r.repaidAmount), 0);
  const totalOwedToMe = lendRecords.reduce((sum, r) => sum + (r.amount - r.repaidAmount), 0);

  const renderDebtRecord = (record: BorrowRecord) => {
    const remaining = record.amount - record.repaidAmount;
    const progressPct = Math.min((record.repaidAmount / record.amount) * 100, 100);
    const sym = record.currency === 'KRW' ? '₩' : 'RM';
    const isCompleted = record.status === 'paid';
    const isBorrow = record.type === 'borrow';

    return (
      <View key={record.id} className={`p-4 rounded-2xl border mb-3 ${isCompleted ? 'bg-stone-50/40 border-stone-200 opacity-70' : isBorrow ? 'bg-red-50/20 border-red-100' : 'bg-green-50/20 border-green-50'}`}>
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1 mr-2">
            <Text className="font-bold text-stone-800 text-sm">{record.person}</Text>
            <Text className="text-[10px] text-stone-400 mt-0.5">
              {record.date}{record.note ? ` • ${record.note}` : ''}
            </Text>
          </View>
          <View className="items-end gap-1">
            <Text className={`font-bold text-sm ${isBorrow ? 'text-red-500' : 'text-green-600'}`}>
              {sym}{record.amount.toLocaleString()}
            </Text>
            <View className={`px-1.5 py-0.5 rounded-md border ${getStatusBg(record.status)}`}>
              <Text className={`text-[10px] font-bold uppercase ${getStatusColor(record.status)}`}>{record.status}</Text>
            </View>
          </View>
        </View>

        {record.amount > 0 && (
          <View className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden mb-3">
            <View
              className={`h-full ${isBorrow ? 'bg-red-500' : 'bg-green-500'} rounded-full`}
              style={{ width: `${progressPct}%` }}
            />
          </View>
        )}

        <View className="flex-row justify-between items-center">
          <Text className="text-[11px] text-stone-500 font-medium">
            Remaining: <Text className="font-bold">{sym}{remaining.toLocaleString()}</Text>
          </Text>
          {!isCompleted && record.repaidAmount > 0 && (
            <Text className="text-[10px] text-stone-400">Settled: {sym}{record.repaidAmount.toLocaleString()}</Text>
          )}
        </View>

        {!isCompleted && (
          activeActionRecordId === record.id ? (
            <View className="bg-white mt-3 p-2.5 rounded-xl border border-stone-200 gap-2">
              <Text className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                {isBorrow ? 'Record Repayment' : 'Record Collection'}
              </Text>
              <View className="border border-stone-200 rounded-lg overflow-hidden bg-stone-50">
                <Picker selectedValue={actionAccountId} onValueChange={setActionAccountId} style={{ height: 38 }}>
                  {accounts.map(acc => (
                    <Picker.Item
                      key={acc.id}
                      label={`${acc.bankName} (${acc.currency === 'KRW' ? '₩' : 'RM'} ${acc.balance.toLocaleString()})`}
                      value={acc.id}
                    />
                  ))}
                </Picker>
              </View>
              <View className="flex-row items-center bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 gap-1">
                <Text className="text-[10px] font-bold text-stone-400">{sym}</Text>
                <TextInput
                  className="flex-1 text-[10px] font-bold"
                  keyboardType="numeric"
                  placeholder={`Max ${remaining.toLocaleString()}`}
                  value={actionAmount}
                  onChangeText={setActionAmount}
                />
              </View>
              <View className="flex-row gap-1">
                <TouchableOpacity
                  onPress={() => handleDebtActionSubmit(record)}
                  className={`flex-1 ${isBorrow ? 'bg-red-500' : 'bg-green-600'} py-1.5 rounded-lg items-center`}
                >
                  <Text className="text-white text-[10px] font-bold">Confirm</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveActionRecordId(null)} className="bg-stone-200 px-3 py-1.5 rounded-lg items-center">
                  <Text className="text-stone-600 text-[10px]">Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => {
                setActiveActionRecordId(record.id);
                const matched = accounts.find(a => a.currency === record.currency);
                if (matched) setActionAccountId(matched.id);
              }}
              className={`mt-2.5 px-3 py-1.5 rounded-xl self-start border ${isBorrow ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-100'}`}
            >
              <Text className={`text-[11px] font-bold ${isBorrow ? 'text-red-500' : 'text-green-600'}`}>
                {isBorrow ? 'Record Repayment' : 'Mark Collected'}
              </Text>
            </TouchableOpacity>
          )
        )}

        {isCompleted && (
          <View className="flex-row items-center gap-1 mt-2">
            <View className="p-0.5 bg-green-500 rounded-full">
              <Check size={10} color="white" />
            </View>
            <Text className="text-[10px] text-green-600 font-semibold">
              Fully {isBorrow ? 'repaid' : 'collected'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#faf8f5]" edges={['top']}>
      {/* Screen Header */}
      <View className="bg-white border-b border-stone-200 px-4 py-3">
        <View className="flex-row items-center gap-3">
          <View className="w-9 h-9 rounded-2xl bg-green-500 items-center justify-center">
            <TabungIcon size={20} color="white" />
          </View>
          <View>
            <Text className="text-[9px] font-extrabold tracking-widest text-stone-500 uppercase">Goals & Debts</Text>
            <Text className="font-bold text-stone-900 text-lg">Tabung & IOUs</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        <View className="gap-4 pb-8">

          {/* ── SAVINGS GOALS ─────────────────────────────────────────── */}
          <View className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200">
            <View className="flex-row items-center justify-between mb-5">
              <View className="flex-row items-center gap-2">
                <View className="p-2 bg-green-50 rounded-xl">
                  <TabungIcon size={20} color="#22C55E" />
                </View>
                <View>
                  <Text className="font-bold text-stone-800 text-lg">My Tabung Goals</Text>
                  <Text className="text-xs text-stone-400 font-medium">Save up for tickets, clothing, semester needs</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowAddGoalForm(!showAddGoalForm)}
                className="flex-row items-center gap-1 bg-green-500 px-4 py-2.5 rounded-xl shadow-sm"
              >
                <Plus size={14} color="white" />
                <Text className="text-xs font-semibold text-white">New Tabung</Text>
              </TouchableOpacity>
            </View>

            {showAddGoalForm && (
              <View className="bg-stone-50 p-4 rounded-2xl border border-stone-200 mb-5 gap-3">
                <Text className="text-xs font-bold text-stone-600 uppercase tracking-wider">Create New Tabung</Text>
                <View>
                  <Text className="text-[10px] font-semibold text-stone-500 uppercase mb-1">What are you saving for?</Text>
                  <TextInput
                    className="bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs"
                    placeholder="e.g. Flight to KL for Raya, Winter coat"
                    value={goalTitle}
                    onChangeText={setGoalTitle}
                  />
                </View>
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className="text-[10px] font-semibold text-stone-500 uppercase mb-1">Target Sum</Text>
                    <TextInput
                      className="bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                      placeholder="1000"
                      keyboardType="numeric"
                      value={goalTarget}
                      onChangeText={setGoalTarget}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[10px] font-semibold text-stone-500 uppercase mb-1">Currency</Text>
                    <View className="border border-stone-200 rounded-lg bg-white overflow-hidden">
                      <Picker selectedValue={goalCurrency} onValueChange={(v) => setGoalCurrency(v as Currency)} style={{ height: 38 }}>
                        <Picker.Item label="Korean Won (₩)" value="KRW" />
                        <Picker.Item label="Ringgit (RM)" value="MYR" />
                      </Picker>
                    </View>
                  </View>
                </View>
                <View>
                  <Text className="text-[10px] font-semibold text-stone-500 uppercase mb-1">Target Date / Semester (Optional)</Text>
                  <TextInput
                    className="bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs"
                    placeholder="e.g. October 2026, Summer Break"
                    value={goalDeadline}
                    onChangeText={setGoalDeadline}
                  />
                </View>
                <View className="flex-row gap-2 pt-1">
                  <TouchableOpacity onPress={handleCreateGoal} className="flex-1 bg-green-500 py-2 rounded-lg items-center">
                    <Text className="text-white text-xs font-semibold">Start Tabung</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowAddGoalForm(false)} className="bg-stone-200 px-3 py-2 rounded-lg items-center">
                    <Text className="text-stone-600 text-xs font-semibold">Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View className="gap-4">
              {goals.map(goal => {
                const progressPercent = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                const isCompleted = goal.currentAmount >= goal.targetAmount;
                const sym = goal.currency === 'KRW' ? '₩' : 'RM';

                return (
                  <View key={goal.id} className={`p-4 rounded-2xl border ${isCompleted ? 'bg-green-50/25 border-green-200' : 'bg-stone-50/50 border-stone-200'}`}>
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-1 mr-2">
                        <View className="flex-row items-center gap-1.5">
                          <Text className="font-bold text-stone-800 text-sm">{goal.title}</Text>
                          {isCompleted && (
                            <View className="p-0.5 bg-green-700 rounded-full">
                              <Check size={10} color="white" />
                            </View>
                          )}
                        </View>
                        {goal.deadline && (
                          <Text className="text-[10px] text-stone-400 mt-0.5">Target: {goal.deadline}</Text>
                        )}
                      </View>
                      <View className="items-end">
                        <Text className="text-[11px] text-stone-500 font-medium">
                          {sym}{goal.currentAmount.toLocaleString()} / {sym}{goal.targetAmount.toLocaleString()}
                        </Text>
                        <Text className={`text-xs font-bold ${isCompleted ? 'text-green-500' : 'text-green-600'}`}>
                          {progressPercent.toFixed(0)}%
                        </Text>
                      </View>
                    </View>

                    <View className="w-full bg-green-50/50 rounded-full h-2 overflow-hidden mb-3">
                      <View className="h-full bg-green-600 rounded-full" style={{ width: `${progressPercent}%` }} />
                    </View>

                    {activeContributingGoalId === goal.id ? (
                      <View className="bg-white p-2.5 rounded-xl border border-stone-200 gap-2">
                        <View className="border border-stone-200 rounded-lg overflow-hidden bg-stone-50">
                          <Picker selectedValue={contribAccountId} onValueChange={setContribAccountId} style={{ height: 38 }}>
                            {accounts.map(acc => (
                              <Picker.Item
                                key={acc.id}
                                label={`${acc.bankName} (${acc.currency === 'KRW' ? '₩' : 'RM'} ${acc.balance.toLocaleString()})`}
                                value={acc.id}
                              />
                            ))}
                          </Picker>
                        </View>
                        <View className="flex-row items-center bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 gap-1">
                          <Text className="text-[10px] font-bold text-stone-400">
                            {accounts.find(a => a.id === contribAccountId)?.currency === 'KRW' ? '₩' : 'RM'}
                          </Text>
                          <TextInput
                            className="flex-1 text-[10px] font-bold"
                            keyboardType="numeric"
                            placeholder="Amount"
                            value={contribAmount}
                            onChangeText={setContribAmount}
                          />
                        </View>
                        <View className="flex-row gap-1">
                          <TouchableOpacity onPress={() => handleContributionSubmit(goal.id)} className="flex-1 bg-green-500 py-1.5 rounded-lg items-center">
                            <Text className="text-white text-[10px] font-bold">Save</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => setActiveContributingGoalId(null)} className="bg-stone-200 px-3 py-1.5 rounded-lg items-center">
                            <Text className="text-stone-600 text-[10px]">Cancel</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <View className="flex-row items-center justify-between">
                        <TouchableOpacity
                          onPress={() => {
                            setActiveContributingGoalId(goal.id);
                            const matched = accounts.find(a => a.currency === goal.currency);
                            if (matched) setContribAccountId(matched.id);
                          }}
                          className="bg-green-50 border border-green-100/40 px-2.5 py-1.5 rounded-lg"
                        >
                          <Text className="text-[11px] font-semibold text-green-500">+ Save Money</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => Alert.alert(
                            'Delete Goal',
                            'Delete this savings goal? Any saved progress will be returned to your default accounts.',
                            [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => handleDeleteGoal(goal.id) }],
                          )}
                        >
                          <Text className="text-[10px] text-stone-400">Remove</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}

              {goals.length === 0 && (
                <View className="py-8 bg-stone-50/50 rounded-2xl border border-dashed border-stone-200 items-center">
                  <TabungIcon size={32} color="#22C55E" />
                  <Text className="text-xs text-stone-500 font-semibold mt-2">No tabung goals yet!</Text>
                  <Text className="text-[11px] text-stone-400 mt-0.5 font-medium">Tap "New Tabung" above to start saving.</Text>
                </View>
              )}
            </View>
          </View>

          {/* ── DEBT TRACKER ─────────────────────────────────────────── */}
          <View className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200">
            <View className="flex-row items-center justify-between mb-5">
              <View className="flex-row items-center gap-2">
                <View className="p-2 bg-amber-50 rounded-xl">
                  <HandCoins size={20} color="#92400e" />
                </View>
                <View>
                  <Text className="font-bold text-stone-800 text-lg">Borrowing & Lending</Text>
                  <Text className="text-xs text-stone-400 font-medium">Track IOUs between you and friends</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowAddDebtForm(!showAddDebtForm)}
                className="flex-row items-center gap-1 bg-stone-800 px-4 py-2.5 rounded-xl shadow-sm"
              >
                <Plus size={14} color="white" />
                <Text className="text-xs font-semibold text-white">Record</Text>
              </TouchableOpacity>
            </View>

            {/* Summary */}
            <View className="flex-row gap-3 mb-5">
              <View className="flex-1 bg-red-50 p-3 rounded-2xl border border-red-100">
                <View className="flex-row items-center gap-1.5 mb-1">
                  <TrendingDown size={14} color="#EF4444" />
                  <Text className="text-[10px] font-bold text-red-500 uppercase tracking-wide">I Owe Others</Text>
                </View>
                <Text className="font-bold text-red-700 text-base">
                  {borrowRecords[0] ? (borrowRecords[0].currency === 'KRW' ? '₩' : 'RM') : '₩'}{totalOwedByMe.toLocaleString()}
                </Text>
                <Text className="text-[10px] text-red-500 mt-0.5">
                  {borrowRecords.filter(r => r.status !== 'paid').length} unpaid
                </Text>
              </View>
              <View className="flex-1 bg-green-50 p-3 rounded-2xl border border-green-50">
                <View className="flex-row items-center gap-1.5 mb-1">
                  <TrendingUp size={14} color="#16A34A" />
                  <Text className="text-[10px] font-bold text-green-600 uppercase tracking-wide">Others Owe Me</Text>
                </View>
                <Text className="font-bold text-green-500 text-base">
                  {lendRecords[0] ? (lendRecords[0].currency === 'KRW' ? '₩' : 'RM') : '₩'}{totalOwedToMe.toLocaleString()}
                </Text>
                <Text className="text-[10px] text-green-500 mt-0.5">
                  {lendRecords.filter(r => r.status !== 'paid').length} pending
                </Text>
              </View>
            </View>

            {showAddDebtForm && (
              <View className="bg-stone-50 p-4 rounded-2xl border border-stone-200 mb-5 gap-3">
                <Text className="text-xs font-bold text-stone-600 uppercase tracking-wider">Add New Record</Text>

                <View className="flex-row bg-stone-200/50 p-1 rounded-xl border border-stone-200">
                  <TouchableOpacity
                    onPress={() => setDebtType('borrow')}
                    className={`flex-1 py-1.5 rounded-lg items-center ${debtType === 'borrow' ? 'bg-red-500' : ''}`}
                  >
                    <Text className={`text-xs font-semibold ${debtType === 'borrow' ? 'text-white' : 'text-stone-500'}`}>I Borrowed</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setDebtType('lend')}
                    className={`flex-1 py-1.5 rounded-lg items-center ${debtType === 'lend' ? 'bg-green-600' : ''}`}
                  >
                    <Text className={`text-xs font-semibold ${debtType === 'lend' ? 'text-white' : 'text-stone-500'}`}>I Lent</Text>
                  </TouchableOpacity>
                </View>

                <View>
                  <Text className="text-[10px] font-semibold text-stone-500 uppercase mb-1">
                    {debtType === 'borrow' ? 'Borrowed From' : 'Lent To'}
                  </Text>
                  <TextInput
                    className="bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs"
                    placeholder="e.g. Azrul, Jiwon"
                    value={debtPerson}
                    onChangeText={setDebtPerson}
                  />
                </View>

                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className="text-[10px] font-semibold text-stone-500 uppercase mb-1">Amount</Text>
                    <TextInput
                      className="bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                      placeholder="0"
                      keyboardType="numeric"
                      value={debtAmount}
                      onChangeText={setDebtAmount}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[10px] font-semibold text-stone-500 uppercase mb-1">Currency</Text>
                    <View className="border border-stone-200 rounded-lg bg-white overflow-hidden">
                      <Picker selectedValue={debtCurrency} onValueChange={(v) => setDebtCurrency(v as Currency)} style={{ height: 38 }}>
                        <Picker.Item label="₩ KRW" value="KRW" />
                        <Picker.Item label="RM MYR" value="MYR" />
                      </Picker>
                    </View>
                  </View>
                </View>

                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className="text-[10px] font-semibold text-stone-500 uppercase mb-1">Date</Text>
                    <TextInput
                      className="bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs"
                      placeholder="YYYY-MM-DD"
                      value={debtDate}
                      onChangeText={setDebtDate}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[10px] font-semibold text-stone-500 uppercase mb-1">Note (Optional)</Text>
                    <TextInput
                      className="bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs"
                      placeholder="e.g. Dinner, Taxi"
                      value={debtNote}
                      onChangeText={setDebtNote}
                    />
                  </View>
                </View>

                <View className="flex-row gap-2 pt-1">
                  <TouchableOpacity
                    onPress={handleAddDebtRecord}
                    className={`flex-1 ${debtType === 'borrow' ? 'bg-red-500' : 'bg-green-600'} py-2 rounded-lg items-center`}
                  >
                    <Text className="text-white text-xs font-semibold">Add Record</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowAddDebtForm(false)} className="bg-stone-200 px-3 py-2 rounded-lg items-center">
                    <Text className="text-stone-600 text-xs font-semibold">Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {borrowRecords.length > 0 && (
              <View className="mb-4">
                <Text className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2">I Borrowed From...</Text>
                {borrowRecords.map(renderDebtRecord)}
              </View>
            )}

            {lendRecords.length > 0 && (
              <View>
                <Text className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2">I Lent To...</Text>
                {lendRecords.map(renderDebtRecord)}
              </View>
            )}

            {records.length === 0 && (
              <View className="py-8 bg-stone-50/50 rounded-2xl border border-dashed border-stone-200 items-center">
                <HandCoins size={24} color="#a8a29e" />
                <Text className="text-xs text-stone-500 font-semibold mt-2">No debt records yet</Text>
                <Text className="text-[11px] text-stone-400 mt-0.5">Track borrowed or lent money here</Text>
              </View>
            )}
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
