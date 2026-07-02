import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { HandCoins, Plus, Check, TrendingUp, TrendingDown } from 'lucide-react-native';
import { BorrowRecord, BankAccount, Currency } from '../types';

interface DebtTrackerProps {
  records: BorrowRecord[];
  accounts: BankAccount[];
  onAddBorrowRecord: (record: Omit<BorrowRecord, 'id'>) => void;
  onRecordRepayment: (recordId: string, accountId: string, amount: number) => void;
  onRecordCollection: (recordId: string, accountId: string, amount: number) => void;
}

export default function DebtTracker({ records, accounts, onAddBorrowRecord, onRecordRepayment, onRecordCollection }: DebtTrackerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newType, setNewType] = useState<'borrow' | 'lend'>('borrow');
  const [newPerson, setNewPerson] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCurrency, setNewCurrency] = useState<Currency>('KRW');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newNote, setNewNote] = useState('');
  const [activeActionRecordId, setActiveActionRecordId] = useState<string | null>(null);
  const [actionAmount, setActionAmount] = useState('');
  const [actionAccountId, setActionAccountId] = useState('');

  React.useEffect(() => {
    if (accounts.length > 0 && !actionAccountId) setActionAccountId(accounts[0].id);
  }, [accounts]);

  const handleAddRecord = () => {
    const parsedAmt = parseFloat(newAmount);
    if (!newPerson.trim() || isNaN(parsedAmt) || parsedAmt <= 0) return;
    onAddBorrowRecord({ type: newType, person: newPerson.trim(), amount: parsedAmt, repaidAmount: 0, currency: newCurrency, date: newDate, note: newNote.trim() || undefined, status: 'unpaid' });
    setNewPerson(''); setNewAmount(''); setNewNote('');
    setShowAddForm(false);
  };

  const handleActionSubmit = (record: BorrowRecord) => {
    const amt = parseFloat(actionAmount);
    if (isNaN(amt) || amt <= 0 || !actionAccountId) return;
    if (record.type === 'borrow') {
      onRecordRepayment(record.id, actionAccountId, amt);
    } else {
      onRecordCollection(record.id, actionAccountId, amt);
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

  const renderRecord = (record: BorrowRecord) => {
    const remaining = record.amount - record.repaidAmount;
    const progressPct = Math.min((record.repaidAmount / record.amount) * 100, 100);
    const sym = record.currency === 'KRW' ? '₩' : 'RM';
    const isCompleted = record.status === 'paid';
    const isBorrow = record.type === 'borrow';

    return (
      <View key={record.id} className={`p-4 rounded-2xl border mb-3 ${isCompleted ? 'bg-stone-50/40 border-stone-200 opacity-70' : (isBorrow ? 'bg-red-50/20 border-red-100' : 'bg-green-50/20 border-green-50')}`}>
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1 mr-2">
            <Text className="font-bold text-stone-800 text-sm">{record.person}</Text>
            <Text className="text-[10px] text-stone-400 mt-0.5">{record.date}{record.note ? ` • ${record.note}` : ''}</Text>
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
            <View className={`h-full ${isBorrow ? 'bg-red-500' : 'bg-green-500'} rounded-full`} style={{ width: `${progressPct}%` }} />
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
          <>
            {activeActionRecordId === record.id ? (
              <View className="bg-white mt-3 p-2.5 rounded-xl border border-stone-200 gap-2">
                <Text className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                  {isBorrow ? 'Record Repayment' : 'Record Collection'}
                </Text>
                <View className="border border-stone-200 rounded-lg overflow-hidden bg-stone-50">
                  <Picker selectedValue={actionAccountId} onValueChange={(v) => setActionAccountId(v)} style={{ height: 38 }}>
                    {accounts.map(acc => (
                      <Picker.Item key={acc.id} label={`${acc.bankName} (${acc.currency === 'KRW' ? '₩' : 'RM'} ${acc.balance.toLocaleString()})`} value={acc.id} />
                    ))}
                  </Picker>
                </View>
                <View className="flex-row items-center bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 gap-1">
                  <Text className="text-[10px] font-bold text-stone-400">{sym}</Text>
                  <TextInput className="flex-1 text-[10px] font-bold" keyboardType="numeric" placeholder={`Max ${remaining.toLocaleString()}`} value={actionAmount} onChangeText={setActionAmount} />
                </View>
                <View className="flex-row gap-1">
                  <TouchableOpacity onPress={() => handleActionSubmit(record)} className={`flex-1 ${isBorrow ? 'bg-red-500' : 'bg-green-600'} py-1.5 rounded-lg items-center`}>
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
            )}
          </>
        )}

        {isCompleted && (
          <View className="flex-row items-center gap-1 mt-2">
            <View className="p-0.5 bg-green-500 rounded-full">
              <Check size={10} color="white" />
            </View>
            <Text className="text-[10px] text-green-600 font-semibold">Fully {isBorrow ? 'repaid' : 'collected'}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
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
        <TouchableOpacity onPress={() => setShowAddForm(!showAddForm)} className="flex-row items-center gap-1 bg-stone-800 px-4 py-2.5 rounded-xl shadow-sm">
          <Plus size={14} color="white" />
          <Text className="text-xs font-semibold text-white">Record</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View className="flex-row gap-3 mb-5">
        <View className="flex-1 bg-red-50 p-3 rounded-2xl border border-red-100">
          <View className="flex-row items-center gap-1.5 mb-1">
            <TrendingDown size={14} color="#EF4444" />
            <Text className="text-[10px] font-bold text-red-500 uppercase tracking-wide">I Owe Others</Text>
          </View>
          <Text className="font-bold text-red-700 text-base">
            {borrowRecords[0] ? (borrowRecords[0].currency === 'KRW' ? '₩' : 'RM') : '₩'}{totalOwedByMe.toLocaleString()}
          </Text>
          <Text className="text-[10px] text-red-500 mt-0.5">{borrowRecords.filter(r => r.status !== 'paid').length} unpaid</Text>
        </View>
        <View className="flex-1 bg-green-50 p-3 rounded-2xl border border-green-50">
          <View className="flex-row items-center gap-1.5 mb-1">
            <TrendingUp size={14} color="#16A34A" />
            <Text className="text-[10px] font-bold text-green-600 uppercase tracking-wide">Others Owe Me</Text>
          </View>
          <Text className="font-bold text-green-500 text-base">
            {lendRecords[0] ? (lendRecords[0].currency === 'KRW' ? '₩' : 'RM') : '₩'}{totalOwedToMe.toLocaleString()}
          </Text>
          <Text className="text-[10px] text-green-500 mt-0.5">{lendRecords.filter(r => r.status !== 'paid').length} pending</Text>
        </View>
      </View>

      {/* Add Record Form */}
      {showAddForm && (
        <View className="bg-stone-50 p-4 rounded-2xl border border-stone-200 mb-5 gap-3">
          <Text className="text-xs font-bold text-stone-600 uppercase tracking-wider">Add New Record</Text>

          <View className="flex-row bg-stone-200/50 p-1 rounded-xl border border-stone-200">
            <TouchableOpacity onPress={() => setNewType('borrow')} className={`flex-1 py-1.5 rounded-lg items-center ${newType === 'borrow' ? 'bg-red-500' : ''}`}>
              <Text className={`text-xs font-semibold ${newType === 'borrow' ? 'text-white' : 'text-stone-500'}`}>I Borrowed</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setNewType('lend')} className={`flex-1 py-1.5 rounded-lg items-center ${newType === 'lend' ? 'bg-green-600' : ''}`}>
              <Text className={`text-xs font-semibold ${newType === 'lend' ? 'text-white' : 'text-stone-500'}`}>I Lent</Text>
            </TouchableOpacity>
          </View>

          <View>
            <Text className="text-[10px] font-semibold text-stone-500 uppercase mb-1">{newType === 'borrow' ? 'Borrowed From' : 'Lent To'}</Text>
            <TextInput className="bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs" placeholder="e.g. Azrul, Jiwon" value={newPerson} onChangeText={setNewPerson} />
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-[10px] font-semibold text-stone-500 uppercase mb-1">Amount</Text>
              <TextInput className="bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs font-bold" placeholder="0" keyboardType="numeric" value={newAmount} onChangeText={setNewAmount} />
            </View>
            <View className="flex-1">
              <Text className="text-[10px] font-semibold text-stone-500 uppercase mb-1">Currency</Text>
              <View className="border border-stone-200 rounded-lg bg-white overflow-hidden">
                <Picker selectedValue={newCurrency} onValueChange={(v) => setNewCurrency(v as Currency)} style={{ height: 38 }}>
                  <Picker.Item label="₩ KRW" value="KRW" />
                  <Picker.Item label="RM MYR" value="MYR" />
                </Picker>
              </View>
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-[10px] font-semibold text-stone-500 uppercase mb-1">Date</Text>
              <TextInput className="bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs" placeholder="YYYY-MM-DD" value={newDate} onChangeText={setNewDate} />
            </View>
            <View className="flex-1">
              <Text className="text-[10px] font-semibold text-stone-500 uppercase mb-1">Note (Optional)</Text>
              <TextInput className="bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs" placeholder="e.g. Dinner, Taxi" value={newNote} onChangeText={setNewNote} />
            </View>
          </View>

          <View className="flex-row gap-2 pt-1">
            <TouchableOpacity onPress={handleAddRecord} className={`flex-1 ${newType === 'borrow' ? 'bg-red-500' : 'bg-green-600'} py-2 rounded-lg items-center`}>
              <Text className="text-white text-xs font-semibold">Add Record</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowAddForm(false)} className="bg-stone-200 px-3 py-2 rounded-lg items-center">
              <Text className="text-stone-600 text-xs font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {borrowRecords.length > 0 && (
        <View className="mb-4">
          <Text className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2">I Borrowed From...</Text>
          {borrowRecords.map(renderRecord)}
        </View>
      )}

      {lendRecords.length > 0 && (
        <View>
          <Text className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2">I Lent To...</Text>
          {lendRecords.map(renderRecord)}
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
  );
}

