export type Currency = 'KRW' | 'MYR';

export interface BankAccount {
  id: string;
  name: string;
  bankName: string;
  balance: number;
  currency: Currency;
  accountNo?: string;
  cardColor?: string; // bank card colour (hex); picked automatically if unset
}

export interface Expense {
  id: string;
  date: string;
  amount: number;
  currency: Currency;
  category: string;
  accountId: string; // references BankAccount.id
  note: string;
  type?: 'income' | 'expense';
  subcategory?: string;
  scheduleId?: string;
  transferId?: string; // both legs of a transfer share this id; not counted as income/spending // set on entries created automatically by a Schedule
  importRef?: string; // set on rows imported from a bank file; used to skip duplicates on re-import
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  currency: Currency;
  deadline?: string;
}

export interface BorrowRecord {
  id: string;
  type: 'borrow' | 'lend'; // borrow = I borrowed from someone; lend = someone borrowed from me
  person: string;
  amount: number;
  repaidAmount: number;
  currency: Currency;
  date: string;
  note?: string;
  status: 'unpaid' | 'partial' | 'paid';
}

export interface BudgetCategory {
  id: string;
  name: string;
  icon: string; // Lucide icon name
  color: string; // Tailwind class color
  isCustom: boolean;
  type?: 'expense' | 'income'; // default expense
  subcategories?: string[];
}

/** A repeating entry (subscription, rent, allowance…). Due occurrences are added to the Cash Book automatically. */
export interface Schedule {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  currency: Currency;
  category: string;
  subcategory?: string;
  accountId: string;
  note: string;
  frequency: 'weekly' | 'monthly' | 'yearly';
  startDate: string;   // YYYY-MM-DD, first occurrence
  nextDate: string;    // next occurrence not yet added
  endDate?: string;    // optional last date
  active: boolean;     // false = paused (or finished)
}

/** Monthly spending limit for one expense category, or 'all' for total spending. */
export interface Budget {
  id: string;
  category: string;   // expense category name, or 'all'
  amount: number;     // current limit per month
  currency: Currency;
  startMonth?: string; // YYYY-MM the budget was created
  limits?: { from: string; amount: number }[]; // limit changes (YYYY-MM onward), so past months keep their own limit
}
