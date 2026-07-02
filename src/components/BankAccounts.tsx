import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { Plus, ArrowRightLeft, Check, Globe, Compass, ChevronLeft, ChevronRight, Eye, EyeOff, Copy, SlidersHorizontal } from 'lucide-react-native';
import { BankAccount, Currency } from '../types';

interface BankAccountsProps {
  accounts: BankAccount[];
  exchangeRate: number;
  onAdjustBalance: (accountId: string, newBalance: number) => void;
  onRecordTransfer: (fromAccountId: string, toAccountId: string, amountFrom: number, amountTo: number) => void;
  onAddAccount: (acc: Omit<BankAccount, 'id'>) => void;
}

const CARD_BG = '#166534';
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

export default function BankAccounts({ accounts, exchangeRate, onAdjustBalance, onRecordTransfer, onAddAccount }: BankAccountsProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editBalanceVal, setEditBalanceVal] = useState('');
  const [showAccountNo, setShowAccountNo] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => { setShowAccountNo(false); }, [currentIndex]);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferFromId, setTransferFromId] = useState('');
  const [transferToId, setTransferToId] = useState('');
  const [transferAmountRaw, setTransferAmountRaw] = useState('');
  const [showAddBankForm, setShowAddBankForm] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [newBankLabel, setNewBankLabel] = useState('');
  const [newBankCurrency, setNewBankCurrency] = useState<Currency>('KRW');
  const [newBankBalance, setNewBankBalance] = useState('');
  const [newBankNumber, setNewBankNumber] = useState('');

  const safeIndex = Math.min(currentIndex, accounts.length - 1);
  const acc = accounts[safeIndex];

  const handleSaveEdit = (accountId: string) => {
    const val = parseFloat(editBalanceVal);
    if (!isNaN(val)) onAdjustBalance(accountId, val);
    setEditingAccountId(null);
  };

  const handleOpenTransfer = () => {
    if (accounts.length >= 2) {
      setTransferFromId(accounts[0].id);
      const other = accounts.find(a => a.id !== accounts[0].id);
      setTransferToId(other ? other.id : '');
      setTransferAmountRaw('');
      setShowTransferModal(true);
    } else {
      Alert.alert('Need 2 accounts', 'Add at least one more account to transfer between.');
    }
  };

  const executeTransfer = () => {
    const fromAcc = accounts.find(a => a.id === transferFromId);
    const toAcc = accounts.find(a => a.id === transferToId);
    const amtFrom = parseFloat(transferAmountRaw);
    if (!fromAcc || !toAcc || isNaN(amtFrom) || amtFrom <= 0) return;
    let amtTo = 0;
    if (fromAcc.currency === 'MYR' && toAcc.currency === 'KRW') amtTo = amtFrom * (1000 / exchangeRate);
    else if (fromAcc.currency === 'KRW' && toAcc.currency === 'MYR') amtTo = (amtFrom / 1000) * exchangeRate;
    else amtTo = amtFrom;
    onRecordTransfer(fromAcc.id, toAcc.id, amtFrom, Math.round(amtTo * 100) / 100);
    setShowTransferModal(false);
  };

  const handleAddBankSubmit = () => {
    const parsedBalance = parseFloat(newBankBalance);
    if (!newBankName.trim() || !newBankLabel.trim() || isNaN(parsedBalance)) return;
    onAddAccount({ name: newBankName.trim(), bankName: newBankLabel.trim(), currency: newBankCurrency, balance: parsedBalance, accountNo: newBankNumber.trim() || undefined });
    setNewBankName(''); setNewBankLabel(''); setNewBankBalance(''); setNewBankNumber('');
    setShowAddBankForm(false);
  };

  const getReferenceValue = (a: BankAccount) => {
    if (a.currency === 'KRW') {
      const val = (a.balance / 1000) * exchangeRate;
      return `≈ RM ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `≈ ₩${Math.round(a.balance * (1000 / exchangeRate)).toLocaleString()}`;
  };

  const getTransferPreview = () => {
    const fromAcc = accounts.find(a => a.id === transferFromId);
    const toAcc = accounts.find(a => a.id === transferToId);
    const amtFrom = parseFloat(transferAmountRaw);
    if (!fromAcc || !toAcc || isNaN(amtFrom) || amtFrom <= 0) return null;
    if (fromAcc.currency === 'MYR' && toAcc.currency === 'KRW') return `₩${Math.round(amtFrom * (1000 / exchangeRate)).toLocaleString()}`;
    if (fromAcc.currency === 'KRW' && toAcc.currency === 'MYR') return `RM ${((amtFrom / 1000) * exchangeRate).toFixed(2)}`;
    return `${fromAcc.currency === 'KRW' ? '₩' : 'RM'} ${amtFrom.toLocaleString()}`;
  };

  return (
    <View className="bg-white rounded-3xl p-5 shadow-sm border border-stone-200 mb-4">
      {/* Header */}
      <View className="flex-row items-start justify-between mb-4">
        <View className="flex-1 mr-3">
          <Text className="font-bold text-stone-900 text-xl leading-tight">My Bank{'\n'}Accounts</Text>
          <Text className="text-xs text-stone-400 mt-1 leading-tight">Manage balances{'\n'}in both countries</Text>
        </View>
        <View className="items-end gap-2">
          <View className="flex-row items-center gap-2">
            <TouchableOpacity onPress={() => setShowAddBankForm(!showAddBankForm)} className="flex-row items-center gap-1.5 bg-stone-100 border border-stone-200 px-3.5 py-2 rounded-xl">
              <Plus size={13} color="#44403c" />
              <Text className="text-xs font-semibold text-stone-700">Add Bank</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/accounts')} className="w-8 h-8 rounded-xl bg-stone-100 border border-stone-200 items-center justify-center">
              <SlidersHorizontal size={15} color="#44403c" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleOpenTransfer} className="flex-row items-center gap-1.5 bg-green-500 px-4 py-2.5 rounded-xl shadow-sm">
            <ArrowRightLeft size={14} color="white" />
            <Text className="text-xs font-bold text-white">Transfer &{'\n'}Convert</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigation row */}
      {accounts.length > 0 && (
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <Text style={{ fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: '#a8a29e', textTransform: 'uppercase' }}>Swipe or Arrows:</Text>
            <View style={{ width: 26, height: 13, backgroundColor: '#22C55E', borderRadius: 7 }}>
              <View style={{ position: 'absolute', right: 2, top: 2, width: 9, height: 9, backgroundColor: 'white', borderRadius: 5 }} />
            </View>
          </View>
          <View className="flex-row items-center gap-1">
            <TouchableOpacity onPress={() => setCurrentIndex(i => Math.max(0, i - 1))} disabled={safeIndex === 0} className="p-1">
              <ChevronLeft size={18} color={safeIndex === 0 ? '#d4d0ce' : '#44403c'} />
            </TouchableOpacity>
            <Text className="text-xs font-bold text-stone-500 w-8 text-center">{safeIndex + 1}/{accounts.length}</Text>
            <TouchableOpacity onPress={() => setCurrentIndex(i => Math.min(accounts.length - 1, i + 1))} disabled={safeIndex === accounts.length - 1} className="p-1">
              <ChevronRight size={18} color={safeIndex === accounts.length - 1 ? '#d4d0ce' : '#44403c'} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Bank Card */}
      {acc && (
        <View style={{ backgroundColor: CARD_BG, borderRadius: 20, padding: 20, marginBottom: 4 }}>
          {/* Top row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' }}>
              {acc.bankName} ({acc.currency === 'KRW' ? 'KR' : 'MY'})
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                {acc.currency === 'KRW'
                  ? <Globe size={11} color="white" />
                  : <Compass size={11} color="white" />}
                <Text style={{ color: 'white', fontSize: 11, fontWeight: 'bold' }}>{acc.currency}</Text>
              </View>
            </View>
          </View>

          {/* Account name */}
          <Text style={{ color: 'white', fontSize: 17, fontWeight: 'bold', lineHeight: 22, marginBottom: 6 }}>
            {acc.name}
          </Text>

          {/* Account number row — read-only, copy + eye only */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Text style={{ color: acc.accountNo ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.3)', fontSize: 12, fontFamily: 'monospace', letterSpacing: 0.5 }}>
              {acc.accountNo
                ? (showAccountNo ? acc.accountNo : `•••• ${acc.accountNo.replace(/-/g, '').slice(-4)}`)
                : '——'}
            </Text>
            {acc.accountNo && (
              <>
                <TouchableOpacity onPress={() => setShowAccountNo(v => !v)}>
                  {showAccountNo
                    ? <EyeOff size={14} color="rgba(255,255,255,0.5)" />
                    : <Eye size={14} color="rgba(255,255,255,0.5)" />}
                </TouchableOpacity>
                <TouchableOpacity onPress={async () => {
                  await Clipboard.setStringAsync(acc.accountNo!);
                  setCopiedId(acc.id);
                  setTimeout(() => setCopiedId(null), 1800);
                }}>
                  {copiedId === acc.id
                    ? <Text style={{ color: '#86efac', fontSize: 10, fontWeight: 'bold' }}>Copied!</Text>
                    : <Copy size={14} color="rgba(255,255,255,0.5)" />}
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Chip row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <CardChip />
            {/* Contactless arcs */}
            <View style={{ opacity: 0.35, alignItems: 'center', justifyContent: 'center' }}>
              {[14, 10, 6].map((r, i) => (
                <View key={i} style={{ width: r, height: r, borderRadius: r / 2, borderWidth: 1.5, borderColor: 'white', position: 'absolute', transform: [{ scaleX: 0.6 }] }} />
              ))}
              <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'white', marginLeft: 8 }} />
            </View>
          </View>

          {/* Balance row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View style={{ flex: 1 }}>
              {editingAccountId === acc.id ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ color: 'white', fontSize: 22, fontWeight: 'bold' }}>{acc.currency === 'KRW' ? '₩' : 'RM'}</Text>
                  <TextInput
                    style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, fontSize: 18, fontWeight: 'bold', minWidth: 90 }}
                    keyboardType="numeric"
                    value={editBalanceVal}
                    onChangeText={setEditBalanceVal}
                    onSubmitEditing={() => handleSaveEdit(acc.id)}
                    autoFocus
                  />
                  <TouchableOpacity onPress={() => handleSaveEdit(acc.id)}>
                    <Check size={18} color="white" />
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 'bold', marginBottom: 2 }}>
                    {acc.currency === 'KRW' ? '₩' : 'RM'}
                  </Text>
                  <Text style={{ color: 'white', fontSize: 28, fontWeight: 'bold', letterSpacing: -0.5 }}>
                    {acc.balance.toLocaleString(undefined, { minimumFractionDigits: acc.currency === 'KRW' ? 0 : 2 })}
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 3 }}>{getReferenceValue(acc)}</Text>
                </>
              )}
            </View>
            <TouchableOpacity onPress={() => { setEditingAccountId(acc.id); setEditBalanceVal(acc.balance.toString()); }}>
              <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, textDecorationLine: 'underline' }}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Add Bank Form */}
      {showAddBankForm && (
        <View className="bg-stone-50 p-4 rounded-2xl border border-stone-200 mt-4 gap-3">
          <Text className="text-xs font-bold text-stone-600 uppercase tracking-wider">Add New Bank Account</Text>
          <View>
            <Text className="text-[10px] font-semibold text-stone-500 uppercase mb-1">Account Display Name</Text>
            <TextInput className="bg-white border border-stone-200 rounded-lg px-2.5 py-2 text-xs" placeholder="e.g. Woori Campus Account" value={newBankName} onChangeText={setNewBankName} />
          </View>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-[10px] font-semibold text-stone-500 uppercase mb-1">Bank Name</Text>
              <TextInput className="bg-white border border-stone-200 rounded-lg px-2.5 py-2 text-xs" placeholder="e.g. Woori Bank (KR)" value={newBankLabel} onChangeText={setNewBankLabel} />
            </View>
            <View className="flex-1">
              <Text className="text-[10px] font-semibold text-stone-500 uppercase mb-1">Currency</Text>
              <View className="border border-stone-200 rounded-lg bg-white overflow-hidden">
                <Picker selectedValue={newBankCurrency} onValueChange={(v) => setNewBankCurrency(v as Currency)} style={{ height: 38 }}>
                  <Picker.Item label="Korean Won (₩)" value="KRW" />
                  <Picker.Item label="Ringgit (RM)" value="MYR" />
                </Picker>
              </View>
            </View>
          </View>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-[10px] font-semibold text-stone-500 uppercase mb-1">Initial Balance</Text>
              <TextInput className="bg-white border border-stone-200 rounded-lg px-2.5 py-2 text-xs font-bold" placeholder="0" keyboardType="numeric" value={newBankBalance} onChangeText={setNewBankBalance} />
            </View>
            <View className="flex-1">
              <Text className="text-[10px] font-semibold text-stone-500 uppercase mb-1">Account No. (Optional)</Text>
              <TextInput className="bg-white border border-stone-200 rounded-lg px-2.5 py-2 text-xs" placeholder="e.g. 102-392-4112" value={newBankNumber} onChangeText={setNewBankNumber} />
            </View>
          </View>
          <View className="flex-row gap-2 pt-1">
            <TouchableOpacity onPress={handleAddBankSubmit} className="flex-1 bg-green-500 py-2.5 rounded-lg items-center">
              <Text className="text-white text-xs font-semibold">Add Account</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowAddBankForm(false)} className="bg-stone-200 px-4 py-2.5 rounded-lg items-center">
              <Text className="text-stone-600 text-xs font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Transfer Modal */}
      <Modal visible={showTransferModal} transparent animationType="fade" onRequestClose={() => setShowTransferModal(false)}>
        <View className="flex-1 bg-black/40 justify-center items-center p-4">
          <View className="bg-white rounded-3xl p-6 w-full shadow-lg border border-stone-200">
            <Text className="font-bold text-stone-800 text-lg mb-1">Transfer & Convert</Text>
            <Text className="text-xs text-stone-400 mb-4">Transfer between your cards with live conversion.</Text>
            <View className="gap-4">
              <View>
                <Text className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">From</Text>
                <View className="border border-stone-200 rounded-xl overflow-hidden bg-stone-50">
                  <Picker selectedValue={transferFromId} onValueChange={(v) => { setTransferFromId(v); const other = accounts.find(a => a.id !== v); setTransferToId(other?.id ?? ''); }} style={{ height: 44 }}>
                    {accounts.map(a => <Picker.Item key={a.id} label={`${a.bankName} (${a.currency})`} value={a.id} />)}
                  </Picker>
                </View>
              </View>
              <View>
                <Text className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">To</Text>
                <View className="border border-stone-200 rounded-xl overflow-hidden bg-stone-50">
                  <Picker selectedValue={transferToId} onValueChange={(v) => setTransferToId(v)} style={{ height: 44 }}>
                    {accounts.filter(a => a.id !== transferFromId).map(a => <Picker.Item key={a.id} label={`${a.bankName} (${a.currency})`} value={a.id} />)}
                  </Picker>
                </View>
              </View>
              <View>
                <Text className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Amount</Text>
                <View className="flex-row items-center bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 gap-1">
                  <Text className="text-sm font-bold text-stone-400">{accounts.find(a => a.id === transferFromId)?.currency === 'KRW' ? '₩' : 'RM'}</Text>
                  <TextInput className="flex-1 text-xs font-bold text-stone-800" keyboardType="numeric" placeholder="0" value={transferAmountRaw} onChangeText={setTransferAmountRaw} />
                </View>
              </View>
              {parseFloat(transferAmountRaw) > 0 && getTransferPreview() && (
                <View className="bg-stone-50 p-3 rounded-xl border border-stone-200 items-center">
                  <Text className="text-[10px] text-stone-400 uppercase font-bold tracking-wider mb-0.5">Calculated Deposit</Text>
                  <Text className="font-bold text-green-500 text-base">{getTransferPreview()}</Text>
                </View>
              )}
              <View className="flex-row gap-2.5 pt-2">
                <TouchableOpacity onPress={() => setShowTransferModal(false)} className="flex-1 bg-stone-100 py-2.5 rounded-xl items-center">
                  <Text className="text-stone-600 text-xs font-semibold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={executeTransfer} className="flex-1 bg-green-500 py-2.5 rounded-xl items-center">
                  <Text className="text-white text-xs font-semibold">Transfer Money</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
