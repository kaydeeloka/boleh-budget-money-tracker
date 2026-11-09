import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import Dropdown from '@/src/components/ui/Dropdown';
import { useAppContext } from '@/src/context/AppContext';
import { Currency } from '@/src/types';
import { T, money } from '@/src/theme';

/** Currency system switch (₩ KRW / RM MYR) + account list. Drives every page. */
export function ScopePanel({ onPicked, dark }: { onPicked?: () => void; dark?: boolean }) {
  const { system, setSystem, systemAccounts, scopeAccountId, setScopeAccountId } = useAppContext();
  const totalBalance = systemAccounts.reduce((total, account) => total + account.balance, 0);
  const options: { id: string; name: string; sub: string }[] = [
    {
      id: 'all',
      name: 'All Accounts',
      sub: `${systemAccounts.length} ${system} account${systemAccounts.length !== 1 ? 's' : ''} · ${money(totalBalance, system)}`,
    },
    ...systemAccounts.map(a => ({ id: a.id, name: a.name, sub: `${a.bankName} · ${money(a.balance, a.currency)}` })),
  ];
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {(['KRW', 'MYR'] as Currency[]).map(c => {
          const active = c === system;
          return (
            <TouchableOpacity
              key={c}
              onPress={() => setSystem(c)}
              accessibilityLabel={`${c} system`}
              style={{ flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center', borderWidth: 1.5, borderColor: active ? T.brand : T.line, backgroundColor: active ? T.brand : T.white }}
            >
              <Text style={{ fontSize: 13, fontWeight: '800', color: active ? T.white : T.ink2 }}>{c === 'KRW' ? '₩ KRW' : 'RM MYR'}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {systemAccounts.length === 0 ? (
        <Text style={{ fontSize: 11, color: T.faint, paddingVertical: 4 }}>No {system} accounts yet — add one in Accounts.</Text>
      ) : (
        <Dropdown
          compact
          title={`${system} account`}
          options={options.map(o => ({
            label: o.id === 'all'
              ? `All Accounts (${systemAccounts.length}) · ${money(totalBalance, system)}`
              : `${o.name} · ${o.sub.split(' · ').pop()}`,
            value: o.id,
          }))}
          selectedValue={scopeAccountId}
          onValueChange={id => { setScopeAccountId(id); onPicked?.(); }}
        />
      )}
    </View>
  );
}

/** Compact header button for phones (no sidebar there): "₩ All Accounts ▾" → sheet with ScopePanel. */
export function ScopeButton() {
  const { system, scopeName } = useAppContext();
  const [open, setOpen] = useState(false);
  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)} accessibilityLabel="Choose currency and account" style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderColor: T.white, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, maxWidth: 170 }}>
        <Text style={{ color: T.white, fontWeight: '800', fontSize: 12 }}>{system === 'KRW' ? '₩' : 'RM'}</Text>
        <Text style={{ color: T.white, fontWeight: '600', fontSize: 12, flexShrink: 1 }} numberOfLines={1}>{scopeName}</Text>
        <ChevronDown size={14} color={T.white} />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable onPress={() => setOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(28,25,23,0.45)', justifyContent: 'flex-end' }}>
          <Pressable onPress={() => {}} style={{ backgroundColor: T.white, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, paddingBottom: 30, gap: 10 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: T.ink }}>Show money for</Text>
            <ScopePanel onPicked={() => setOpen(false)} />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
