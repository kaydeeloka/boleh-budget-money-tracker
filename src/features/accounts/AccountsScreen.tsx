import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Trash2, Plus, CreditCard, Check, ArrowLeftRight } from 'lucide-react-native';
import { useAppContext } from '@/src/context/AppContext';
import { Currency } from '@/src/types';
import { ScopeButton } from '@/src/features/navigation/ScopePicker';
import BankCard, { CARD_COLORS, cardColorFor } from '@/src/features/accounts/BankCard';
import { useIsWide, T, money, fmtDate } from '@/src/theme';
import TransferModal from '@/src/features/transactions/TransferModal';


export default function AccountsScreen() {
  const router = useRouter();
  const isWide = useIsWide();
  const { system, systemAccounts: accounts, exchangeRate, handleDeleteAccount, handleAddAccount, handleAdjustBalance, handleUpdateAccountNo, handleUpdateAccount, handleRemoveImported, expenses } = useAppContext();
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [confirmTransferId, setConfirmTransferId] = useState<string | null>(null);
  const { accounts: allAccounts, handleDeleteExpense } = useAppContext();
  const nameOf = (id: string) => allAccounts.find(x => x.id === id)?.name ?? 'Deleted account';
  const systemIds = new Set(accounts.map(a => a.id));
  const transfers = Object.values(
    expenses.filter(e => e.transferId).reduce<Record<string, typeof expenses>>((m, e) => { (m[e.transferId!] ??= []).push(e); return m; }, {}),
  )
    .filter(legs => legs.some(l => systemIds.has(l.accountId)))
    .map(legs => {
      const out = legs.find(l => l.type !== 'income')!, inn = legs.find(l => l.type === 'income')!;
      return {
        id: out?.transferId ?? inn.transferId!, legId: (out ?? inn).id, date: (out ?? inn).date, note: (out ?? inn).note,
        fromName: out ? nameOf(out.accountId) : '?', toName: inn ? nameOf(inn.accountId) : '?',
        out: out ? money(out.amount, out.currency) : '—', in: inn ? money(inn.amount, inn.currency) : '—',
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const [removedMsg, setRemovedMsg] = useState('');
  const sym = system === 'KRW' ? '₩' : 'RM';

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBankName, setNewBankName] = useState('');
  const [newBalance, setNewBalance] = useState('');
  const [newAccountNo, setNewAccountNo] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBalanceVal, setEditBalanceVal] = useState('');
  const [editAccountNoVal, setEditAccountNoVal] = useState('');
  const [editNameVal, setEditNameVal] = useState('');
  const [editBankVal, setEditBankVal] = useState('');
  const [editColorVal, setEditColorVal] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const getReferenceValue = (currency: Currency, balance: number) => {
    if (currency === 'KRW') {
      const val = (balance / 1000) * exchangeRate;
      return `≈ RM ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `≈ ₩${Math.round(balance * (1000 / exchangeRate)).toLocaleString()}`;
  };

  const [addError, setAddError] = useState('');

  const handleAddSubmit = () => {
    // Empty balance = 0 (the "0" shown is only a placeholder); allow "1,200.50"
    const raw = newBalance.replace(/,/g, '').trim();
    const parsed = raw === '' ? 0 : parseFloat(raw);
    if (!newName.trim()) return setAddError('Enter a display name.');
    if (!newBankName.trim()) return setAddError('Enter the bank name.');
    if (isNaN(parsed)) return setAddError('Initial balance must be a number.');
    setAddError('');
    handleAddAccount({
      name: newName.trim(),
      bankName: newBankName.trim(),
      currency: system, // follows the KRW / MYR system chosen in the sidebar
      balance: parsed,
      accountNo: newAccountNo.trim() || undefined,
    });
    setNewName(''); setNewBankName(''); setNewBalance(''); setNewAccountNo('');
    setShowAddForm(false);
  };

  const total = accounts.reduce((s, a) => s + a.balance, 0);
  const fmtTotal = system === 'KRW'
    ? `₩${Math.round(total).toLocaleString()}`
    : `RM ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const inputStyle = { backgroundColor: '#fafaf9', borderWidth: 1, borderColor: '#e7e5e4', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13 } as const;
  const labelStyle = { fontSize: 10, fontWeight: '700', color: '#a8a29e', textTransform: 'uppercase', letterSpacing: 0.5 } as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#faf8f5' }} edges={['top']}>
      {/* Header */}
      <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e7e5e4', paddingHorizontal: 16, paddingVertical: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {!isWide && (
            <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.navigate('/'))} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#f5f5f4', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={20} color="#44403c" />
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#1c1917' }}>All Accounts</Text>
            <Text style={{ fontSize: 11, color: '#a8a29e', marginTop: 1 }}>{accounts.length} {system} account{accounts.length !== 1 ? 's' : ''} linked</Text>
          </View>
          <TouchableOpacity
            onPress={() => setTransferOpen(true)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: T.brand, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12 }}
          >
            <ArrowLeftRight size={14} color={T.brand} />
            <Text style={{ color: T.brand, fontWeight: '700', fontSize: 12 }}>Transfer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowAddForm(v => !v)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: T.brand, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 }}
          >
            <Plus size={14} color="white" />
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 12 }}>Add Bank</Text>
          </TouchableOpacity>
        </View>
        {!isWide && (
          <View style={{ marginTop: 10, alignSelf: 'flex-start', backgroundColor: T.brandDark, borderRadius: 999 }}>
            <ScopeButton />
          </View>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false}>

        {!!removedMsg && (
          <TouchableOpacity onPress={() => setRemovedMsg('')} style={{ backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 14, padding: 12 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#166534' }}>{removedMsg}</Text>
          </TouchableOpacity>
        )}
        {/* Summary card */}
        <View style={{ backgroundColor: T.brandDark, borderRadius: 20, padding: 18, marginBottom: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <CreditCard size={16} color="rgba(255,255,255,0.6)" />
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>Total {system} Balance</Text>
          </View>
          <Text style={{ color: 'white', fontSize: 28, fontWeight: '800' }}>{fmtTotal}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 }}>{getReferenceValue(system, total)}</Text>
        </View>

        {/* Add form */}
        {showAddForm && (
          <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#e7e5e4', gap: 12 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#1c1917' }}>New {system} Account</Text>
            <View style={{ gap: 4 }}>
              <Text style={labelStyle}>Display Name</Text>
              <TextInput style={inputStyle} placeholder={system === 'KRW' ? 'e.g. Woori Campus Account' : 'e.g. Maybank Savings'} value={newName} onChangeText={setNewName} />
            </View>
            <View style={{ gap: 4 }}>
              <Text style={labelStyle}>Bank Name</Text>
              <TextInput style={inputStyle} placeholder={system === 'KRW' ? 'e.g. Woori Bank (KR)' : 'e.g. Maybank (MY)'} value={newBankName} onChangeText={setNewBankName} />
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={labelStyle}>Initial Balance ({sym})</Text>
                <TextInput style={[inputStyle, { fontWeight: '700' }]} placeholder="0" keyboardType="numeric" value={newBalance} onChangeText={setNewBalance} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={labelStyle}>Account No. (Optional)</Text>
                <TextInput style={inputStyle} placeholder="e.g. 102-392-4112" value={newAccountNo} onChangeText={setNewAccountNo} />
              </View>
            </View>
            {!!addError && <Text style={{ color: '#dc2626', fontSize: 12, fontWeight: '600' }}>{addError}</Text>}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={handleAddSubmit} style={{ flex: 1, backgroundColor: T.brand, borderRadius: 12, paddingVertical: 11, alignItems: 'center' }}>
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
            <Text style={{ color: '#a8a29e', fontSize: 14 }}>No {system} accounts yet. Tap Add Bank to get started.</Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
          {accounts.map(a => (
            <View key={a.id} style={{ width: isWide ? 400 : '100%', gap: 10 }}>
              <BankCard
                account={a}
                reference={getReferenceValue(a.currency, a.balance)}
                footer={
                  <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
                    <TouchableOpacity
                      onPress={() => { setEditingId(editingId === a.id ? null : a.id); setEditBalanceVal(a.balance.toString()); setEditAccountNoVal(a.accountNo ?? ''); setEditNameVal(a.name); setEditBankVal(a.bankName); setEditColorVal(cardColorFor(a)); }}
                      style={{ backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '700', color: 'white' }}>{editingId === a.id ? 'Close' : 'Adjust'}</Text>
                    </TouchableOpacity>
                    {accounts.length > 1 && (
                      // Two-step delete (Alert.alert does nothing on web)
                      <TouchableOpacity
                        onPress={() => {
                          if (confirmDeleteId !== a.id) return setConfirmDeleteId(a.id);
                          handleDeleteAccount(a.id); setConfirmDeleteId(null);
                        }}
                        style={{ height: 32, minWidth: 32, paddingHorizontal: confirmDeleteId === a.id ? 10 : 0, borderRadius: 10, backgroundColor: confirmDeleteId === a.id ? '#ef4444' : 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4 }}
                      >
                        <Trash2 size={14} color="white" />
                        {confirmDeleteId === a.id && <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>Confirm</Text>}
                      </TouchableOpacity>
                    )}
                  </View>
                }
              />
              {editingId === a.id && (
                <View style={{ backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#e7e5e4', padding: 16 }}>
                  <View style={{ gap: 10 }}>
                    <View style={{ gap: 4 }}>
                      <Text style={labelStyle}>Account Name</Text>
                      <TextInput style={{ backgroundColor: '#f5f5f4', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, fontWeight: '600' }} value={editNameVal} onChangeText={setEditNameVal} placeholder="e.g. Hana Campus Account" />
                    </View>
                    <View style={{ gap: 6 }}>
                      <Text style={labelStyle}>Card Colour</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {CARD_COLORS.map(hex => (
                          <TouchableOpacity key={hex} onPress={() => setEditColorVal(hex)} accessibilityLabel={`Card colour ${hex}`} style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: hex, borderWidth: editColorVal === hex ? 3 : 0, borderColor: '#facc15' }} />
                        ))}
                      </View>
                    </View>
                    <View style={{ gap: 4 }}>
                      <Text style={labelStyle}>Bank Name</Text>
                      <TextInput style={{ backgroundColor: '#f5f5f4', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13 }} value={editBankVal} onChangeText={setEditBankVal} placeholder="e.g. Hana Bank (KR)" />
                    </View>
                    <View style={{ gap: 4 }}>
                      <Text style={labelStyle}>Balance</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#a8a29e' }}>{a.currency === 'KRW' ? '₩' : 'RM'}</Text>
                        <TextInput
                          style={{ flex: 1, backgroundColor: '#f5f5f4', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 15, fontWeight: '700' }}
                          keyboardType="numeric"
                          value={editBalanceVal}
                          onChangeText={setEditBalanceVal}
                          placeholder="0"
                        />
                      </View>
                    </View>
                    <View style={{ gap: 4 }}>
                      <Text style={labelStyle}>Account No.</Text>
                      <TextInput style={{ backgroundColor: '#f5f5f4', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13 }} value={editAccountNoVal} onChangeText={setEditAccountNoVal} placeholder="e.g. 102-392-4112" />
                    </View>
                    {(() => {
                      const n = expenses.filter(e => e.accountId === a.id && e.importRef).length;
                      if (!n) return null;
                      const confirming = confirmRemoveId === a.id;
                      return (
                        <TouchableOpacity
                          onPress={() => {
                            if (!confirming) return setConfirmRemoveId(a.id);
                            const removed = handleRemoveImported(a.id);
                            setConfirmRemoveId(null);
                            setRemovedMsg(`Removed ${removed} imported entr${removed === 1 ? 'y' : 'ies'} from ${a.name}.`);
                          }}
                          style={{ borderRadius: 10, paddingVertical: 9, alignItems: 'center', backgroundColor: confirming ? '#ef4444' : '#fff1f2' }}
                        >
                          <Text style={{ color: confirming ? 'white' : '#ef4444', fontWeight: '700', fontSize: 13 }}>
                            {confirming ? `Tap again to remove ${n} imported entries` : `Remove imported entries (${n})`}
                          </Text>
                        </TouchableOpacity>
                      );
                    })()}
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
                      <TouchableOpacity
                        onPress={() => {
                          const v = parseFloat(editBalanceVal);
                          if (!isNaN(v)) handleAdjustBalance(a.id, v);
                          handleUpdateAccountNo(a.id, editAccountNoVal);
                          handleUpdateAccount(a.id, { name: editNameVal, bankName: editBankVal, cardColor: editColorVal });
                          setEditingId(null);
                        }}
                        style={{ flex: 1, backgroundColor: T.brand, borderRadius: 10, paddingVertical: 9, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
                      >
                        <Check size={14} color="white" />
                        <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>Save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setEditingId(null)} style={{ backgroundColor: '#f5f5f4', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9, alignItems: 'center' }}>
                        <Text style={{ color: '#78716c', fontWeight: '600', fontSize: 13 }}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </View>
          ))}
          </View>
        )}

        {/* Transfer history: transfers touching this system's accounts (both legs, either currency) */}
        {transfers.length > 0 && (
          <View style={{ backgroundColor: 'white', borderRadius: 20, borderWidth: 1, borderColor: '#e7e5e4', overflow: 'hidden' }}>
            <View style={{ paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fafafa', borderBottomWidth: 1, borderBottomColor: '#e7e5e4' }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#1c1917' }}>Transfer History</Text>
              <Text style={{ fontSize: 11, color: '#a8a29e', marginTop: 1 }}>{transfers.length} transfer{transfers.length !== 1 ? 's' : ''} · deleting one restores both balances</Text>
            </View>
            {transfers.map((t, i) => {
              const confirming = confirmTransferId === t.id;
              return (
                <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: i % 2 ? '#fcfcfb' : 'white', borderBottomWidth: 1, borderBottomColor: '#f5f5f4' }}>
                  <ArrowLeftRight size={16} color="#64748b" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: '#78716c' }}>{fmtDate(t.date)}{t.note ? ` · ${t.note}` : ''}</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#1c1917', marginTop: 2 }} numberOfLines={1}>{t.fromName} → {t.toName}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: T.out }}>−{t.out}</Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: T.in }}>+{t.in}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => { if (!confirming) return setConfirmTransferId(t.id); handleDeleteExpense(t.legId); setConfirmTransferId(null); }}
                    accessibilityLabel="Delete transfer"
                    style={{ height: 30, minWidth: 30, paddingHorizontal: confirming ? 8 : 0, borderRadius: 8, backgroundColor: confirming ? '#ef4444' : '#fff1f2', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4 }}
                  >
                    <Trash2 size={13} color={confirming ? 'white' : '#ef4444'} />
                    {confirming && <Text style={{ color: 'white', fontSize: 11, fontWeight: '700' }}>Confirm</Text>}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
      <TransferModal open={transferOpen} onClose={() => setTransferOpen(false)} />
    </SafeAreaView>
  );
}
