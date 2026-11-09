import React, { createContext, useContext, useState, useEffect } from 'react';
import { BankAccount, Expense, SavingsGoal, BorrowRecord, BudgetCategory, Currency, Schedule, Budget } from '../types';
import { dueRuns } from '../schedules';
import { toDateStr, applySystemTheme } from '../theme';
import { DEFAULT_CATEGORIES, migrateCategory } from '../categories';
import { STORAGE_KEYS, storage } from '../data/storage';

const INITIAL_CATEGORIES: BudgetCategory[] = DEFAULT_CATEGORIES;

const INITIAL_ACCOUNTS: BankAccount[] = [
  { id: 'acc-hana', name: 'Hana Hana Bank (Hana-One)', bankName: 'Hana Bank (KR)', balance: 1200000, currency: 'KRW', accountNo: '102-392-4112' },
];

const INITIAL_EXPENSES: Expense[] = [
  { id: 'exp-1', date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0], amount: 8500, currency: 'KRW', category: 'Food & Dining', accountId: 'acc-hana', note: 'Hanyang Univ Cafeteria lunch' },
  { id: 'exp-2', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], amount: 4500, currency: 'KRW', category: 'Food & Dining', subcategory: 'Cafe', accountId: 'acc-hana', note: 'Iced Latte at Mega Coffee study' },
  { id: 'exp-4', date: new Date(Date.now()).toISOString().split('T')[0], amount: 12000, currency: 'KRW', category: 'Entertainment', accountId: 'acc-hana', note: 'PC Bang (Gaming Cafe) hours with friends' },
];

const INITIAL_GOALS: SavingsGoal[] = [
  { id: 'goal-1', title: 'Raya Flight Ticket Home', targetAmount: 750000, currentAmount: 320000, currency: 'KRW', deadline: 'Aidilfitri 2027' },
  { id: 'goal-2', title: 'Cozy Winter Puffer Jacket', targetAmount: 180000, currentAmount: 80000, currency: 'KRW', deadline: 'Winter Semester' },
];

const INITIAL_BORROW_RECORDS: BorrowRecord[] = [
  { id: 'bor-1', type: 'borrow', person: 'Faris (Malaysian Senior)', amount: 15000, repaidAmount: 5000, currency: 'KRW', date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0], note: 'Halal K-BBQ Share', status: 'partial' },
  { id: 'bor-2', type: 'lend', person: 'Sarah (Hana Buddy)', amount: 60, repaidAmount: 0, currency: 'MYR', date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0], note: 'Milo packet & Malaysian snack imports', status: 'unpaid' },
];

