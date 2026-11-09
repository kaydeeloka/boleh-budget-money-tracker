import React, { useState } from 'react';
import { Modal, Pressable, View, Text, TouchableOpacity } from 'react-native';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, X } from 'lucide-react-native';
import TransferModal from './TransferModal';
import { useAppContext } from '@/src/context/AppContext';
import { T, useIsWide } from '@/src/theme';
import TxnFormModal from './TxnFormModal';

/**
 * "New entry" flow: first a small chooser (Income / Expense), then the Cash In / Cash Out form.
 * Render it once and control it with `open` / `onClose`.
 */
export default function NewEntryPicker({ open, onClose }: { open: boolean; onClose: () => void }) {
  const isWide = useIsWide();
  const { system, scopeAccountId } = useAppContext();
  const [formType, setFormType] = useState<'income' | 'expense' | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);

  const choose = (t: 'income' | 'expense') => { onClose(); setFormType(t); };

  const option = (t: 'income' | 'expense') => {
    const isIn = t === 'income';
    const color = isIn ? T.in : T.out;
    const Icon = isIn ? ArrowDownLeft : ArrowUpRight;
    return (
      <TouchableOpacity
        onPress={() => choose(t)}
        accessibilityLabel={isIn ? 'Income' : 'Expense'}
        style={{ flex: 1, alignItems: 'center', gap: 8, paddingVertical: 18, borderRadius: 10, borderWidth: 1.5, borderColor: color, backgroundColor: isIn ? T.green50 : T.outSoft }}
      >
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={22} color={T.white} />
        </View>
        <Text style={{ fontSize: 16, fontWeight: '800', color }}>{isIn ? 'Income' : 'Expense'}</Text>
        <Text style={{ fontSize: 11, color: T.muted }}>{isIn ? 'Cash In' : 'Cash Out'}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
        <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(28,25,23,0.45)', justifyContent: isWide ? 'center' : 'flex-end', alignItems: 'center', padding: isWide ? 24 : 0 }}>
          <Pressable
            onPress={() => {}}
            style={{ width: '100%', maxWidth: isWide ? 400 : undefined, backgroundColor: T.white, borderRadius: isWide ? 14 : 0, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 18, paddingBottom: isWide ? 18 : 30, gap: 14 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '800', color: T.ink }}>New entry</Text>
                <Text style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{system === 'KRW' ? '₩ KRW' : 'RM MYR'}</Text>
              </View>
              <TouchableOpacity onPress={onClose} accessibilityLabel="Close" style={{ padding: 4 }}>
                <X size={20} color={T.muted} />
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {option('income')}
              {option('expense')}
            </View>
            <TouchableOpacity
              onPress={() => { onClose(); setTransferOpen(true); }}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: T.brand, backgroundColor: T.brandSoft }}
            >
              <ArrowLeftRight size={18} color={T.brandDark} />
              <Text style={{ fontSize: 15, fontWeight: '800', color: T.brandDark }}>Transfer between accounts</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <TransferModal open={transferOpen} onClose={() => setTransferOpen(false)} defaultFromId={scopeAccountId !== 'all' ? scopeAccountId : undefined} />
      <TxnFormModal
        visible={formType !== null}
        type={formType ?? 'expense'}
        defaultAccountId={scopeAccountId !== 'all' ? scopeAccountId : undefined}
        onClose={() => setFormType(null)}
      />
    </>
  );
}
