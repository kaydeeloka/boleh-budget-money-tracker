export type Currency = 'KRW' | 'MYR';

export interface BankAccount {
  id: string;
  name: string;
  bankName: string;
  balance: number;
  currency: Currency;
  accountNo?: string;
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
}