interface AppContextType {
  exchangeRate: number;
  setExchangeRate: (rate: number) => void;
  rateUpdatedAt: string | null;
  rateLoading: boolean;
  fetchLiveRate: () => Promise<void>;
  accounts: BankAccount[];
  expenses: Expense[];
  goals: SavingsGoal[];
  records: BorrowRecord[];
  categories: BudgetCategory[];
  quickAmountToFill: number;
  quickCurrencyToFill: Currency;
  setQuickAmountToFill: (amount: number) => void;
  setQuickCurrencyToFill: (currency: Currency) => void;
  totalInMyr: number;
  totalInKrw: number;
  handleAdjustBalance: (accountId: string, newBalance: number) => void;
  handleRecordTransfer: (fromAccountId: string, toAccountId: string, amountFrom: number, amountTo: number) => void;
  handleAddExpense: (expense: Omit<Expense, 'id'>) => void;
  handleDeleteExpense: (expenseId: string) => void;
  handleAddCategory: (category: BudgetCategory) => void;
  handleTransfer: (t: { date: string; fromId: string; toId: string; amountFrom: number; amountTo: number; note?: string }) => void;
  schedules: Schedule[];
  budgets: Budget[];
  handleAddBudget: (b: Omit<Budget, 'id'>) => void;
  handleUpdateBudget: (id: string, patch: Partial<Omit<Budget, 'id'>>) => void;
  handleDeleteBudget: (id: string) => void;
  handleAddSchedule: (s: Omit<Schedule, 'id' | 'nextDate' | 'active'>) => void;
  handleUpdateSchedule: (id: string, patch: Partial<Omit<Schedule, 'id'>>) => void;
  handleDeleteSchedule: (id: string) => void;
  /** Edit a category. Renaming it (or its subcategories via `subRenames`) also updates past entries. */
  handleUpdateCategory: (id: string, patch: Partial<Omit<BudgetCategory, 'id'>>, subRenames?: Record<string, string>) => void;
  /** Delete a category; its entries move to Others / Other Income. */
  handleDeleteCategory: (id: string) => void;
  /** Remove every entry imported from a file into this account. Balance is untouched (imports never changed it per row). */
  handleRemoveImported: (accountId: string) => number;
  handleAddAccount: (acc: Omit<BankAccount, 'id'>) => void;
  handleDeleteAccount: (id: string) => void;
  handleAddGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  handleAddContribution: (goalId: string, accountId: string, amount: number) => void;
  handleDeleteGoal: (goalId: string) => void;
  handleAddBorrowRecord: (record: Omit<BorrowRecord, 'id' | 'repaidAmount' | 'status'>) => void;
  handleRecordRepayment: (recordId: string, accountId: string, repayAmount: number) => void;
  handleRecordCollection: (recordId: string, accountId: string, collectAmount: number) => void;
  handleUpdateAccountNo: (accountId: string, accountNo: string) => void;
  handleUpdateAccount: (accountId: string, patch: { name?: string; bankName?: string; cardColor?: string }) => void;
  handleUseCalculatedAmount: (amount: number, currency: Currency) => void;
  handleImportTransactions: (accountId: string, rows: Omit<Expense, 'id' | 'accountId'>[], newBalance?: number) => number;
  /** Currency "system" the whole app is showing (KRW or MYR). */
  system: Currency;
  setSystem: (c: Currency) => void;
  /** Accounts in the current system's currency. */
  systemAccounts: BankAccount[];
  /** 'all' or one account id within the current system. */
  scopeAccountId: string;
  setScopeAccountId: (id: string) => void;
  /** Account ids the pages should include. */
  scopeIds: Set<string>;
  scopeName: string;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [exchangeRate, setExchangeRateState] = useState<number>(3.32);
  const [accounts, setAccounts] = useState<BankAccount[]>(INITIAL_ACCOUNTS);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [goals, setGoals] = useState<SavingsGoal[]>(INITIAL_GOALS);
  const [records, setRecords] = useState<BorrowRecord[]>(INITIAL_BORROW_RECORDS);
  const [categories, setCategories] = useState<BudgetCategory[]>(INITIAL_CATEGORIES);
  const [quickAmountToFill, setQuickAmountToFill] = useState<number>(0);
  const [quickCurrencyToFill, setQuickCurrencyToFill] = useState<Currency>('KRW');
  const [rateUpdatedAt, setRateUpdatedAt] = useState<string | null>(null);
  const [rateLoading, setRateLoading] = useState(false);
  const [system, setSystemState] = useState<Currency>('KRW');
  const [scopeAccountId, setScopeAccountIdState] = useState<string>('all');
  applySystemTheme(system); // KRW = green, MYR = purple; children read T.* during this same render

  const fetchLiveRate = async () => {
    if (rateLoading) return;
    setRateLoading(true);
    try {
      const res  = await fetch('https://open.er-api.com/v6/latest/KRW');
      const data = await res.json();
      if (data.result === 'success' && data.rates?.MYR) {
        const live = parseFloat((data.rates.MYR * 1000).toFixed(4));
        setExchangeRateState(live);
        const ts = new Date().toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', hour12: true });
        setRateUpdatedAt(ts);
        await storage.set(STORAGE_KEYS.rateUpdatedAt, ts);
      }
    } catch {
      // network unavailable — keep cached rate
    } finally {
      setRateLoading(false);
    }
  };

