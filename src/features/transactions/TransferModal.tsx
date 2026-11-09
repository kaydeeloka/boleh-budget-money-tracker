import React, { useEffect, useState } from 'react';
import { Modal, Pressable, View, Text, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { X, ArrowUpDown } from 'lucide-react-native';
import { useAppContext } from '@/src/context/AppContext';
import { BankAccount } from '@/src/types';
import { T, useIsWide, toDateStr, money } from '@/src/theme';
import Dropdown from '@/src/components/ui/Dropdown';

const sym = (a?: BankAccount) => (a?.currency === 'MYR' ? 'RM' : '₩');

/**
 * Transfer between any two accounts (also KRW ↔ MYR).
 * Different currencies: enter what was sent AND what arrived (from your transfer app) — no rate is applied.
 */
export default function TransferModal({ open, onClose, defaultFromId }: { open: boolean; onClose: () => void; defaultFromId?: string }) {
  const { accounts, handleTransfer } = useAppContext();
  const isWide = useIsWide();
  const [date, setDate] = useState('');
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [sent, setSent] = useState('');
  const [received, setReceived] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    const first = accounts.find(a => a.id === defaultFromId) ?? accounts[0];
    setFromId(first?.id ?? '');
    setToId(accounts.find(a => a.id !== first?.id)?.id ?? '');
    setDate(toDateStr(new Date())); setSent(''); setReceived(''); setNote(''); setError('');
  }, [open]);

  const from = accounts.find(a => a.id === fromId);
  const to = accounts.find(a => a.id === toId);
  const cross = !!from && !!to && from.currency !== to.currency;
  const num = (v: string) => Number(v.replace(/[^\d.]/g, ''));

  const save = () => {
    if (!from || !to) return setError('Choose both accounts.');
    if (from.id === to.id) return setError('From and To must be different accounts.');
    const out = num(sent);
    if (!(out > 0)) return setError(`Enter the amount sent (${sym(from)}).`);
    const inn = cross ? num(received) : out;
    if (!(inn > 0)) return setError(`Enter the amount received (${sym(to)}).`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return setError('Date must be YYYY-MM-DD.');
    handleTransfer({ date, fromId: from.id, toId: to.id, amountFrom: out, amountTo: inn, note });
    onClose();
  };

  const label = (t: string) => <Text style={{ fontSize: 10, fontWeight: '800', color: T.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>{t}</Text>;
  const input = { backgroundColor: T.white, borderWidth: 1, borderColor: T.line, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: T.ink } as const;

  // Dropdown of accounts: "Hana Bank · KRW · ₩0"
  const accountPicker = (value: string, onPick: (id: string) => void, exclude?: string, title = 'Account') => (
    <Dropdown
      title={title}
      options={accounts.filter(a => a.id !== exclude).map(a => ({ label: `${a.name} · ${a.currency} · ${money(a.balance, a.currency)}`, value: a.id }))}
      selectedValue={value}
      onValueChange={onPick}
    />
  );

  return (
    <Modal visible={open} transparent animationType={isWide ? 'fade' : 'slide'} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(28,25,23,0.45)', justifyContent: isWide ? 'center' : 'flex-end', alignItems: 'center', padding: isWide ? 24 : 0 }}>
          <Pressable onPress={() => {}} style={{ width: '100%', maxWidth: isWide ? 480 : undefined, maxHeight: '92%', backgroundColor: T.white, borderRadius: isWide ? 16 : 0, borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden' }}>
            <View style={{ backgroundColor: T.brand, paddingHorizontal: 18, paddingVertical: 14, flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ flex: 1, color: T.white, fontSize: 17, fontWeight: '800' }}>Transfer</Text>
              <TouchableOpacity onPress={onClose} accessibilityLabel="Close" style={{ padding: 4 }}>
                <X size={20} color={T.white} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 18, gap: 14 }} keyboardShouldPersistTaps="handled">
              {accounts.length < 2 ? (
                <Text style={{ color: T.muted, fontSize: 14 }}>Add at least two accounts to transfer between them.</Text>
              ) : (
                <>
                  <View>
                    {label('Date')}
                    <TextInput value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={T.faint} style={input} />
                  </View>
                  <View>
                    {label('From')}
                    {accountPicker(fromId, id => { setFromId(id); if (id === toId) setToId(accounts.find(a => a.id !== id)?.id ?? ''); }, undefined, 'Transfer from')}
                  </View>
                  <TouchableOpacity
                    onPress={() => { setFromId(toId); setToId(fromId); setSent(received); setReceived(sent); }}
                    accessibilityLabel="Swap From and To"
                    style={{ alignSelf: 'center', padding: 8, borderRadius: 20, borderWidth: 1, borderColor: T.line }}
                  >
                    <ArrowUpDown size={18} color={T.brand} />
                  </TouchableOpacity>
                  <View>
                    {label('To')}
                    {accountPicker(toId, setToId, fromId, 'Transfer to')}
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      {label(cross ? `Amount sent (${sym(from)})` : `Amount (${sym(from)})`)}
                      <TextInput value={sent} onChangeText={setSent} keyboardType="numeric" placeholder="0" placeholderTextColor={T.faint} style={[input, { fontSize: 18, fontWeight: '800', color: T.out }]} />
                    </View>
                    {cross && (
                      <View style={{ flex: 1 }}>
                        {label(`Amount received (${sym(to)})`)}
                        <TextInput value={received} onChangeText={setReceived} keyboardType="numeric" placeholder="0" placeholderTextColor={T.faint} style={[input, { fontSize: 18, fontWeight: '800', color: T.in }]} />
                      </View>
                    )}
                  </View>
                  {cross && (
                    <Text style={{ fontSize: 11, color: T.muted, marginTop: -6 }}>
                      Enter both amounts from your transfer app (Wise etc.) — fees and rate are already in them. {from?.name} goes down by the first, {to?.name} goes up by the second.
                      {num(sent) > 0 && num(received) > 0 ? `  Effective rate: ${sym(from)}1,000 = ${sym(to)} ${((num(received) / num(sent)) * 1000).toFixed(from?.currency === 'KRW' ? 3 : 0)}` : ''}
                    </Text>
                  )}

                  <View>
                    {label('Notes (optional)')}
                    <TextInput value={note} onChangeText={setNote} placeholder="e.g. Wise top-up, ATM withdrawal" placeholderTextColor={T.faint} style={input} onSubmitEditing={save} />
                  </View>
                  {!!error && <Text style={{ color: T.out, fontSize: 12, fontWeight: '600' }}>{error}</Text>}
                </>
              )}
            </ScrollView>

            {accounts.length >= 2 && (
              <View style={{ padding: 16, paddingBottom: isWide ? 16 : 28, borderTopWidth: 1, borderTopColor: T.line2 }}>
                <TouchableOpacity onPress={save} style={{ backgroundColor: T.brand, borderRadius: 10, paddingVertical: 14, alignItems: 'center' }}>
                  <Text style={{ color: T.white, fontWeight: '800', fontSize: 15 }}>Transfer</Text>
                </TouchableOpacity>
              </View>
            )}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
