import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable } from 'react-native';
import { Trash2, X } from 'lucide-react-native';
import { useAppContext } from '@/src/context/AppContext';
import { Expense } from '@/src/types';
import { T, useIsWide, money, fmtDate } from '@/src/theme';
import { categoryLabel } from '@/src/categories';

/** Tap-a-row details with a two-step delete (Alert.alert does nothing on web). */
export default function TxnDetailModal({ txn, onClose }: { txn: Expense | null; onClose: () => void }) {
  const { accounts, handleDeleteExpense } = useAppContext();
  const isWide = useIsWide();
  const [confirming, setConfirming] = useState(false);
  useEffect(() => setConfirming(false), [txn?.id]);
  if (!txn) return null;

  const isIn = txn.type === 'income';
  const acc = accounts.find(a => a.id === txn.accountId);
  const rows: [string, string][] = [
    ['Date', fmtDate(txn.date)],
    ['Category', categoryLabel(txn)],
    ['Account', acc ? `${acc.name}` : '—'],
    ...(txn.importRef ? [['Source', 'Imported from bank file'] as [string, string]] : []),
  ];

  return (
    <Modal visible transparent animationType={isWide ? 'fade' : 'slide'} onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(28,25,23,0.45)', justifyContent: isWide ? 'center' : 'flex-end', alignItems: 'center', padding: isWide ? 24 : 0 }}>
        <Pressable onPress={() => {}} style={{ width: '100%', maxWidth: isWide ? 420 : undefined, backgroundColor: T.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderRadius: isWide ? 20 : 0, padding: 18, paddingBottom: isWide ? 18 : 30, gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: isIn ? T.in : T.out }}>{isIn ? 'Cash In' : 'Cash Out'}</Text>
              <Text style={{ fontSize: 26, fontWeight: '800', color: isIn ? T.in : T.out, marginTop: 2 }}>{money(txn.amount, txn.currency)}</Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: T.ink, marginTop: 4 }}>{txn.note}</Text>
            </View>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close" style={{ padding: 4 }}>
              <X size={20} color={T.muted} />
            </TouchableOpacity>
          </View>

          <View style={{ borderTopWidth: 1, borderTopColor: T.line2 }}>
            {rows.map(([k, v]) => (
              <View key={k} style={{ flexDirection: 'row', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: T.line2 }}>
                <Text style={{ width: 90, fontSize: 13, color: T.muted }}>{k}</Text>
                <Text style={{ flex: 1, fontSize: 13, color: T.ink, fontWeight: '600' }}>{v}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => {
              if (!confirming) return setConfirming(true);
              handleDeleteExpense(txn.id);
              onClose();
            }}
            style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, backgroundColor: confirming ? T.out : T.outSoft }}
          >
            <Trash2 size={16} color={confirming ? T.white : T.out} />
            <Text style={{ fontWeight: '700', color: confirming ? T.white : T.out }}>{confirming ? 'Tap again to delete' : 'Delete'}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
