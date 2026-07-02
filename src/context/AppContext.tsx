import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BankAccount, Expense, SavingsGoal, BorrowRecord, BudgetCategory, Currency } from '../types';

const INITIAL_CATEGORIES: BudgetCategory[] = [
  { id: 'cat-food', name: 'Food & Dining', icon: 'Utensils', color: 'Rose', isCustom: false },
  { id: 'cat-cafe', name: 'Cafe & Study', icon: 'Coffee', color: 'Amber', isCustom: false },
  { id: 'cat-shopping', name: 'Shopping', icon: 'ShoppingBag', color: 'Blue', isCustom: false },
  { id: 'cat-study', name: 'Textbooks & School', icon: 'BookOpen', color: 'Violet', isCustom: false },
  { id: 'cat-travel', name: 'Flights & Travel', icon: 'Plane', color: 'Cyan', isCustom: false },
  { id: 'cat-others', name: 'Fun & Entertainment', icon: 'Smile', color: 'Emerald', isCustom: false },
];

const INITIAL_ACCOUNTS: BankAccount[] = [
  { id: 'acc-hana', name: 'Hana Hana Bank (Hana-One)', bankName: 'Hana Bank (KR)', balance: 1200000, currency: 'KRW', accountNo: '102-392-4112' },
  { id: 'acc-maybank', name: 'Maybank Islamic (M2U)', bankName: 'Maybank (MY)', balance: 3400, currency: 'MYR', accountNo: '164-122-9012' },
];

