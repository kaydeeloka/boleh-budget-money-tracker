import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { X } from 'lucide-react-native';
import { useAppContext } from '@/src/context/AppContext';
import { T, useIsWide, toDateStr } from '@/src/theme';
import { categoryStyle } from '@/src/categories';


interface Props {
  visible: boolean;
  type: 'income' | 'expense';
  defaultDate?: string;      // YYYY-MM-DD
  defaultAccountId?: string;
  defaultRepeat?: 'once' | 'weekly' | 'monthly' | 'yearly';
  defaultCategory?: string;
  onClose: () => void;
}

/** "Cash In" / "Cash Out" entry sheet — bottom sheet on phones, centred dialog on wide screens. */
export default function TxnFormModal({ visible, type: initialType, defaultDate, defaultAccountId, defaultRepeat = 'once', defaultCategory, onClose }: Props) {
  const { systemAccounts, system, categories, handleAddExpense, handleAddSchedule } = useAppContext();
  const isWide = useIsWide();
  // Cash In / Cash Out can be switched inside the popup; starts from the button that opened it
  const [type, setType] = useState<'income' | 'expense'>(initialType);
  const firstCat = (t: 'income' | 'expense') => categories.find(c => (c.type ?? 'expense') === t)?.name ?? '';
  const switchType = (t: 'income' | 'expense') => { setType(t); setCategory(firstCat(t)); setSubcategory(''); };
  const krwAccounts = systemAccounts; // accounts in the current KRW / MYR system
  // Categories of this kind (income / expense); each may have subcategories
  const catList = categories.filter(c => (c.type ?? 'expense') === type);
  const catOptions = catList.map(c => c.name);

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [date, setDate] = useState('');
  const [accountId, setAccountId] = useState('');
  const [error, setError] = useState('');
  const [repeat, setRepeat] = useState<'once' | 'weekly' | 'monthly' | 'yearly'>('once');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (!visible) return;
    setAmount(''); setNote(''); setError('');
    setType(initialType);
    setCategory(firstCat(initialType));
    setSubcategory('');
    setRepeat(defaultRepeat); setEndDate('');
    if (defaultCategory && categories.some(c => c.name === defaultCategory && (c.type ?? 'expense') === initialType)) setCategory(defaultCategory);
    setDate(defaultDate ?? toDateStr(new Date()));
    setAccountId(defaultAccountId && krwAccounts.some(a => a.id === defaultAccountId) ? defaultAccountId : krwAccounts[0]?.id ?? '');
  }, [visible, initialType]);

  const color = type === 'income' ? T.in : T.out;
  const subOptions = catList.find(c => c.name === category)?.subcategories ?? [];

  const save = () => {
    const amt = Number(amount.replace(/[^\d.]/g, ''));
    if (!amt || amt <= 0) return setError('Enter an amount.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return setError('Date must be YYYY-MM-DD.');
    if (!accountId) return setError('Add a bank account first.');
    const entry = {
      amount: amt, currency: system, category, subcategory: subcategory || undefined, accountId, type,
      note: note.trim() || subcategory || category || (type === 'income' ? 'Cash In' : 'Cash Out'),
    };
    if (repeat === 'once') {
      handleAddExpense({ ...entry, date });
    } else {
      // Repeating: saved as a schedule; every due date (including today/past) is added to the Cash Book automatically
      if (endDate && (!/^\d{4}-\d{2}-\d{2}$/.test(endDate) || endDate < date)) return setError('End date must be YYYY-MM-DD and after the start date.');
      handleAddSchedule({ ...entry, frequency: repeat, startDate: date, endDate: endDate || undefined });
    }
    onClose();
  };

  const label = (t: string) => (
    <Text style={{ fontSize: 10, fontWeight: '800', color: T.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>{t}</Text>
  );
  const input = { backgroundColor: T.bg, borderWidth: 1, borderColor: T.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: T.ink } as const;
  const chip = (active: boolean) => ({
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1,
    borderColor: active ? color : T.line, backgroundColor: active ? (type === 'income' ? T.green50 : T.outSoft) : T.white,
  });

  return (
    <Modal visible={visible} transparent animationType={isWide ? 'fade' : 'slide'} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(28,25,23,0.45)', justifyContent: isWide ? 'center' : 'flex-end', alignItems: 'center', padding: isWide ? 24 : 0 }}>
          <Pressable
            onPress={() => {}}
            style={{
              width: '100%', maxWidth: isWide ? 460 : undefined, maxHeight: '90%', backgroundColor: T.white,
              borderRadius: isWide ? 20 : 0, borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden',
            }}
          >
            {/* Tabs: Cash In | Cash Out (active tab filled in its colour) */}
            <View style={{ flexDirection: 'row', alignItems: 'stretch', backgroundColor: T.line2, borderBottomWidth: 3, borderBottomColor: color }}>
              {(['income', 'expense'] as const).map(t => {
                const active = t === type;
                const tabColor = t === 'income' ? T.in : T.out;
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => switchType(t)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={t === 'income' ? 'Cash In' : 'Cash Out'}
                    style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 15, backgroundColor: active ? tabColor : 'transparent' }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '800', color: active ? T.white : T.muted }}>{t === 'income' ? 'Cash In' : 'Cash Out'}</Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity onPress={onClose} accessibilityLabel="Close" style={{ paddingHorizontal: 16, justifyContent: 'center', backgroundColor: T.line2 }}>
                <X size={20} color={T.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 18, gap: 14 }} keyboardShouldPersistTaps="handled">
              <View>
                {label(`Amount (${system === 'KRW' ? '₩' : 'RM'})`)}
                <TextInput
                  autoFocus
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={T.faint}
                  style={[input, { fontSize: 24, fontWeight: '800', color }]}
                  onSubmitEditing={save}
                />
              </View>

              <View>
                {label('Remark')}
                <TextInput value={note} onChangeText={setNote} placeholder={type === 'income' ? 'e.g. Monthly allowance' : 'e.g. Taxi, Breakfast'} placeholderTextColor={T.faint} style={input} onSubmitEditing={save} />
              </View>

              <View>
                {label('Category')}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {catOptions.map(c => {
                    const { Icon, color: iconColor } = categoryStyle(categories, c);
                    const active = category === c;
                    return (
                      <TouchableOpacity key={c} onPress={() => { setCategory(c); setSubcategory(''); }} style={[chip(active), { flexDirection: 'row', alignItems: 'center', gap: 5 }]}>
                        <Icon size={13} color={active ? color : iconColor} />
                        <Text style={{ fontSize: 12, fontWeight: '600', color: active ? color : T.ink2 }}>{c}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {subOptions.length > 0 && (
                <View>
                  {label(`${category} · Subcategory (optional)`)}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {subOptions.map(sc => (
                      <TouchableOpacity key={sc} onPress={() => setSubcategory(subcategory === sc ? '' : sc)} style={chip(subcategory === sc)}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: subcategory === sc ? color : T.ink2 }}>{sc}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  {label(repeat === 'once' ? 'Date' : 'Starts on')}
                  <TextInput value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={T.faint} style={input} />
                </View>
                {repeat !== 'once' && (
                  <View style={{ flex: 1 }}>
                    {label('Ends (optional)')}
                    <TextInput value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" placeholderTextColor={T.faint} style={input} />
                  </View>
                )}
              </View>

              <View>
                {label('Repeat')}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {(['once', 'weekly', 'monthly', 'yearly'] as const).map(r => (
                    <TouchableOpacity key={r} onPress={() => setRepeat(r)} style={chip(repeat === r)}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: repeat === r ? color : T.ink2 }}>{r === 'once' ? 'Once' : r[0].toUpperCase() + r.slice(1)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {repeat !== 'once' && (
                  <Text style={{ fontSize: 11, color: T.muted, marginTop: 6 }}>
                    Added to the Cash Book automatically on each date. Manage it in Scheduled.
                  </Text>
                )}
              </View>

              {krwAccounts.length > 1 && (
                <View>
                  {label('Account')}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {krwAccounts.map(a => (
                      <TouchableOpacity key={a.id} onPress={() => setAccountId(a.id)} style={chip(accountId === a.id)}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: accountId === a.id ? color : T.ink2 }}>{a.bankName}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {!!error && <Text style={{ color: T.out, fontSize: 12, fontWeight: '600' }}>{error}</Text>}
            </ScrollView>

            <View style={{ padding: 16, paddingBottom: isWide ? 16 : 28, borderTopWidth: 1, borderTopColor: T.line2 }}>
              <TouchableOpacity onPress={save} style={{ backgroundColor: color, borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}>
                <Text style={{ color: T.white, fontWeight: '800', fontSize: 15 }}>{repeat === 'once' ? 'Save' : 'Save schedule'}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
