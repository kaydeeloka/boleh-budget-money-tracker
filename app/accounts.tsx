import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Globe, Compass, Trash2, Plus, CreditCard, Check } from 'lucide-react-native';
import { useAppContext } from '../src/context/AppContext';
import { Currency } from '../src/types';
import Dropdown from '../src/components/ui/Dropdown';

const CARD_BG = '#166534';

export default function AccountsScreen() {
  const router = useRouter();
  const { accounts, exchangeRate, handleDeleteAccount, handleAddAccount, handleAdjustBalance, handleUpdateAccountNo } = useAppContext();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBankName, setNewBankName] = useState('');
  const [newCurrency, setNewCurrency] = useState<Currency>('KRW');
  const [newBalance, setNewBalance] = useState('');
  const [newAccountNo, setNewAccountNo] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBalanceVal, setEditBalanceVal] = useState('');
  const [editAccountNoVal, setEditAccountNoVal] = useState('');

  const getReferenceValue = (currency: Currency, balance: number) => {
    if (currency === 'KRW') {
      const val = (balance / 1000) * exchangeRate;
      return `≈ RM ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `≈ ₩${Math.round(balance * (1000 / exchangeRate)).toLocaleString()}`;
  };

  const handleAddSubmit = () => {
    const parsed = parseFloat(newBalance);
    if (!newName.trim() || !newBankName.trim() || isNaN(parsed)) return;
    handleAddAccount({
      name: newName.trim(),
      bankName: newBankName.trim(),
      currency: newCurrency,
      balance: parsed,
      accountNo: newAccountNo.trim() || undefined,
    });
    setNewName(''); setNewBankName(''); setNewBalance(''); setNewAccountNo('');
    setShowAddForm(false);
  };

  const totalMyr = accounts.reduce((sum, a) => {
    return sum + (a.currency === 'MYR' ? a.balance : (a.balance / 1000) * exchangeRate);
  }, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#faf8f5' }} edges={['top']}>
      {/* Header */}
      <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e7e5e4', paddingHorizontal: 16, paddingVertical: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#f5f5f4', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronLeft size={20} color="#44403c" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#1c1917' }}>All Accounts</Text>
            <Text style={{ fontSize: 11, color: '#a8a29e', marginTop: 1 }}>{accounts.length} account{accounts.length !== 1 ? 's' : ''} linked</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowAddForm(v => !v)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#22c55e', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 }}
          >
            <Plus size={14} color="white" />
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 12 }}>Add Bank</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false}>

        {/* Summary card */}
        <View style={{ backgroundColor: CARD_BG, borderRadius: 20, padding: 18, marginBottom: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <CreditCard size={16} color="rgba(255,255,255,0.6)" />
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>Total Net Worth</Text>
          </View>
          <Text style={{ color: 'white', fontSize: 28, fontWeight: '800' }}>
            RM {totalMyr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 }}>
            ≈ ₩{Math.round(totalMyr * (1000 / exchangeRate)).toLocaleString()} combined
          </Text>
        </View>

        {/* Add form */}
        {showAddForm && (
          <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#e7e5e4', gap: 12 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#1c1917' }}>New Account</Text>

            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#a8a29e', textTransform: 'uppercase', letterSpacing: 0.5 }}>Display Name</Text>
              <TextInput
                style={{ backgroundColor: '#fafaf9', borderWidth: 1, borderColor: '#e7e5e4', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13 }}
                placeholder="e.g. Woori Campus Account"
                value={newName}
                onChangeText={setNewName}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#a8a29e', textTransform: 'uppercase', letterSpacing: 0.5 }}>Bank Name</Text>
                <TextInput
                  style={{ backgroundColor: '#fafaf9', borderWidth: 1, borderColor: '#e7e5e4', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13 }}
                  placeholder="e.g. Woori Bank (KR)"
                  value={newBankName}
                  onChangeText={setNewBankName}
                />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#a8a29e', textTransform: 'uppercase', letterSpacing: 0.5 }}>Currency</Text>
                <Dropdown
                  options={[{ label: 'Korean Won (₩)', value: 'KRW' }, { label: 'Ringgit (RM)', value: 'MYR' }]}
                  selectedValue={newCurrency}
                  onValueChange={v => setNewCurrency(v as Currency)}
                  title="Select Currency"
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#a8a29e', textTransform: 'uppercase', letterSpacing: 0.5 }}>Initial Balance</Text>
                <TextInput
                  style={{ backgroundColor: '#fafaf9', borderWidth: 1, borderColor: '#e7e5e4', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, fontWeight: '700' }}
                  placeholder="0"
                  keyboardType="numeric"
                  value={newBalance}
                  onChangeText={setNewBalance}
                />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#a8a29e', textTransform: 'uppercase', letterSpacing: 0.5 }}>Account No. (Optional)</Text>
                <TextInput
                  style={{ backgroundColor: '#fafaf9', borderWidth: 1, borderColor: '#e7e5e4', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13 }}
                  placeholder="e.g. 102-392-4112"
                  value={newAccountNo}
                  onChangeText={setNewAccountNo}
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={handleAddSubmit} style={{ flex: 1, backgroundColor: '#22c55e', borderRadius: 12, paddingVertical: 11, alignItems: 'center' }}>
                <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>Add Account</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowAddForm(false)} style={{ backgroundColor: '#f5f5f4', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 11, alignItems: 'center' }}>
                <Text style={{ color: '#78716c', fontWeight: '600', fontSize: 13 }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Account list */}
        {accounts.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ color: '#a8a29e', fontSize: 14 }}>No accounts yet. Tap Add Bank to get started.</Text>
          </View>
        ) : (
          accounts.map(a => (
            <View key={a.id} style={{ backgroundColor: 'white', borderRadius: 20, borderWidth: 1, borderColor: '#e7e5e4', overflow: 'hidden' }}>
              {/* Card strip */}
              <View style={{ backgroundColor: CARD_BG, padding: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                      {a.currency === 'KRW' ? <Globe size={18} color="white" /> : <Compass size={18} color="white" />}
                    </View>
                    <View>
                      <Text style={{ color: 'white', fontSize: 14, fontWeight: '700' }}>{a.name}</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 1 }}>{a.bankName}</Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: a.currency === 'KRW' ? 'rgba(255,255,255,0.2)' : 'rgba(253,230,138,0.25)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ color: 'white', fontSize: 11, fontWeight: '800' }}>{a.currency}</Text>
                  </View>
                </View>
              </View>

              {/* Balance / edit row */}
              <View style={{ padding: 16 }}>
                {editingId === a.id ? (
                  <View style={{ gap: 10 }}>
                    <View style={{ gap: 4 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#a8a29e', textTransform: 'uppercase', letterSpacing: 0.5 }}>Balance</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#a8a29e' }}>{a.currency === 'KRW' ? '₩' : 'RM'}</Text>
                        <TextInput
                          style={{ flex: 1, backgroundColor: '#f5f5f4', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 15, fontWeight: '700' }}
                          keyboardType="numeric"
                          value={editBalanceVal}
                          onChangeText={setEditBalanceVal}
                          autoFocus
                          placeholder="0"
                        />
                      </View>
                    </View>
                    <View style={{ gap: 4 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#a8a29e', textTransform: 'uppercase', letterSpacing: 0.5 }}>Account No.</Text>
                      <TextInput
                        style={{ backgroundColor: '#f5f5f4', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13 }}
                        value={editAccountNoVal}
                        onChangeText={setEditAccountNoVal}
                        placeholder="e.g. 102-392-4112"
                      />
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
                      <TouchableOpacity
                        onPress={() => {
                          const v = parseFloat(editBalanceVal);
                          if (!isNaN(v)) handleAdjustBalance(a.id, v);
                          handleUpdateAccountNo(a.id, editAccountNoVal);
                          setEditingId(null);
                        }}
                        style={{ flex: 1, backgroundColor: '#22c55e', borderRadius: 10, paddingVertical: 9, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
                      >
                        <Check size={14} color="white" />
                        <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>Save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setEditingId(null)} style={{ backgroundColor: '#f5f5f4', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9, alignItems: 'center' }}>
                        <Text style={{ color: '#78716c', fontWeight: '600', fontSize: 13 }}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View>
                      <Text style={{ fontSize: 22, fontWeight: '800', color: '#1c1917' }}>
                        {a.currency === 'KRW' ? '₩' : 'RM'}{a.balance.toLocaleString(undefined, { minimumFractionDigits: a.currency === 'KRW' ? 0 : 2 })}
                      </Text>
                      <Text style={{ fontSize: 11, color: '#a8a29e', marginTop: 2 }}>{getReferenceValue(a.currency, a.balance)}</Text>
                      {a.accountNo && (
                        <Text style={{ fontSize: 11, color: '#d6d3d1', marginTop: 2, fontFamily: 'monospace' }}>•••• {a.accountNo.replace(/-/g, '').slice(-4)}</Text>
                      )}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <TouchableOpacity
                        onPress={() => { setEditingId(a.id); setEditBalanceVal(a.balance.toString()); setEditAccountNoVal(a.accountNo ?? ''); }}
                        style={{ backgroundColor: '#f5f5f4', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#78716c' }}>Adjust</Text>
                      </TouchableOpacity>
                      {accounts.length > 1 && (
                        <TouchableOpacity
                          onPress={() => Alert.alert('Delete Account', `Remove ${a.name}?`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => handleDeleteAccount(a.id) }])}
                          style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#fff1f2', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Trash2 size={14} color="#ef4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}
              </View>
            </View>
          ))
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
