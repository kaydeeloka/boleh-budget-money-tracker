import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { CalendarClock, Plus, Repeat } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppContext } from '@/src/context/AppContext';
import { Schedule } from '@/src/types';
import TxnFormModal from '@/src/features/transactions/TxnFormModal';
import { T, money, fmtDate, toDateStr } from '@/src/theme';
import { categoryLabel } from '@/src/categories';
import { FREQ_LABEL, monthlyEquivalent, occurrences } from '@/src/schedules';
import { Page, AppBar, BarButton, Body, Section, StatCells, Row, Amount, Btn, Field, Empty } from '@/src/components/ui/Ledger';

/**
 * Scheduled = repeating entries. Subscriptions are schedules in the "Subscriptions" category.
 * Due dates are added to the Cash Book automatically (see runDueSchedules in AppContext).
 */
export default function ScheduledScreen() {
  const router = useRouter();
  const { schedules, systemAccounts, scopeIds, system, handleUpdateSchedule, handleDeleteSchedule } = useAppContext();
  const [formOpen, setFormOpen] = useState<null | 'sub' | 'other'>(null);
  const { add } = useLocalSearchParams<{ add?: string }>();
  React.useEffect(() => {
    if (add === 'sub' || add === 'other') { setFormOpen(add); router.setParams({ add: undefined } as any); }
  }, [add]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ amount: '', note: '', nextDate: '', endDate: '' });
  const [error, setError] = useState('');

  const today = toDateStr(new Date());
  const in30 = toDateStr(new Date(Date.now() + 30 * 86400000));
  const mine = schedules.filter(s => s.currency === system && scopeIds.has(s.accountId));
  const running = mine.filter(s => s.active).sort((a, b) => a.nextDate.localeCompare(b.nextDate));
  const subs = running.filter(s => s.category === 'Subscriptions');
  const others = running.filter(s => s.category !== 'Subscriptions');
  const stopped = mine.filter(s => !s.active);

  const subsMonthly = subs.filter(s => s.type === 'expense').reduce((t, s) => t + monthlyEquivalent(s), 0);
  const next30 = useMemo(() => {
    let inn = 0, out = 0;
    for (const s of running) {
      const n = occurrences(s, today, in30).length;
      if (s.type === 'income') inn += n * s.amount; else out += n * s.amount;
    }
    return { inn, out };
  }, [running, today, in30]);

  const accName = (id: string) => systemAccounts.find(a => a.id === id)?.bankName ?? '—';

  const startEdit = (s: Schedule) => {
    if (editingId === s.id) return setEditingId(null);
    setEditingId(s.id); setError(''); setConfirmDeleteId(null);
    setDraft({ amount: String(s.amount), note: s.note, nextDate: s.nextDate, endDate: s.endDate ?? '' });
  };
  const saveEdit = (s: Schedule) => {
    const amt = Number(draft.amount.replace(/[^\d.]/g, ''));
    if (!(amt > 0)) return setError('Enter an amount.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.nextDate)) return setError('Next date must be YYYY-MM-DD.');
    if (draft.endDate && (!/^\d{4}-\d{2}-\d{2}$/.test(draft.endDate) || draft.endDate < draft.nextDate)) return setError('End date must be YYYY-MM-DD and not before the next date.');
    handleUpdateSchedule(s.id, { amount: amt, note: draft.note.trim() || s.note, nextDate: draft.nextDate, endDate: draft.endDate || undefined, active: true });
    setEditingId(null);
  };

  const row = (s: Schedule, i: number) => {
    const isIn = s.type === 'income';
    const open = editingId === s.id;
    const caption = s.active
      ? `${FREQ_LABEL[s.frequency]} · next ${s.nextDate === today ? 'today' : fmtDate(s.nextDate)}${s.endDate ? ` · until ${fmtDate(s.endDate)}` : ''}`
      : s.endDate && s.nextDate > s.endDate ? `Finished ${fmtDate(s.endDate)}` : `Paused · ${FREQ_LABEL[s.frequency]}`;
    return (
      <View key={s.id}>
        <Row
          index={i}
          dim={!s.active}
          caption={caption}
          title={s.note}
          detail={`${categoryLabel(s)} · ${accName(s.accountId)}`}
          onPress={() => startEdit(s)}
          right={<Amount value={`${isIn ? '+' : '−'}${money(s.amount, s.currency)}`} color={isIn ? T.in : T.out} />}
        />
        {open && (
          <View style={{ padding: 14, gap: 10, backgroundColor: T.green50, borderBottomWidth: 1, borderBottomColor: T.line }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Field label={`Amount (${s.currency === 'KRW' ? '₩' : 'RM'})`} keyboardType="numeric" value={draft.amount} onChangeText={v => setDraft(d => ({ ...d, amount: v }))} />
              <Field label="Remark" value={draft.note} onChangeText={v => setDraft(d => ({ ...d, note: v }))} />
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Field label="Next date" placeholder="YYYY-MM-DD" value={draft.nextDate} onChangeText={v => setDraft(d => ({ ...d, nextDate: v }))} />
              <Field label="Ends (optional)" placeholder="YYYY-MM-DD" value={draft.endDate} onChangeText={v => setDraft(d => ({ ...d, endDate: v }))} />
            </View>
            {!!error && <Text style={{ color: T.out, fontSize: 12, fontWeight: '600' }}>{error}</Text>}
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <Btn
                kind={confirmDeleteId === s.id ? 'out' : 'ghost'}
                label={confirmDeleteId === s.id ? 'Tap again to delete' : 'Delete'}
                onPress={() => { if (confirmDeleteId !== s.id) return setConfirmDeleteId(s.id); handleDeleteSchedule(s.id); setEditingId(null); }}
              />
              {s.active
                ? <Btn kind="ghost" label="Pause" onPress={() => { handleUpdateSchedule(s.id, { active: false }); setEditingId(null); }} />
                : <Btn kind="ghost" label="Resume" onPress={() => saveEdit(s)} />}
              <View style={{ flex: 1 }} />
              <Btn kind="ghost" label="Cancel" onPress={() => setEditingId(null)} />
              <Btn label="Save" onPress={() => saveEdit(s)} />
            </View>
            <Text style={{ fontSize: 11, color: T.faint }}>Deleting stops future entries. Entries already added stay in the Cash Book.</Text>
          </View>
        )}
      </View>
    );
  };

  const subsSection = (
    <Section
      title="Subscriptions"
      subtitle={subs.length ? `${subs.length} active · ≈ ${money(subsMonthly, system)} / month` : 'Netflix, Google One, AI claude…'}
      right={<Btn small label="+ Subscription" onPress={() => setFormOpen('sub')} />}
    >
      {subs.length ? subs.map(row) : <Empty text="No subscriptions yet" sub='Tap "+ Subscription" — it repeats monthly by default.' />}
    </Section>
  );

  return (
    <Page>
      <AppBar
        icon={<CalendarClock size={20} color="rgba(255,255,255,0.85)" />}
        title="Scheduled"
        subtitle={`Subscriptions & repeating entries · ${system}`}
        right={<BarButton icon={<Plus size={15} color={T.white} />} label="New" onPress={() => setFormOpen('other')} />}
      />
      <View style={{ borderBottomWidth: 1, borderBottomColor: T.line }}>
        <StatCells cells={[
          { label: 'Subscriptions / mo', value: money(subsMonthly, system), color: T.out },
          { label: 'Next 30 days in', value: money(next30.inn, system), color: T.in },
          { label: 'Next 30 days out', value: money(next30.out, system), color: T.out },
        ]} />
      </View>
      <ScrollView style={{ flex: 1 }}>
        <Body aside={subsSection} asideWidth={440} asideFirst>
          <Section title="Upcoming" subtitle="Rent, bills, allowance… added to the Cash Book on each date">
            {others.length ? others.map(row) : <Empty text="Nothing scheduled" sub='Use "New", or pick Repeat in any Cash In / Cash Out entry.' />}
          </Section>
          {stopped.length > 0 && (
            <Section title="Paused & finished">{stopped.map(row)}</Section>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16 }}>
            <Repeat size={13} color={T.faint} />
            <Text style={{ fontSize: 11, color: T.faint, flex: 1 }}>Due entries are added automatically when you open the app on or after their date.</Text>
          </View>
        </Body>
      </ScrollView>

      <TxnFormModal
        visible={formOpen !== null}
        type="expense"
        defaultRepeat="monthly"
        defaultCategory={formOpen === 'sub' ? 'Subscriptions' : undefined}
        onClose={() => setFormOpen(null)}
      />
    </Page>
  );
}