  // Load all data from AsyncStorage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const CAT_VERSION = 'v4'; // v4: new category set with subcategories
        const [rate, savedAccounts, savedExpenses, savedGoals, savedRecords, savedCategories, catVersion, savedUpdatedAt] = await Promise.all([
          storage.get(STORAGE_KEYS.rate),
          storage.get(STORAGE_KEYS.accounts),
          storage.get(STORAGE_KEYS.expenses),
          storage.get(STORAGE_KEYS.goals),
          storage.get(STORAGE_KEYS.records),
          storage.get(STORAGE_KEYS.categories),
          storage.get(STORAGE_KEYS.categoryVersion),
          storage.get(STORAGE_KEYS.rateUpdatedAt),
        ]);
        if (rate) setExchangeRateState(parseFloat(rate));
        if (savedUpdatedAt) setRateUpdatedAt(savedUpdatedAt);
        if (savedAccounts) setAccounts(JSON.parse(savedAccounts));
        const [savedSystem, savedScope] = await Promise.all([storage.get(STORAGE_KEYS.system), storage.get(STORAGE_KEYS.scope)]);
        if (savedSystem === 'KRW' || savedSystem === 'MYR') setSystemState(savedSystem);
        if (savedScope) setScopeAccountIdState(savedScope);
        if (savedExpenses) setExpenses((JSON.parse(savedExpenses) as Expense[]).map(migrateCategory)); // old names → new categories
        if (savedGoals) setGoals(JSON.parse(savedGoals));
        if (savedRecords) setRecords(JSON.parse(savedRecords));

