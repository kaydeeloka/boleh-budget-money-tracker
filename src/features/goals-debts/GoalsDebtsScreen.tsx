import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Coins } from 'lucide-react-native';
import { useAppContext } from '@/src/context/AppContext';
import { Currency, BorrowRecord } from '@/src/types';
import Dropdown from '@/src/components/ui/Dropdown';
import { T, money, fmtDate, toDateStr } from '@/src/theme';
import { Page, AppBar, Body, Section, StatCells, Btn, Field, Label, Segmented, Empty, Progress } from '@/src/components/ui/Ledger';
import BudgetRow from '@/src/features/budgets/BudgetRow';
import BudgetHistory from '@/src/features/budgets/BudgetHistory';


const sym = (c: Currency) => (c === 'KRW' ? '₩' : 'RM');

export default function GoalsDebtsScreen() {
  const {
    goals: allGoals, systemAccounts: accounts, records: allRecords, system,
    budgets: allBudgets, expenses, categories, scopeIds, handleAddBudget, handleUpdateBudget, handleDeleteBudget,
    handleAddGoal, handleAddContribution, handleDeleteGoal,
    handleAddBorrowRecord, handleRecordRepayment, handleRecordCollection,
  } = useAppContext();

  // Only show goals / IOUs in the selected currency system
  const goals = allGoals.filter(g => g.currency === system);
  const records = allRecords.filter(r => r.currency === system);

  // ── Goals state ──
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');
  const [contribGoalId, setContribGoalId] = useState<string | null>(null);
  const [contribAmount, setContribAmount] = useState('');
  const [contribAccountId, setContribAccountId] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // ── Debts state ──
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [debtType, setDebtType] = useState<'borrow' | 'lend'>('borrow');
  const [debtPerson, setDebtPerson] = useState('');
  const [debtAmount, setDebtAmount] = useState('');
  const [debtDate, setDebtDate] = useState(toDateStr(new Date()));
  const [debtNote, setDebtNote] = useState('');
  const [actionRecordId, setActionRecordId] = useState<string | null>(null);
  const [actionAmount, setActionAmount] = useState('');
  const [actionAccountId, setActionAccountId] = useState('');

  React.useEffect(() => {
    if (accounts.length && !contribAccountId) setContribAccountId(accounts[0].id);
    if (accounts.length && !actionAccountId) setActionAccountId(accounts[0].id);
  }, [accounts]);

  const accountOptions = accounts.map(a => ({ label: `${a.bankName} (${money(a.balance, a.currency)})`, value: a.id }));

  const createGoal = () => {
    const target = parseFloat(goalTarget);
    if (!goalTitle.trim() || !(target > 0)) return;
    handleAddGoal({ title: goalTitle.trim(), targetAmount: target, currentAmount: 0, currency: system, deadline: goalDeadline || undefined });
    setGoalTitle(''); setGoalTarget(''); setGoalDeadline(''); setShowGoalForm(false);
  };
  const contribute = (goalId: string) => {
    const amt = parseFloat(contribAmount);
    if (!(amt > 0) || !contribAccountId) return;
    handleAddContribution(goalId, contribAccountId, amt);
    setContribAmount(''); setContribGoalId(null);
  };
  const addDebt = () => {
    const amt = parseFloat(debtAmount);
    if (!debtPerson.trim() || !(amt > 0)) return;
    handleAddBorrowRecord({ type: debtType, person: debtPerson.trim(), amount: amt, currency: system, date: debtDate, note: debtNote.trim() || undefined });
    setDebtPerson(''); setDebtAmount(''); setDebtNote(''); setShowDebtForm(false);
  };
  const settle = (r: BorrowRecord) => {
    const amt = parseFloat(actionAmount);
    if (!(amt > 0) || !actionAccountId) return;
    if (r.type === 'borrow') handleRecordRepayment(r.id, actionAccountId, amt);
    else handleRecordCollection(r.id, actionAccountId, amt);
    setActionAmount(''); setActionRecordId(null);
  };

  const borrowRecords = records.filter(r => r.type === 'borrow');
  const lendRecords = records.filter(r => r.type === 'lend');
  const owedByMe = borrowRecords.reduce((s, r) => s + (r.amount - r.repaidAmount), 0);
  const owedToMe = lendRecords.reduce((s, r) => s + (r.amount - r.repaidAmount), 0);
  const goalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const goalTarget_ = goals.reduce((s, g) => s + g.targetAmount, 0);

  const STATUS = { paid: T.in, partial: '#d97706', unpaid: T.out } as const;

  // ── Monthly budgets (this currency system) ──
  const budgets = allBudgets.filter(b => b.currency === system);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [budgetCat, setBudgetCat] = useState('all');
  const [budgetAmt, setBudgetAmt] = useState('');
  const [budgetErr, setBudgetErr] = useState('');
  const [editBudgetId, setEditBudgetId] = useState<string | null>(null);
  const [editBudgetAmt, setEditBudgetAmt] = useState('');
  const [confirmBudgetDel, setConfirmBudgetDel] = useState<string | null>(null);
  const [historyFor, setHistoryFor] = useState<string | null>(null); // budget id, '' = first
  const expenseCats = categories.filter(c => (c.type ?? 'expense') === 'expense');
  const freeCats = [{ label: 'All spending (total)', value: 'all' }, ...expenseCats.map(c => ({ label: c.name, value: c.name }))]
    .filter(o => !budgets.some(b => b.category === o.value));
  const addBudget = () => {
    const amt = parseFloat(budgetAmt.replace(/,/g, ''));
    if (!(amt > 0)) return setBudgetErr('Enter a monthly limit.');
    if (budgets.some(b => b.category === budgetCat)) return setBudgetErr('That category already has a budget.');
    handleAddBudget({ category: budgetCat, amount: amt, currency: system });
    setBudgetAmt(''); setBudgetErr(''); setShowBudgetForm(false);
  };
  const totalBudget = budgets.filter(b => b.category !== 'all').reduce((t, b) => t + b.amount, 0);

  const budgetsSection = (
    <Section
      title="Monthly Budgets"
      subtitle={budgets.length ? `Resets on the 1st · ${budgets.length} budget${budgets.length !== 1 ? 's' : ''}${totalBudget ? ` · ${money(totalBudget, system)} across categories` : ''}` : 'Set a monthly limit per category'}
      right={<Btn small label={showBudgetForm ? 'Close' : '+ Budget'} kind={showBudgetForm ? 'ghost' : 'primary'} onPress={() => { setShowBudgetForm(v => !v); setBudgetCat(freeCats[0]?.value ?? 'all'); }} />}
    >
      {showBudgetForm && (
        <View style={{ padding: 16, gap: 12, backgroundColor: T.brandSoft, borderBottomWidth: 1, borderBottomColor: T.line }}>
          {freeCats.length === 0 ? (
            <Text style={{ color: T.muted }}>Every category already has a budget.</Text>
          ) : (
            <>
              <View>
                <Label>Category</Label>
                <Dropdown title="Budget for" options={freeCats} selectedValue={budgetCat} onValueChange={setBudgetCat} />
              </View>
              <Field label={`Monthly limit (${sym(system)})`} placeholder="e.g. 300000" keyboardType="numeric" value={budgetAmt} onChangeText={setBudgetAmt} onSubmitEditing={addBudget} />
              {!!budgetErr && <Text style={{ color: T.out, fontSize: 12, fontWeight: '600' }}>{budgetErr}</Text>}
              <Btn label="Add Budget" onPress={addBudget} />
            </>
          )}
        </View>
      )}
      {budgets.length === 0 && !showBudgetForm ? <Empty text="No budgets yet" sub='Tap "+ Budget" — e.g. Food & Dining ₩300,000 a month.' /> : budgets.map((b, i) => (
        <View key={b.id}>
          <BudgetRow
            budget={b} expenses={expenses} scopeIds={scopeIds} categories={categories} index={i}
            right={
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Btn small kind="ghost" label="History" onPress={() => setHistoryFor(b.id)} />
                <Btn small kind="ghost" label={editBudgetId === b.id ? 'Close' : 'Edit'} onPress={() => { setEditBudgetId(editBudgetId === b.id ? null : b.id); setEditBudgetAmt(String(b.amount)); setConfirmBudgetDel(null); }} />
              </View>
            }
          />
          {editBudgetId === b.id && (
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 12, backgroundColor: T.brandSoft, borderBottomWidth: 1, borderBottomColor: T.line }}>
              <Field label={`Monthly limit (${sym(system)}) — from this month`} keyboardType="numeric" value={editBudgetAmt} onChangeText={setEditBudgetAmt} />
              <Btn label="Save" onPress={() => { const v = parseFloat(editBudgetAmt.replace(/,/g, '')); if (v > 0) handleUpdateBudget(b.id, { amount: v }); setEditBudgetId(null); }} />
              <Btn
                kind={confirmBudgetDel === b.id ? 'out' : 'ghost'}
                label={confirmBudgetDel === b.id ? 'Tap again' : 'Delete'}
                onPress={() => { if (confirmBudgetDel !== b.id) return setConfirmBudgetDel(b.id); handleDeleteBudget(b.id); setEditBudgetId(null); }}
              />
            </View>
          )}
        </View>
      ))}
    </Section>
  );

  // ── Goals section ──
  const goalsSection = (
    <Section
      title="My Tabung Goals"
      subtitle="Save up for tickets, clothing, semester needs"
      right={<Btn small label={showGoalForm ? 'Close' : '+ New Tabung'} kind={showGoalForm ? 'ghost' : 'primary'} onPress={() => setShowGoalForm(v => !v)} />}
    >
      {goals.length > 0 && (
        <View style={{ borderBottomWidth: 1, borderBottomColor: T.line }}>
          <StatCells cells={[
            { label: 'Saved', value: money(goalSaved, system), color: T.in },
            { label: 'Target', value: money(goalTarget_, system), color: T.ink },
            { label: 'To go', value: money(Math.max(0, goalTarget_ - goalSaved), system), color: T.out },
          ]} />
        </View>
      )}

      {showGoalForm && (
        <View style={{ padding: 16, gap: 12, backgroundColor: T.green50, borderBottomWidth: 1, borderBottomColor: T.line }}>
          <Field label="What are you saving for?" placeholder="e.g. Flight to KL for Raya" value={goalTitle} onChangeText={setGoalTitle} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Field label={`Target amount (${sym(system)})`} placeholder="1000" keyboardType="numeric" value={goalTarget} onChangeText={setGoalTarget} />
          </View>
          <Field label="Target date / semester (optional)" placeholder="e.g. October 2026" value={goalDeadline} onChangeText={setGoalDeadline} />
          <Btn label="Start Tabung" onPress={createGoal} />
        </View>
      )}

      {goals.length === 0 ? <Empty text="No tabung goals yet" sub='Tap "+ New Tabung" to start saving.' /> : goals.map((g, i) => {
        const pct = Math.min((g.currentAmount / g.targetAmount) * 100, 100);
        const done = g.currentAmount >= g.targetAmount;
        return (
          <View key={g.id} style={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8, backgroundColor: i % 2 ? '#fcfcfb' : T.white, borderBottomWidth: 1, borderBottomColor: T.line2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: T.ink }}>{g.title}{done ? '  ✓' : ''}</Text>
                {!!g.deadline && <Text style={{ fontSize: 11, color: T.faint, marginTop: 1 }}>Target: {g.deadline}</Text>}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: T.in }}>{money(g.currentAmount, g.currency)}</Text>
                <Text style={{ fontSize: 11, color: T.muted }}>of {money(g.targetAmount, g.currency)} · {pct.toFixed(0)}%</Text>
              </View>
            </View>
            <Progress pct={pct} />
            {contribGoalId === g.id ? (
              <View style={{ gap: 8, paddingTop: 4 }}>
                <Dropdown compact options={accountOptions} selectedValue={contribAccountId} onValueChange={setContribAccountId} title="Take money from" />
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
                  <Field placeholder={`Amount (${sym(system)})`} keyboardType="numeric" value={contribAmount} onChangeText={setContribAmount} autoFocus />
                  <Btn kind="in" label="Save" onPress={() => contribute(g.id)} />
                  <Btn kind="ghost" label="Cancel" onPress={() => setContribGoalId(null)} />
                </View>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Btn small kind="in" label="+ Save Money" onPress={() => {
                  setContribGoalId(g.id);
                  const match = accounts.find(a => a.currency === g.currency);
                  if (match) setContribAccountId(match.id);
                }} />
                <View style={{ flex: 1 }} />
                <Btn small kind={confirmDeleteId === g.id ? 'out' : 'ghost'} label={confirmDeleteId === g.id ? 'Tap again to remove' : 'Remove'} onPress={() => {
                  if (confirmDeleteId !== g.id) return setConfirmDeleteId(g.id);
                  handleDeleteGoal(g.id); setConfirmDeleteId(null);
                }} />
              </View>
            )}
          </View>
        );
      })}
    </Section>
  );

  // ── Debts section ──
  const debtRow = (r: BorrowRecord, i: number) => {
    const remaining = r.amount - r.repaidAmount;
    const done = r.status === 'paid';
    const isBorrow = r.type === 'borrow';
    return (
      <View key={r.id} style={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8, backgroundColor: i % 2 ? '#fcfcfb' : T.white, borderBottomWidth: 1, borderBottomColor: T.line2, opacity: done ? 0.6 : 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: T.muted }}>{fmtDate(r.date)}{r.note ? ` · ${r.note}` : ''}</Text>
            <Text style={{ fontSize: 15, fontWeight: '600', color: T.ink, marginTop: 3 }}>{r.person}</Text>
            <Text style={{ fontSize: 11, fontWeight: '800', color: STATUS[r.status], marginTop: 2, textTransform: 'uppercase' }}>{r.status}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: isBorrow ? T.out : T.in }}>{money(r.amount, r.currency)}</Text>
            <Text style={{ fontSize: 11, color: T.muted }}>Remaining {money(remaining, r.currency)}</Text>
          </View>
        </View>
        <Progress pct={(r.repaidAmount / r.amount) * 100} color={isBorrow ? T.out : T.in} />
        {!done && (actionRecordId === r.id ? (
          <View style={{ gap: 8, paddingTop: 4 }}>
            <Dropdown compact options={accountOptions} selectedValue={actionAccountId} onValueChange={setActionAccountId} title="Account" />
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
              <Field placeholder={`Max ${money(remaining, r.currency)}`} keyboardType="numeric" value={actionAmount} onChangeText={setActionAmount} autoFocus />
              <Btn kind={isBorrow ? 'out' : 'in'} label="Confirm" onPress={() => settle(r)} />
              <Btn kind="ghost" label="Cancel" onPress={() => setActionRecordId(null)} />
            </View>
          </View>
        ) : (
          <View style={{ flexDirection: 'row' }}>
            <Btn small kind={isBorrow ? 'out' : 'in'} label={isBorrow ? 'Record Repayment' : 'Mark Collected'} onPress={() => {
              setActionRecordId(r.id);
              const match = accounts.find(a => a.currency === r.currency);
              if (match) setActionAccountId(match.id);
            }} />
          </View>
        ))}
      </View>
    );
  };

  const groupTitle = (t: string) => (
    <Text style={{ fontSize: 11, fontWeight: '800', color: T.muted, textTransform: 'uppercase', letterSpacing: 0.6, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fafafa', borderBottomWidth: 1, borderBottomColor: T.line }}>{t}</Text>
  );

  const debtsSection = (
    <Section
      title="Borrowing & Lending"
      subtitle="Track IOUs between you and friends"
      right={<Btn small label={showDebtForm ? 'Close' : '+ Record'} kind={showDebtForm ? 'ghost' : 'dark'} onPress={() => setShowDebtForm(v => !v)} />}
    >
      <View style={{ borderBottomWidth: 1, borderBottomColor: T.line }}>
        <StatCells cells={[
          { label: `I Owe (${borrowRecords.filter(r => r.status !== 'paid').length})`, value: money(owedByMe, system), color: T.out },
          { label: `Owed to Me (${lendRecords.filter(r => r.status !== 'paid').length})`, value: money(owedToMe, system), color: T.in },
        ]} />
      </View>

      {showDebtForm && (
        <View style={{ padding: 16, gap: 12, backgroundColor: T.green50, borderBottomWidth: 1, borderBottomColor: T.line }}>
          <Segmented
            options={[{ key: 'borrow' as const, label: 'I Borrowed' }, { key: 'lend' as const, label: 'I Lent' }]}
            value={debtType}
            onChange={setDebtType}
            colors={{ borrow: T.out, lend: T.in }}
          />
          <Field label={debtType === 'borrow' ? 'Borrowed from' : 'Lent to'} placeholder="e.g. Azrul, Jiwon" value={debtPerson} onChangeText={setDebtPerson} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Field label={`Amount (${sym(system)})`} placeholder="0" keyboardType="numeric" value={debtAmount} onChangeText={setDebtAmount} />
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Field label="Date" placeholder="YYYY-MM-DD" value={debtDate} onChangeText={setDebtDate} />
            <Field label="Note (optional)" placeholder="e.g. Dinner" value={debtNote} onChangeText={setDebtNote} />
          </View>
          <Btn kind={debtType === 'borrow' ? 'out' : 'in'} label="Add Record" onPress={addDebt} />
        </View>
      )}

      {borrowRecords.length > 0 && <>{groupTitle('I borrowed from')}{borrowRecords.map(debtRow)}</>}
      {lendRecords.length > 0 && <>{groupTitle('I lent to')}{lendRecords.map(debtRow)}</>}
      {records.length === 0 && <Empty text="No debt records yet" sub="Track borrowed or lent money here" />}
    </Section>
  );

  return (
    <Page>
      <AppBar icon={<Coins size={20} color="rgba(255,255,255,0.85)" />} title="Tabung & IOUs" subtitle={`Savings goals and debts · ${system}`} />
      <ScrollView style={{ flex: 1 }}>
        <Body aside={debtsSection} asideWidth={460}>{budgetsSection}{goalsSection}</Body>
      </ScrollView>
      <BudgetHistory open={historyFor !== null} initialId={historyFor ?? undefined} onClose={() => setHistoryFor(null)} />
    </Page>
  );
}