const INITIAL_EXPENSES: Expense[] = [
  { id: 'exp-1', date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0], amount: 8500, currency: 'KRW', category: 'Food & Dining', accountId: 'acc-hana', note: 'Hanyang Univ Cafeteria lunch' },
  { id: 'exp-2', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], amount: 4500, currency: 'KRW', category: 'Cafe & Study', accountId: 'acc-hana', note: 'Iced Latte at Mega Coffee study' },
  { id: 'exp-3', date: new Date(Date.now()).toISOString().split('T')[0], amount: 35, currency: 'MYR', category: 'Shopping', accountId: 'acc-maybank', note: 'Malaysian SIM card roaming top-up' },
  { id: 'exp-4', date: new Date(Date.now()).toISOString().split('T')[0], amount: 12000, currency: 'KRW', category: 'Fun & Entertainment', accountId: 'acc-hana', note: 'PC Bang (Gaming Cafe) hours with friends' },
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
  handleAddAccount: (acc: Omit<BankAccount, 'id'>) => void;
  handleDeleteAccount: (id: string) => void;
  handleAddGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  handleAddContribution: (goalId: string, accountId: string, amount: number) => void;
  handleDeleteGoal: (goalId: string) => void;
  handleAddBorrowRecord: (record: Omit<BorrowRecord, 'id' | 'repaidAmount' | 'status'>) => void;
  handleRecordRepayment: (recordId: string, accountId: string, repayAmount: number) => void;
  handleRecordCollection: (recordId: string, accountId: string, collectAmount: number) => void;
  handleUpdateAccountNo: (accountId: string, accountNo: string) => void;
  handleUseCalculatedAmount: (amount: number, currency: Currency) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [exchangeRate, setExchangeRateState] = useState<number>(3.32);
  const [accounts, setAccounts] = useState<BankAccount[]>(INITIAL_ACCOUNTS);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [goals, setGoals] = useState<SavingsGoal[]>(INITIAL_GOALS);
  const [records, setRecords] = useState<BorrowRecord[]>(INITIAL_BORROW_RECORDS);
  const [categories, setCategories] = useState<BudgetCategory[]>(INITIAL_CATEGORIES);
  const [quickAmountToFill, setQuickAmountToFill] = useState<number>(0);
  const [quickCurrencyToFill, setQuickCurrencyToFill] = useState<Currency>('KRW');

  // Load all data from AsyncStorage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [rate, savedAccounts, savedExpenses, savedGoals, savedRecords, savedCategories] = await Promise.all([
          AsyncStorage.getItem('saku_rate'),
          AsyncStorage.getItem('saku_accounts'),
          AsyncStorage.getItem('saku_expenses'),
          AsyncStorage.getItem('saku_goals'),
          AsyncStorage.getItem('saku_records'),
          AsyncStorage.getItem('saku_categories'),
        ]);
        if (rate) setExchangeRateState(parseFloat(rate));
        if (savedAccounts) setAccounts(JSON.parse(savedAccounts));
        if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
        if (savedGoals) setGoals(JSON.parse(savedGoals));
        if (savedRecords) setRecords(JSON.parse(savedRecords));
        if (savedCategories) setCategories(JSON.parse(savedCategories));
      } catch (e) {
        console.error('Failed to load data', e);
      }
    };
    loadData();
  }, []);

  // Persist to AsyncStorage on change
  useEffect(() => { AsyncStorage.setItem('saku_rate', exchangeRate.toString()); }, [exchangeRate]);
  useEffect(() => { AsyncStorage.setItem('saku_accounts', JSON.stringify(accounts)); }, [accounts]);
  useEffect(() => { AsyncStorage.setItem('saku_expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { AsyncStorage.setItem('saku_goals', JSON.stringify(goals)); }, [goals]);
  useEffect(() => { AsyncStorage.setItem('saku_records', JSON.stringify(records)); }, [records]);
  useEffect(() => { AsyncStorage.setItem('saku_categories', JSON.stringify(categories)); }, [categories]);

  const setExchangeRate = (rate: number) => setExchangeRateState(rate);

  const handleAdjustBalance = (accountId: string, newBalance: number) => {
    setAccounts(prev => prev.map(acc => acc.id === accountId ? { ...acc, balance: newBalance } : acc));
  };

  const handleUpdateAccountNo = (accountId: string, accountNo: string) => {
    setAccounts(prev => prev.map(acc => acc.id === accountId ? { ...acc, accountNo: accountNo.trim() || undefined } : acc));
  };

  const handleRecordTransfer = (fromAccountId: string, toAccountId: string, amountFrom: number, amountTo: number) => {
    setAccounts(prev => prev.map(acc => {
      if (acc.id === fromAccountId) return { ...acc, balance: acc.balance - amountFrom };
      if (acc.id === toAccountId) return { ...acc, balance: acc.balance + amountTo };
      return acc;
    }));
    const fromAcc = accounts.find(a => a.id === fromAccountId);
    const toAcc = accounts.find(a => a.id === toAccountId);
    if (fromAcc && toAcc) {
      const logExpense: Expense = {
        id: `transfer-log-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        amount: amountFrom,
        currency: fromAcc.currency,
        category: 'Flights & Travel',
        accountId: fromAccountId,
        note: `Exchanged ${fromAcc.currency === 'KRW' ? '₩' : 'RM'}${amountFrom} → ${toAcc.currency === 'KRW' ? '₩' : 'RM'}${amountTo}`,
      };
      setExpenses(prev => [logExpense, ...prev]);
    }
  };

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

  const handleDeleteExpense = (expenseId: string) => {
    const exp = expenses.find(e => e.id === expenseId);
    if (!exp) return;
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
    const isIncome = exp.type === 'income';
    setAccounts(prev => prev.map(acc => {
      if (acc.id === exp.accountId) {
        const change = isIncome ? -exp.amount : exp.amount;
        return { ...acc, balance: acc.balance + change };
      }
      return acc;
    }));
  };

  const handleAddCategory = (newCat: BudgetCategory) => {
    setCategories(prev => [...prev, newCat]);
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
      category: 'Shopping',
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
      category: 'Food & Dining',
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
      category: 'Fun & Entertainment',
      accountId,
      note: `Collected ${acc.currency === 'KRW' ? '₩' : 'RM'}${collectAmount} back from ${rec.person}`,
    }, ...prev]);
  };

  const handleUseCalculatedAmount = (amount: number, currency: Currency) => {
    setQuickAmountToFill(amount);
    setQuickCurrencyToFill(currency);
  };

  const krwBal = accounts.find(a => a.currency === 'KRW')?.balance ?? 0;
  const myrBal = accounts.find(a => a.currency === 'MYR')?.balance ?? 0;
  const totalInMyr = myrBal + (krwBal / 1000) * exchangeRate;
  const totalInKrw = krwBal + myrBal * (1000 / exchangeRate);

  return (
    <AppContext.Provider value={{
      exchangeRate, setExchangeRate,
      accounts, expenses, goals, records, categories,
      quickAmountToFill, quickCurrencyToFill,
      setQuickAmountToFill, setQuickCurrencyToFill,
      totalInMyr, totalInKrw,
      handleAdjustBalance, handleRecordTransfer,
      handleAddExpense, handleDeleteExpense,
      handleAddCategory, handleAddAccount, handleDeleteAccount,
      handleAddGoal, handleAddContribution, handleDeleteGoal,
      handleAddBorrowRecord, handleRecordRepayment, handleRecordCollection,
      handleUpdateAccountNo, handleUseCalculatedAmount,
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