        if (catVersion !== CAT_VERSION) {
          // Version mismatch — reset to all initial categories + keep any custom ones
          const saved: BudgetCategory[] = savedCategories ? JSON.parse(savedCategories) : [];
          const customOnly = saved.filter(s => s.isCustom);
          const merged = [...INITIAL_CATEGORIES, ...customOnly];
          setCategories(merged);
          await storage.set(STORAGE_KEYS.categoryVersion, CAT_VERSION);
          await storage.set(STORAGE_KEYS.categories, JSON.stringify(merged));
        } else if (savedCategories) {
          // Keep the saved list as-is so edits to built-in categories survive a restart
          const saved: BudgetCategory[] = JSON.parse(savedCategories);
          if (saved.length) setCategories(saved);
        }
        const savedSchedules = await storage.get(STORAGE_KEYS.schedules);
        if (savedSchedules) setSchedules(JSON.parse(savedSchedules));
        const savedBudgets = await storage.get(STORAGE_KEYS.budgets);
        if (savedBudgets) setBudgets(JSON.parse(savedBudgets));
      } catch (e) {
        console.error('Failed to load data', e);
      }
      setLoaded(true);
      // Fetch live rate after local data is ready
      fetchLiveRate();
    };
    loadData();
  }, []);

  // Persist to AsyncStorage on change
  useEffect(() => { storage.set(STORAGE_KEYS.rate, exchangeRate.toString()); }, [exchangeRate]);
  useEffect(() => { storage.set(STORAGE_KEYS.accounts, JSON.stringify(accounts)); }, [accounts]);
  useEffect(() => { storage.set(STORAGE_KEYS.expenses, JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { storage.set(STORAGE_KEYS.goals, JSON.stringify(goals)); }, [goals]);
  useEffect(() => { storage.set(STORAGE_KEYS.records, JSON.stringify(records)); }, [records]);
  useEffect(() => { storage.set(STORAGE_KEYS.categories, JSON.stringify(categories)); }, [categories]);
  // Only after loading, so the empty initial list can't overwrite saved schedules
  useEffect(() => { if (loaded) storage.set(STORAGE_KEYS.schedules, JSON.stringify(schedules)); }, [schedules, loaded]);
  useEffect(() => { if (loaded) storage.set(STORAGE_KEYS.budgets, JSON.stringify(budgets)); }, [budgets, loaded]);

  // ── Monthly budgets ──
  const thisMonth = () => toDateStr(new Date()).slice(0, 7);
  const handleAddBudget = (b: Omit<Budget, 'id'>) => setBudgets(prev => [...prev, {
    ...b, id: `bud-${Date.now()}`, startMonth: thisMonth(), limits: [{ from: thisMonth(), amount: b.amount }],
  }]);
  /** Changing the amount applies from this month on; earlier months keep their old limit. */
  const handleUpdateBudget = (id: string, patch: Partial<Omit<Budget, 'id'>>) => setBudgets(prev => prev.map(b => {
    if (b.id !== id) return b;
    if (patch.amount === undefined || patch.amount === b.amount) return { ...b, ...patch };
    const m = thisMonth();
    const limits = (b.limits ?? [{ from: b.startMonth ?? m, amount: b.amount }]).filter(l => l.from !== m);
    return { ...b, ...patch, limits: [...limits, { from: m, amount: patch.amount }].sort((x, y) => x.from.localeCompare(y.from)) };
  }));
  const handleDeleteBudget = (id: string) => setBudgets(prev => prev.filter(b => b.id !== id));

  // ── Scheduled entries: add everything that's due (on load, when schedules change, and every hour) ──
  const runDueSchedules = () => {
    const runs = dueRuns(schedules, toDateStr(new Date()));
    if (!runs.length) return;
    const existing = new Set(expenses.map(e => e.id));
    const fresh: Expense[] = [];
    for (const { schedule: s, dates } of runs) {
      for (const date of dates) {
        const id = `sch-${s.id}-${date}`;
        if (existing.has(id)) continue;
        fresh.push({ id, date, amount: s.amount, currency: s.currency, category: s.category, subcategory: s.subcategory, accountId: s.accountId, note: s.note, type: s.type, scheduleId: s.id });
      }
    }
    setSchedules(prev => prev.map(s => {
      const r = runs.find(x => x.schedule.id === s.id);
      return r ? { ...s, nextDate: r.nextDate, active: r.finished ? false : s.active } : s;
    }));
    if (!fresh.length) return;
    setExpenses(prev => [...fresh, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
    setAccounts(prev => prev.map(acc => {
      const delta = fresh.filter(e => e.accountId === acc.id).reduce((t, e) => t + (e.type === 'income' ? e.amount : -e.amount), 0);
      return delta ? { ...acc, balance: acc.balance + delta } : acc;
    }));
  };
  useEffect(() => { if (loaded) runDueSchedules(); }, [loaded, schedules]);
  useEffect(() => {
    const t = setInterval(() => { if (loaded) runDueSchedules(); }, 60 * 60 * 1000);
    return () => clearInterval(t);
  });

  const handleAddSchedule = (s: Omit<Schedule, 'id' | 'nextDate' | 'active'>) => {
    setSchedules(prev => [...prev, { ...s, id: `${Date.now()}`, nextDate: s.startDate, active: true }]);
  };
  const handleUpdateSchedule = (id: string, patch: Partial<Omit<Schedule, 'id'>>) => {
    setSchedules(prev => prev.map(s => (s.id === id ? { ...s, ...patch } : s)));
  };
  /** Deleting a schedule keeps the entries it already added. */
  const handleDeleteSchedule = (id: string) => setSchedules(prev => prev.filter(s => s.id !== id));

  const setExchangeRate = (rate: number) => setExchangeRateState(rate);

  const handleAdjustBalance = (accountId: string, newBalance: number) => {
    setAccounts(prev => prev.map(acc => acc.id === accountId ? { ...acc, balance: newBalance } : acc));
  };

  const handleUpdateAccountNo = (accountId: string, accountNo: string) => {
    setAccounts(prev => prev.map(acc => acc.id === accountId ? { ...acc, accountNo: accountNo.trim() || undefined } : acc));
  };

  /** Rename an account (display name and/or bank name); empty values are ignored. */
  const handleUpdateAccount = (accountId: string, patch: { name?: string; bankName?: string; cardColor?: string }) => {
    setAccounts(prev => prev.map(acc => acc.id !== accountId ? acc : {
      ...acc,
      ...(patch.name?.trim() ? { name: patch.name.trim() } : {}),
      ...(patch.bankName?.trim() ? { bankName: patch.bankName.trim() } : {}),
      ...(patch.cardColor ? { cardColor: patch.cardColor } : {}),
    }));
  };

  /**
   * Move money between two accounts. Cross-currency: amountFrom is what left the source account
   * (its currency) and amountTo what arrived (the target's currency) — taken as entered, no rate applied.
   * Recorded as two linked entries (out + in) sharing a transferId.
   */
  const handleTransfer = (t: { date: string; fromId: string; toId: string; amountFrom: number; amountTo: number; note?: string }) => {
    const from = accounts.find(a => a.id === t.fromId);
    const to = accounts.find(a => a.id === t.toId);
    if (!from || !to || from.id === to.id) return;
    const transferId = `tr-${Date.now()}`;
    const note = t.note?.trim();
    const legs: Expense[] = [
      { id: `${transferId}-out`, transferId, date: t.date, amount: t.amountFrom, currency: from.currency, category: 'Transfer', accountId: from.id, type: 'expense', note: note || `Transfer to ${to.name}` },
      { id: `${transferId}-in`, transferId, date: t.date, amount: t.amountTo, currency: to.currency, category: 'Transfer', accountId: to.id, type: 'income', note: note || `Transfer from ${from.name}` },
    ];
    setExpenses(prev => [...legs, ...prev].sort((x, y) => y.date.localeCompare(x.date)));
    setAccounts(prev => prev.map(acc =>
      acc.id === from.id ? { ...acc, balance: acc.balance - t.amountFrom } :
      acc.id === to.id ? { ...acc, balance: acc.balance + t.amountTo } : acc));
  };
  // Kept for older callers
  const handleRecordTransfer = (fromAccountId: string, toAccountId: string, amountFrom: number, amountTo: number) =>
    handleTransfer({ date: toDateStr(new Date()), fromId: fromAccountId, toId: toAccountId, amountFrom, amountTo });

  const handleAddExpense = (newExpData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = { id: `exp-${Date.now()}`, ...newExpData };
    setExpenses(prev => [newExpense, ...prev]);
    const isIncome = newExpData.type === 'income';
    setAccounts(prev => prev.map(acc => {
      if (acc.id === newExpData.accountId) {
        const change = isIncome ? newExpData.amount : -newExpData.amount;
        return { ...acc, balance: acc.balance + change };
      }
      return acc;
    }));
  };

  /**
   * Bulk-add rows from a bank file. Unlike handleAddExpense this does NOT move the balance per row —
   * the bank file already knows the real balance, so pass it as newBalance instead.
   * Rows whose importRef already exists on this account are skipped. Returns how many were added.
   */
  const handleImportTransactions = (accountId: string, rows: Omit<Expense, 'id' | 'accountId'>[], newBalance?: number) => {
    const existingRefs = new Set(
      expenses.filter(e => e.accountId === accountId && e.importRef).map(e => e.importRef!)
    );
    const stamp = Date.now();
    const fresh: Expense[] = rows
      .filter(r => !r.importRef || !existingRefs.has(r.importRef))
      .map((r, i) => ({ ...r, id: `imp-${stamp}-${i}`, accountId }));

    if (fresh.length) {
      setExpenses(prev => [...fresh, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
    }
    if (newBalance !== undefined) {
      setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, balance: newBalance } : a));
    }
    return fresh.length;
  };

  /** Deletes an entry and reverses its effect on the balance. Deleting one leg of a transfer deletes both. */
  const handleDeleteExpense = (expenseId: string) => {
    const exp = expenses.find(e => e.id === expenseId);
    if (!exp) return;
    const gone = exp.transferId ? expenses.filter(e => e.transferId === exp.transferId) : [exp];
    const ids = new Set(gone.map(e => e.id));
    setExpenses(prev => prev.filter(e => !ids.has(e.id)));
    setAccounts(prev => prev.map(acc => {
      const change = gone.filter(e => e.accountId === acc.id).reduce((t, e) => t + (e.type === 'income' ? -e.amount : e.amount), 0);
      return change ? { ...acc, balance: acc.balance + change } : acc;
    }));
  };

  const handleAddCategory = (newCat: BudgetCategory) => {
    setCategories(prev => [...prev, newCat]);
  };

  const handleUpdateCategory = (id: string, patch: Partial<Omit<BudgetCategory, 'id'>>, subRenames: Record<string, string> = {}) => {
    const old = categories.find(c => c.id === id);
    if (!old) return;
    const newName = patch.name?.trim() || old.name;
    setCategories(prev => prev.map(c => (c.id === id ? { ...c, ...patch, name: newName } : c)));
    const renamedCat = newName !== old.name;
    if (renamedCat || Object.keys(subRenames).length) {
      setExpenses(prev => prev.map(e => {
        if (e.category !== old.name) return e;
        const sub = e.subcategory && subRenames[e.subcategory] !== undefined ? subRenames[e.subcategory] || undefined : e.subcategory;
        return { ...e, category: newName, subcategory: sub };
      }));
    }
  };

  const handleRemoveImported = (accountId: string) => {
    const n = expenses.filter(e => e.accountId === accountId && e.importRef).length;
    if (n) setExpenses(prev => prev.filter(e => !(e.accountId === accountId && e.importRef)));
    return n;
  };

  const handleDeleteCategory = (id: string) => {
    const old = categories.find(c => c.id === id);
    if (!old) return;
    const fallback = (old.type ?? 'expense') === 'income' ? 'Other Income' : 'Others';
    setCategories(prev => prev.filter(c => c.id !== id));
    if (old.name !== fallback) {
      setExpenses(prev => prev.map(e => (e.category === old.name ? { ...e, category: fallback, subcategory: undefined } : e)));
    }
  };

  const handleAddAccount = (newAccData: Omit<BankAccount, 'id'>) => {
    setAccounts(prev => [...prev, { id: `acc-${Date.now()}`, ...newAccData }]);
  };

  const handleDeleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
  };

  const handleAddGoal = (newGoalData: Omit<SavingsGoal, 'id'>) => {
    setGoals(prev => [...prev, { id: `goal-${Date.now()}`, ...newGoalData }]);
  };

  const handleAddContribution = (goalId: string, accountId: string, amount: number) => {
    const acc = accounts.find(a => a.id === accountId);
    const goal = goals.find(g => g.id === goalId);
    if (!acc || !goal) return;

    let goalCurrencyContribution = amount;
    if (acc.currency !== goal.currency) {
      if (acc.currency === 'MYR' && goal.currency === 'KRW') {
        goalCurrencyContribution = amount * (1000 / exchangeRate);
      } else if (acc.currency === 'KRW' && goal.currency === 'MYR') {
        goalCurrencyContribution = (amount / 1000) * exchangeRate;
      }
    }

    setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, balance: a.balance - amount } : a));
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, currentAmount: g.currentAmount + goalCurrencyContribution } : g));
    setExpenses(prev => [{
      id: `goal-contrib-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      amount,
      currency: acc.currency,
      category: 'Others',
      accountId,
      note: `Deposited into savings goal: "${goal.title}"`,
    }, ...prev]);
  };

  const handleDeleteGoal = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const matchedAccount = accounts.find(a => a.currency === goal.currency);
    if (matchedAccount && goal.currentAmount > 0) {
      setAccounts(prev => prev.map(acc =>
        acc.id === matchedAccount.id ? { ...acc, balance: acc.balance + goal.currentAmount } : acc
      ));
    }
    setGoals(prev => prev.filter(g => g.id !== goalId));
  };

  const handleAddBorrowRecord = (recData: Omit<BorrowRecord, 'id' | 'repaidAmount' | 'status'>) => {
    setRecords(prev => [{ id: `rec-${Date.now()}`, repaidAmount: 0, status: 'unpaid', ...recData }, ...prev]);
  };

  const handleRecordRepayment = (recordId: string, accountId: string, repayAmount: number) => {
    const rec = records.find(r => r.id === recordId);
    const acc = accounts.find(a => a.id === accountId);
    if (!rec || !acc) return;

    let convertedRepay = repayAmount;
    if (acc.currency !== rec.currency) {
      if (acc.currency === 'MYR' && rec.currency === 'KRW') convertedRepay = repayAmount * (1000 / exchangeRate);
      else if (acc.currency === 'KRW' && rec.currency === 'MYR') convertedRepay = (repayAmount / 1000) * exchangeRate;
    }

    setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, balance: a.balance - repayAmount } : a));
    setRecords(prev => prev.map(r => {
      if (r.id === recordId) {
        const totalRepaid = r.repaidAmount + convertedRepay;
        return { ...r, repaidAmount: Math.min(totalRepaid, r.amount), status: totalRepaid >= r.amount ? 'paid' : 'partial' };
      }
      return r;
    }));
    setExpenses(prev => [{
      id: `repay-log-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      amount: repayAmount,
      currency: acc.currency,
      category: 'Others',
      accountId,
      note: `Repaid ${acc.currency === 'KRW' ? '₩' : 'RM'}${repayAmount} to ${rec.person}`,
    }, ...prev]);
  };

  const handleRecordCollection = (recordId: string, accountId: string, collectAmount: number) => {
    const rec = records.find(r => r.id === recordId);
    const acc = accounts.find(a => a.id === accountId);
    if (!rec || !acc) return;

    let convertedCollect = collectAmount;
    if (acc.currency !== rec.currency) {
      if (acc.currency === 'MYR' && rec.currency === 'KRW') convertedCollect = collectAmount * (1000 / exchangeRate);
      else if (acc.currency === 'KRW' && rec.currency === 'MYR') convertedCollect = (collectAmount / 1000) * exchangeRate;
    }

    setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, balance: a.balance + collectAmount } : a));
    setRecords(prev => prev.map(r => {
      if (r.id === recordId) {
        const totalRepaid = r.repaidAmount + convertedCollect;
        return { ...r, repaidAmount: Math.min(totalRepaid, r.amount), status: totalRepaid >= r.amount ? 'paid' : 'partial' };
      }
      return r;
    }));
    setExpenses(prev => [{
      id: `collect-log-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      amount: -collectAmount,
      currency: acc.currency,
      category: 'Other Income',
      accountId,
      note: `Collected ${acc.currency === 'KRW' ? '₩' : 'RM'}${collectAmount} back from ${rec.person}`,
    }, ...prev]);
  };

  const handleUseCalculatedAmount = (amount: number, currency: Currency) => {
    setQuickAmountToFill(amount);
    setQuickCurrencyToFill(currency);
  };

  const krwBal = accounts.filter(a => a.currency === 'KRW').reduce((s, a) => s + a.balance, 0);
  const myrBal = accounts.filter(a => a.currency === 'MYR').reduce((s, a) => s + a.balance, 0);

  // ── Global scope: which currency "system" and which account(s) every page shows ──
  const setSystem = (c: Currency) => {
    setSystemState(c);
    setScopeAccountIdState('all');
    storage.set(STORAGE_KEYS.system, c);
    storage.set(STORAGE_KEYS.scope, 'all');
  };
  const setScopeAccountId = (id: string) => {
    setScopeAccountIdState(id);
    storage.set(STORAGE_KEYS.scope, id);
  };
  const systemAccounts = accounts.filter(a => a.currency === system);
  const scopeValid = scopeAccountId === 'all' || systemAccounts.some(a => a.id === scopeAccountId);
  const scopeId = scopeValid ? scopeAccountId : 'all';
  const scopeIds = new Set(scopeId === 'all' ? systemAccounts.map(a => a.id) : [scopeId]);
  const scopeName = scopeId === 'all' ? 'All Accounts' : systemAccounts.find(a => a.id === scopeId)?.name ?? 'All Accounts';
  const totalInMyr = myrBal + (krwBal / 1000) * exchangeRate;
  const totalInKrw = krwBal + myrBal * (1000 / exchangeRate);

  return (
    <AppContext.Provider value={{
      exchangeRate, setExchangeRate,
      rateUpdatedAt, rateLoading, fetchLiveRate,
      accounts, expenses, goals, records, categories,
      quickAmountToFill, quickCurrencyToFill,
      setQuickAmountToFill, setQuickCurrencyToFill,
      totalInMyr, totalInKrw,
      handleAdjustBalance, handleRecordTransfer,
      handleAddExpense, handleDeleteExpense,
      handleAddCategory, handleUpdateCategory, handleDeleteCategory, handleRemoveImported, handleAddAccount, handleDeleteAccount,
      handleAddGoal, handleAddContribution, handleDeleteGoal,
      handleAddBorrowRecord, handleRecordRepayment, handleRecordCollection,
      handleUpdateAccountNo, handleUpdateAccount, handleUseCalculatedAmount,
      handleImportTransactions, handleTransfer,
      budgets, handleAddBudget, handleUpdateBudget, handleDeleteBudget,
      schedules, handleAddSchedule, handleUpdateSchedule, handleDeleteSchedule,
      system, setSystem, systemAccounts,
      scopeAccountId: scopeId, setScopeAccountId, scopeIds, scopeName,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside AppProvider');
  return ctx;
}
