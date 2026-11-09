import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { ArrowRightLeft, Check, Copy, Eye, EyeOff, Settings2 } from 'lucide-react-native';
import { BankAccount } from '@/src/types';
import { T, money, useIsWide } from '@/src/theme';
import { Section, Row, Amount, Btn, Field, Label } from '@/src/components/ui/Ledger';

interface BankAccountsProps {
  accounts: BankAccount[];
  exchangeRate: number;
  onAdjustBalance: (accountId: string, newBalance: number) => void;
  onRecordTransfer: (fromAccountId: string, toAccountId: string, amountFrom: number, amountTo: number) => void;
  onAddAccount?: (acc: Omit<BankAccount, 'id'>) => void;
}

const masked = (no: string) => `•••• ${no.replace(/-/g, '').slice(-4)}`;

export default function BankAccounts({ accounts, exchangeRate, onAdjustBalance, onRecordTransfer }: BankAccountsProps) {
  const router = useRouter();
  const isWide = useIsWide();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');
  const [revealed, setRevealed] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [showTransfer, setShowTransfer] = useState(false);
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [amountRaw, setAmountRaw] = useState('');

  const convert = (amt: number, from: BankAccount, to: BankAccount) => {
    if (from.currency === 'MYR' && to.currency === 'KRW') return amt * (1000 / exchangeRate);
    if (from.currency === 'KRW' && to.currency === 'MYR') return (amt / 1000) * exchangeRate;
    return amt;
  };
  const ref = (a: BankAccount) => a.currency === 'KRW'
    ? `≈ ${money((a.balance / 1000) * exchangeRate, 'MYR')}`
    : `≈ ${money(a.balance * (1000 / exchangeRate), 'KRW')}`;

  const openTransfer = () => {
    setFromId(accounts[0].id);
    setToId(accounts.find(a => a.id !== accounts[0].id)?.id ?? '');
    setAmountRaw('');
    setShowTransfer(true);
  };
  const from = accounts.find(a => a.id === fromId);
  const to = accounts.find(a => a.id === toId);
  const amt = parseFloat(amountRaw);
  const preview = from && to && amt > 0 ? money(convert(amt, from, to), to.currency) : null;
  const doTransfer = () => {
    if (!from || !to || !(amt > 0)) return;
    onRecordTransfer(from.id, to.id, amt, Math.round(convert(amt, from, to) * 100) / 100);
    setShowTransfer(false);
  };

  const saveEdit = (id: string) => {
    const v = parseFloat(editVal);
    if (!isNaN(v)) onAdjustBalance(id, v);
    setEditingId(null);
  };

  const chip = (a: BankAccount, active: boolean, onPress: () => void) => (
    <TouchableOpacity key={a.id} onPress={onPress} style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 6, borderWidth: 1.5, borderColor: active ? T.brand : T.line, backgroundColor: active ? T.green50 : T.white }}>
      <Text style={{ fontSize: 12, fontWeight: '700', color: active ? T.brand : T.ink2 }}>{a.bankName} ({a.currency})</Text>
    </TouchableOpacity>
  );

  return (
    <Section
      title="My Bank Accounts"
      subtitle={`${accounts.length} account${accounts.length !== 1 ? 's' : ''}`}
      right={
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {accounts.length >= 2 && <Btn small label="Transfer" icon={<ArrowRightLeft size={13} color={T.white} />} onPress={openTransfer} />}
          <Btn small kind="ghost" label="Manage" icon={<Settings2 size={13} color={T.ink2} />} onPress={() => router.push('/accounts')} />
        </View>
      }
    >
      {accounts.map((a, i) => (
        <View key={a.id}>
          <Row
            index={i}
            caption={`${a.bankName}${a.accountNo ? ` · ${revealed === a.id ? a.accountNo : masked(a.accountNo)}` : ''}`}
            title={a.name}
            detail={ref(a)}
            onPress={() => { setEditingId(editingId === a.id ? null : a.id); setEditVal(String(a.balance)); }}
            right={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {a.accountNo && (
                  <>
                    <TouchableOpacity onPress={() => setRevealed(revealed === a.id ? null : a.id)} accessibilityLabel="Show account number">
                      {revealed === a.id ? <EyeOff size={15} color={T.faint} /> : <Eye size={15} color={T.faint} />}
                    </TouchableOpacity>
                    <TouchableOpacity
                      accessibilityLabel="Copy account number"
                      onPress={async () => { await Clipboard.setStringAsync(a.accountNo!); setCopiedId(a.id); setTimeout(() => setCopiedId(null), 1500); }}
                    >
                      {copiedId === a.id ? <Check size={15} color={T.in} /> : <Copy size={15} color={T.faint} />}
                    </TouchableOpacity>
                  </>
                )}
                <Amount value={money(a.balance, a.currency)} color={a.balance < 0 ? T.out : T.in} width={isWide ? 130 : 120} />
              </View>
            }
          />
          {editingId === a.id && (
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 12, backgroundColor: T.green50, borderBottomWidth: 1, borderBottomColor: T.line }}>
              <Field label={`Adjust balance (${a.currency === 'KRW' ? '₩' : 'RM'})`} value={editVal} onChangeText={setEditVal} keyboardType="numeric" autoFocus onSubmitEditing={() => saveEdit(a.id)} />
              <Btn label="Save" kind="in" onPress={() => saveEdit(a.id)} />
              <Btn label="Cancel" kind="ghost" onPress={() => setEditingId(null)} />
            </View>
          )}
        </View>
      ))}
      {accounts.length === 0 && (
        <View style={{ padding: 16 }}><Btn label="Add a bank account" onPress={() => router.push('/accounts')} /></View>
      )}

      <Modal visible={showTransfer} transparent animationType="fade" onRequestClose={() => setShowTransfer(false)}>
        <Pressable onPress={() => setShowTransfer(false)} style={{ flex: 1, backgroundColor: 'rgba(28,25,23,0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Pressable onPress={() => {}} style={{ width: '100%', maxWidth: 440, backgroundColor: T.white, borderRadius: 14, overflow: 'hidden' }}>
            <View style={{ backgroundColor: T.brand, paddingHorizontal: 18, paddingVertical: 14 }}>
              <Text style={{ color: T.white, fontSize: 17, fontWeight: '800' }}>Transfer & Convert</Text>
            </View>
            <View style={{ padding: 18, gap: 14 }}>
              <View>
                <Label>From</Label>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {accounts.map(a => chip(a, a.id === fromId, () => { setFromId(a.id); if (toId === a.id) setToId(accounts.find(x => x.id !== a.id)?.id ?? ''); }))}
                </View>
              </View>
              <View>
                <Label>To</Label>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {accounts.filter(a => a.id !== fromId).map(a => chip(a, a.id === toId, () => setToId(a.id)))}
                </View>
              </View>
              <Field label={`Amount (${from?.currency === 'MYR' ? 'RM' : '₩'})`} value={amountRaw} onChangeText={setAmountRaw} keyboardType="numeric" placeholder="0" />
              {preview && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: T.line2 }}>
                  <Text style={{ color: T.ink2 }}>Arrives as</Text>
                  <Text style={{ color: T.in, fontWeight: '800' }}>{preview}</Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Btn flex kind="ghost" label="Cancel" onPress={() => setShowTransfer(false)} />
                <Btn flex label="Transfer" onPress={doTransfer} disabled={!preview} />
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Section>
  );
}
