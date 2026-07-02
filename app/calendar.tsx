import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Plus, Trash2, X, Clock } from 'lucide-react-native';
import { useAppContext } from '../src/context/AppContext';
import { Currency } from '../src/types';
import Dropdown from '../src/components/ui/Dropdown';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}


function fmtFull(val: number, cur: Currency) {
  return cur === 'KRW' ? Math.round(val).toLocaleString() : Math.abs(val).toFixed(2);
}

// Colours reused throughout
const C = {
  green:   '#22c55e',
  green50: '#f0fdf4',
  green700:'#15803d',
  red:     '#ef4444',
  red50:   '#fef2f2',
  s9:      '#1c1917',
  s7:      '#44403c',
  s5:      '#78716c',
  s4:      '#a8a29e',
  s3:      '#d6d3d1',
  s2:      '#e7e5e4',
  s1:      '#f5f5f4',
  bg:      '#faf8f5',
  white:   '#ffffff',
};

export default function CalendarScreen() {
  const router = useRouter();
  const { expenses, accounts, categories, handleAddExpense, handleDeleteExpense } = useAppContext();

  const now = new Date();
  const [currentDate, setCurrentDate] = useState(now);
  const [selectedDate, setSelectedDate] = useState(now);
  const [profile, setProfile] = useState<Currency>('KRW');
  const [showForm, setShowForm] = useState(false);
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [amtInput, setAmtInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [catInput, setCatInput] = useState(() => categories[0]?.name ?? '');
  const [accInput, setAccInput] = useState(
    () => accounts.find(a => a.currency === 'KRW')?.id ?? accounts[0]?.id ?? '',
  );

  React.useEffect(() => {
    const match = accounts.find(a => a.currency === profile);
    if (match) setAccInput(match.id);
  }, [profile, accounts]);

  React.useEffect(() => {
    if (categories.length > 0 && !catInput) setCatInput(categories[0].name);
  }, [categories]);

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const todayStr    = toDateStr(now);
  const selDateStr  = toDateStr(selectedDate);
  const sym = profile === 'KRW' ? '₩' : 'RM';

  const daysInMonth   = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month]);
  const firstDayIndex = useMemo(() => new Date(year, month, 1).getDay(),      [year, month]);

  const byDate = useMemo(() => {
    const g: Record<string, typeof expenses> = {};
    expenses.forEach(e => { (g[e.date] ??= []).push(e); });
    return g;
  }, [expenses]);

  const getDayInc = (ds: string) =>
    (byDate[ds] ?? []).filter(e => e.currency === profile && e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const getDayExp = (ds: string) =>
    (byDate[ds] ?? []).filter(e => e.currency === profile && e.type !== 'income').reduce((s, e) => s + e.amount, 0);

  const cells = useMemo(() => {
    const out: Array<{ date: Date; cur: boolean; str: string }> = [];
    const prevDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevDays - i);
      out.push({ date: d, cur: false, str: toDateStr(d) });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      out.push({ date: d, cur: true, str: toDateStr(d) });
    }
    let nx = 1;
    while (out.length < 42) {
      const d = new Date(year, month + 1, nx++);
      out.push({ date: d, cur: false, str: toDateStr(d) });
    }
    return out;
  }, [year, month, daysInMonth, firstDayIndex]);

  const monthItems = useMemo(
    () => expenses.filter(e =>
      e.currency === profile &&
      new Date(e.date).getFullYear() === year &&
      new Date(e.date).getMonth()    === month,
    ),
    [expenses, profile, year, month],
  );
  const mInc  = monthItems.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const mExp  = monthItems.filter(e => e.type !== 'income').reduce((s, e) => s + e.amount, 0);
  const mNet  = mInc - mExp;

  const dayItems = useMemo(
    () => (byDate[selDateStr] ?? []).filter(e => e.currency === profile),
    [byDate, selDateStr, profile],
  );

  function closeForm() {
    setShowForm(false);
    setTxType('expense');
    setAmtInput('');
    setNoteInput('');
  }

  function submit() {
    const amt = parseFloat(amtInput);
    if (isNaN(amt) || amt <= 0) return;
    handleAddExpense({
      date:      selDateStr,
      amount:    amt,
      currency:  profile,
      category:  catInput || categories[0]?.name || 'Food & Dining',
      accountId: accInput,
      note:      noteInput.trim() || catInput || (txType === 'income' ? 'Income' : 'Expense'),
      type:      txType,
    });
    closeForm();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>

      {/* ── Header ─────────────────────────────────────────── */}
      <View style={{
        backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.s2,
        paddingHorizontal: 16, paddingVertical: 12,
        flexDirection: 'row', alignItems: 'center', gap: 12,
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.s1, alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={20} color={C.s7} />
        </TouchableOpacity>
        <View>
          <Text style={{ fontSize: 9, fontWeight: '800', letterSpacing: 2, color: C.s5, textTransform: 'uppercase' }}>
            Full Calendar Log
          </Text>
          <Text style={{ fontSize: 18, fontWeight: '700', color: C.s9 }}>Transaction Calendar</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ padding: 16, gap: 14 }}>

          {/* ── Currency toggle ────────────────────────────── */}
          <View style={{ flexDirection: 'row', backgroundColor: C.s1, borderRadius: 16, padding: 4, borderWidth: 1, borderColor: C.s2 }}>
            {(['KRW', 'MYR'] as Currency[]).map(c => (
              <TouchableOpacity
                key={c}
                onPress={() => setProfile(c)}
                style={{
                  flex: 1, paddingVertical: 9, borderRadius: 12, alignItems: 'center',
                  backgroundColor: profile === c ? C.white : 'transparent',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: profile === c ? C.s9 : C.s5 }}>
                  {c === 'KRW' ? '₩ KRW — Korea' : 'RM MYR — Malaysia'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Month nav + summary ────────────────────────── */}
          <View style={{ backgroundColor: '#f9f9f8', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.s2, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <TouchableOpacity
                onPress={() => setCurrentDate(new Date(year, month - 1, 1))}
                style={{ padding: 8, backgroundColor: C.white, borderRadius: 20, borderWidth: 1, borderColor: C.s2 }}
              >
                <ChevronLeft size={16} color={C.s7} />
              </TouchableOpacity>
              <Text style={{ fontSize: 17, fontWeight: '800', color: C.s9 }}>
                {MONTH_NAMES[month]} {year}
              </Text>
              <TouchableOpacity
                onPress={() => setCurrentDate(new Date(year, month + 1, 1))}
                style={{ padding: 8, backgroundColor: C.white, borderRadius: 20, borderWidth: 1, borderColor: C.s2 }}
              >
                <ChevronRight size={16} color={C.s7} />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', backgroundColor: C.white, borderRadius: 12, borderWidth: 1, borderColor: C.s2 }}>
              {[
                { label: 'Income',  val: mInc,           color: C.green700, pfx: sym },
                { label: 'Expense', val: mExp,           color: C.red,      pfx: `-${sym}` },
                { label: 'Net',     val: Math.abs(mNet), color: mNet >= 0 ? C.s9 : C.red, pfx: mNet < 0 ? `-${sym}` : sym },
              ].map((item, i) => (
                <View
                  key={item.label}
                  style={{ flex: 1, padding: 12, alignItems: 'center', borderRightWidth: i < 2 ? 1 : 0, borderRightColor: C.s1 }}
                >
                  <Text style={{ fontSize: 9, fontWeight: '800', color: C.s4, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                    {item.label}
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: item.color, marginTop: 3 }} numberOfLines={1} adjustsFontSizeToFit>
                    {item.pfx}{fmtFull(item.val, profile)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── Calendar grid ──────────────────────────────── */}
          <View style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.s2 }}>
            {/* Day-name headers */}
            <View style={{ flexDirection: 'row', backgroundColor: C.s1 }}>
              {DAY_NAMES.map((d, i) => (
                <View key={d} style={{ width: `${100 / 7}%` as any, paddingVertical: 8, alignItems: 'center' }}>
                  <Text style={{ fontSize: 9, fontWeight: '800', color: i === 0 ? C.red : C.s5, textTransform: 'uppercase' }}>
                    {d}
                  </Text>
                </View>
              ))}
            </View>

            {/* Cells — percentage width so 7 always fit exactly */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {cells.map((cell, idx) => {
                const isSel   = cell.str === selDateStr;
                const isToday = cell.str === todayStr;
                const isSun   = cell.date.getDay() === 0;
                const inc   = getDayInc(cell.str);
                const exp   = getDayExp(cell.str);
                const hasTx = inc > 0 || exp > 0;

                return (
                  <TouchableOpacity
                    key={`${cell.str}-${idx}`}
                    activeOpacity={0.75}
                    onPress={() => { setSelectedDate(cell.date); setShowForm(false); }}
                    style={{
                      width:           `${100 / 7}%` as any,
                      aspectRatio:     0.82,
                      padding:         4,
                      borderWidth:     1,
                      borderColor:     isSel ? C.green : isToday ? '#86efac' : C.s2,
                      backgroundColor: isSel ? C.green50 : isToday ? '#ecfdf5' : cell.cur ? C.white : '#fafaf9',
                    }}
                  >
                    <Text style={{
                      fontSize:   10,
                      fontWeight: isSel || isToday ? '800' : '500',
                      color:      isSel ? C.green700 : isToday ? C.green : isSun ? C.red : cell.cur ? C.s9 : C.s3,
                    }}>
                      {cell.date.getDate() === 1
                        ? `${cell.date.getMonth() + 1}/1`
                        : String(cell.date.getDate())}
                    </Text>

                    {hasTx && (
                      <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'flex-end', marginTop: 1 }}>
                        {inc > 0 && (
                          <Text style={{ fontSize: 7, fontWeight: '700', color: C.green700 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
                            {fmtFull(inc, profile)}
                          </Text>
                        )}
                        {exp > 0 && (
                          <Text style={{ fontSize: 7, fontWeight: '700', color: C.red }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
                            -{fmtFull(exp, profile)}
                          </Text>
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Selected date panel ────────────────────────── */}
          <View style={{ backgroundColor: '#f9f9f8', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.s2, gap: 12 }}>

            {/* Panel header */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              borderBottomWidth: 1, borderBottomColor: C.s1, paddingBottom: 12,
            }}>
              <View>
                <Text style={{ fontSize: 9, fontWeight: '800', color: C.s5, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Selected Day
                </Text>
                <Text style={{ fontSize: 15, fontWeight: '700', color: C.s9, marginTop: 2 }}>
                  {selectedDate.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long' })}
                </Text>
              </View>
              {!showForm && (
                <TouchableOpacity
                  onPress={() => setShowForm(true)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                    backgroundColor: C.green, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12,
                  }}
                >
                  <Plus size={14} color="white" />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: 'white' }}>Log Here</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Quick-add form */}
            {showForm && (
              <View style={{ backgroundColor: C.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.s2, gap: 12 }}>

                {/* Form title + close */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: C.s9 }}>
                    Quick Log — {selDateStr}
                  </Text>
                  <TouchableOpacity onPress={closeForm} style={{ padding: 4 }}>
                    <X size={18} color={C.s5} />
                  </TouchableOpacity>
                </View>

                {/* Expense / Income toggle */}
                <View style={{ flexDirection: 'row', backgroundColor: C.s1, borderRadius: 12, padding: 3, borderWidth: 1, borderColor: C.s2 }}>
                  <TouchableOpacity
                    onPress={() => setTxType('expense')}
                    style={{
                      flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center',
                      backgroundColor: txType === 'expense' ? C.red : 'transparent',
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '800', color: txType === 'expense' ? 'white' : C.s5 }}>
                      - Expense
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setTxType('income')}
                    style={{
                      flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center',
                      backgroundColor: txType === 'income' ? C.green700 : 'transparent',
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '800', color: txType === 'income' ? 'white' : C.s5 }}>
                      + Income
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Amount */}
                <View>
                  <Text style={{ fontSize: 9, fontWeight: '800', color: C.s5, textTransform: 'uppercase', marginBottom: 5 }}>
                    Amount ({sym})
                  </Text>
                  <View style={{
                    flexDirection: 'row', alignItems: 'center',
                    backgroundColor: '#f9f9f8', borderWidth: 1, borderColor: C.s2,
                    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
                  }}>
                    <Text style={{ fontWeight: '700', color: C.s4, marginRight: 4 }}>{sym}</Text>
                    <TextInput
                      style={{ flex: 1, fontSize: 14, fontWeight: '700', color: C.s9 }}
                      keyboardType="numeric"
                      placeholder="0.00"
                      placeholderTextColor={C.s3}
                      value={amtInput}
                      onChangeText={setAmtInput}
                    />
                  </View>
                </View>

                {/* Account */}
                <View>
                  <Text style={{ fontSize: 9, fontWeight: '800', color: C.s5, textTransform: 'uppercase', marginBottom: 5 }}>
                    Account
                  </Text>
                  <Dropdown
                    options={accounts.map(a => ({
                      label: `${a.bankName} (${a.currency === 'KRW' ? '₩' : 'RM'})`,
                      value: a.id,
                    }))}
                    selectedValue={accInput}
                    onValueChange={setAccInput}
                    title="Select Account"
                  />
                </View>

                {/* Category */}
                <View>
                  <Text style={{ fontSize: 9, fontWeight: '800', color: C.s5, textTransform: 'uppercase', marginBottom: 5 }}>
                    Category
                  </Text>
                  <Dropdown
                    options={categories.map(c => ({ label: c.name, value: c.name }))}
                    selectedValue={catInput}
                    onValueChange={setCatInput}
                    title="Select Category"
                  />
                </View>

                {/* Note */}
                <View>
                  <Text style={{ fontSize: 9, fontWeight: '800', color: C.s5, textTransform: 'uppercase', marginBottom: 5 }}>
                    Note (optional)
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: '#f9f9f8', borderWidth: 1, borderColor: C.s2,
                      borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
                      fontSize: 12, color: C.s9,
                    }}
                    placeholder="e.g. Bus fare, Mega Coffee..."
                    placeholderTextColor={C.s3}
                    value={noteInput}
                    onChangeText={setNoteInput}
                  />
                </View>

                <TouchableOpacity
                  onPress={submit}
                  activeOpacity={0.85}
                  style={{
                    backgroundColor: txType === 'income' ? C.green700 : C.red,
                    paddingVertical: 13, borderRadius: 12, alignItems: 'center',
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '800', fontSize: 13 }}>
                    {txType === 'income' ? 'Confirm Income' : 'Confirm Expense'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Transaction list */}
            {dayItems.length === 0 ? (
              <View style={{
                paddingVertical: 32, alignItems: 'center',
                backgroundColor: C.white, borderRadius: 12, borderWidth: 1, borderColor: C.s1,
              }}>
                <Clock size={32} color={C.s3} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: C.s4, marginTop: 10 }}>
                  No transactions on this day
                </Text>
                <Text style={{ fontSize: 11, color: C.s3, marginTop: 4 }}>
                  Tap "Log Here" to add one
                </Text>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {dayItems.map(exp => {
                  const acc      = accounts.find(a => a.id === exp.accountId);
                  const isIncome = exp.type === 'income';
                  return (
                    <View
                      key={exp.id}
                      style={{
                        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                        backgroundColor: C.white, borderRadius: 12, padding: 12,
                        borderWidth: 1, borderColor: C.s1,
                      }}
                    >
                      <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: C.s9 }} numberOfLines={1}>
                          {exp.note}
                        </Text>
                        <Text style={{ fontSize: 10, color: C.s4, marginTop: 2 }}>
                          {exp.category} · {acc?.bankName ?? '—'}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: isIncome ? C.green700 : C.red }}>
                          {isIncome ? '+' : '-'}{sym}{fmtFull(exp.amount, profile)}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleDeleteExpense(exp.id)}
                          style={{ padding: 5, borderRadius: 8, backgroundColor: C.red50 }}
                        >
                          <Trash2 size={13} color={C.red} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
