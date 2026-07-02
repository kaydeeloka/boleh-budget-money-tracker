import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { PiggyBank, Plus, Check, Sparkles } from 'lucide-react-native';
import { SavingsGoal, BankAccount, Currency } from '../types';

interface SavingsGoalsProps {
  goals: SavingsGoal[];
  accounts: BankAccount[];
  onAddGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  onAddContribution: (goalId: string, accountId: string, amount: number) => void;
  onDeleteGoal: (goalId: string) => void;
}

export default function SavingsGoals({ goals, accounts, onAddGoal, onAddContribution, onDeleteGoal }: SavingsGoalsProps) {
  const [showAddGoalForm, setShowAddGoalForm] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrency, setGoalCurrency] = useState<Currency>('KRW');
  const [goalDeadline, setGoalDeadline] = useState('');
  const [activeContributingGoalId, setActiveContributingGoalId] = useState<string | null>(null);
  const [contribAmount, setContribAmount] = useState('');
  const [contribAccountId, setContribAccountId] = useState('');

  React.useEffect(() => {
    if (accounts.length > 0 && !contribAccountId) setContribAccountId(accounts[0].id);
  }, [accounts]);

  const handleCreateGoal = () => {
    const targetVal = parseFloat(goalTarget);
    if (!goalTitle.trim() || isNaN(targetVal) || targetVal <= 0) return;
    onAddGoal({ title: goalTitle.trim(), targetAmount: targetVal, currentAmount: 0, currency: goalCurrency, deadline: goalDeadline || undefined });
    setGoalTitle(''); setGoalTarget(''); setGoalDeadline('');
    setShowAddGoalForm(false);
  };

  const handleContributionSubmit = (goalId: string) => {
    const amt = parseFloat(contribAmount);
    if (isNaN(amt) || amt <= 0 || !contribAccountId) return;
    onAddContribution(goalId, contribAccountId, amt);
    setContribAmount('');
    setActiveContributingGoalId(null);
  };

  return (
    <View className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200 mb-4">
      <View className="flex-row items-center justify-between mb-5">
        <View className="flex-row items-center gap-2">
          <View className="p-2 bg-green-50 rounded-xl">
            <PiggyBank size={20} color="#22C55E" />
          </View>
          <View>
            <Text className="font-bold text-stone-800 text-lg">My Piggy Bank Goals</Text>
            <Text className="text-xs text-stone-400 font-medium">Save up for tickets, clothing, semester needs</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setShowAddGoalForm(!showAddGoalForm)} className="flex-row items-center gap-1 bg-green-500 px-4 py-2.5 rounded-xl shadow-sm">
          <Plus size={14} color="white" />
          <Text className="text-xs font-semibold text-white">New Piggy Bank</Text>
        </TouchableOpacity>
      </View>

      {/* Add Goal Form */}
      {showAddGoalForm && (
        <View className="bg-stone-50 p-4 rounded-2xl border border-stone-200 mb-5 gap-3">
          <Text className="text-xs font-bold text-stone-600 uppercase tracking-wider">Create Savings Target</Text>
          <View>
            <Text className="text-[10px] font-semibold text-stone-500 uppercase mb-1">What are you saving for?</Text>
            <TextInput className="bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs" placeholder="e.g. Flight to KL for Raya, Winter coat" value={goalTitle} onChangeText={setGoalTitle} />
          </View>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-[10px] font-semibold text-stone-500 uppercase mb-1">Target Sum</Text>
              <TextInput className="bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs font-bold" placeholder="1000" keyboardType="numeric" value={goalTarget} onChangeText={setGoalTarget} />
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
            <TextInput className="bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs" placeholder="e.g. October 2026, Summer Break" value={goalDeadline} onChangeText={setGoalDeadline} />
          </View>
          <View className="flex-row gap-2 pt-1">
            <TouchableOpacity onPress={handleCreateGoal} className="flex-1 bg-green-500 py-2 rounded-lg items-center">
              <Text className="text-white text-xs font-semibold">Start Piggy Bank</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowAddGoalForm(false)} className="bg-stone-200 px-3 py-2 rounded-lg items-center">
              <Text className="text-stone-600 text-xs font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Goals Display */}
      <View className="gap-4">
        {goals.map((goal) => {
          const progressPercent = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
          const isCompleted = goal.currentAmount >= goal.targetAmount;
          const isKRW = goal.currency === 'KRW';
          const sym = isKRW ? '₩' : 'RM';

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
                  {goal.deadline && <Text className="text-[10px] text-stone-400 mt-0.5">Target: {goal.deadline}</Text>}
                </View>
                <View className="items-end">
                  <Text className="text-[11px] text-stone-500 font-medium">{sym}{goal.currentAmount.toLocaleString()} / {sym}{goal.targetAmount.toLocaleString()}</Text>
                  <Text className={`text-xs font-bold ${isCompleted ? 'text-green-500' : 'text-green-600'}`}>{progressPercent.toFixed(0)}%</Text>
                </View>
              </View>

              <View className="w-full bg-green-50/50 rounded-full h-2 overflow-hidden mb-3">
                <View className="h-full bg-green-600 rounded-full" style={{ width: `${progressPercent}%` }} />
              </View>

              {activeContributingGoalId === goal.id ? (
                <View className="bg-white p-2.5 rounded-xl border border-stone-200 gap-2">
                  <View className="border border-stone-200 rounded-lg overflow-hidden bg-stone-50">
                    <Picker selectedValue={contribAccountId} onValueChange={(v) => setContribAccountId(v)} style={{ height: 38 }}>
                      {accounts.map(acc => (
                        <Picker.Item key={acc.id} label={`${acc.bankName} (${acc.currency === 'KRW' ? '₩' : 'RM'} ${acc.balance.toLocaleString()})`} value={acc.id} />
                      ))}
                    </Picker>
                  </View>
                  <View className="flex-row items-center bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 gap-1">
                    <Text className="text-[10px] font-bold text-stone-400">{accounts.find(a => a.id === contribAccountId)?.currency === 'KRW' ? '₩' : 'RM'}</Text>
                    <TextInput className="flex-1 text-[10px] font-bold" keyboardType="numeric" placeholder="Amount" value={contribAmount} onChangeText={setContribAmount} />
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
                    onPress={() => Alert.alert('Delete Goal', 'Delete this savings goal? Any saved progress will be returned to your default accounts.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => onDeleteGoal(goal.id) }])}
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
            <Sparkles size={24} color="#22C55E" />
            <Text className="text-xs text-stone-500 font-semibold mt-2">No savings goals yet!</Text>
            <Text className="text-[11px] text-stone-400 mt-0.5 font-medium">Click "New Piggy Bank" above to start.</Text>
          </View>
        )}
      </View>
    </View>
  );
}

