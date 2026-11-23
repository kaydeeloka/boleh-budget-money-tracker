import { STORAGE_KEYS, storage } from './storage';
import type { BankAccount, BorrowRecord, Budget, BudgetCategory, Expense, SavingsGoal, Schedule } from '../types';

/** Whole-app snapshot: storage key -> stored JSON string. */
export type Snapshot = Record<string, string>;

const URL_KEY = 'saku_sheet_url';
const SECRET_KEY = 'saku_sheet_secret';
const SNAPSHOT_KEYS = Object.values(STORAGE_KEYS);

export async function getSheetConfig() {
  const [url, secret] = await Promise.all([storage.get(URL_KEY), storage.get(SECRET_KEY)]);
  return {
    url: url || process.env.EXPO_PUBLIC_SHEET_URL || '',
    secret: secret || process.env.EXPO_PUBLIC_SHEET_SECRET || '',
  };
}

export async function setSheetConfig(url: string, secret: string) {
  await Promise.all([storage.set(URL_KEY, url.trim()), storage.set(SECRET_KEY, secret.trim())]);
}

export async function readSnapshot(): Promise<Snapshot> {
  const values = await Promise.all(SNAPSHOT_KEYS.map(k => storage.get(k)));
  return Object.fromEntries(SNAPSHOT_KEYS.map((k, i) => [k, values[i] ?? '']));
}

function parse<T>(s: Snapshot, key: string): T[] {
  try { return s[key] ? (JSON.parse(s[key]) as T[]) : []; } catch { return []; }
}

type Sheet = { name: string; rows: (string | number)[][] };

const RESERVED = ['summary', 'goals', 'debts', 'budgets', 'scheduled', 'categories', '_data'];

/** Sheet-tab names can't contain [ ] * / \ ? : and must be unique, at most 100 chars. */
function tabName(raw: string, used: Set<string>) {
  let base = raw.replace(/[\[\]*\/\\?:]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 90) || 'Account';
  if (RESERVED.includes(base.toLowerCase())) base += ' (acc)';
  let name = base;
  let n = 2;
  while (used.has(name.toLowerCase())) name = `${base} ${n++}`;
  used.add(name.toLowerCase());
  return name;
}

/** Readable tabs: Summary, one Cash Book tab per account, Goals, Debts, Budgets, Scheduled, Categories. */
export function buildSheets(s: Snapshot): Sheet[] {
  const accounts = parse<BankAccount>(s, STORAGE_KEYS.accounts);
  const expenses = parse<Expense>(s, STORAGE_KEYS.expenses);
  const goals = parse<SavingsGoal>(s, STORAGE_KEYS.goals);
  const records = parse<BorrowRecord>(s, STORAGE_KEYS.records);
  const budgets = parse<Budget>(s, STORAGE_KEYS.budgets);
  const schedules = parse<Schedule>(s, STORAGE_KEYS.schedules);
  const categories = parse<BudgetCategory>(s, STORAGE_KEYS.categories);
  const accName = (id: string) => accounts.find(a => a.id === id)?.name ?? '';
  const used = new Set<string>(RESERVED);
  const sheets: Sheet[] = [];

  sheets.push({
    name: 'Summary',
    rows: [
      ['Saku - summary'],
      ['Last saved', new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC'],
      ['KRW per 1 MYR', Number(s[STORAGE_KEYS.rate]) || ''],
      [],
      ['Account', 'Bank', 'Account No', 'Currency', 'Balance', 'Entries'],
      ...accounts.map(a => [a.name, a.bankName, a.accountNo ?? '', a.currency, a.balance, expenses.filter(e => e.accountId === a.id).length]),
    ],
  });

  for (const a of accounts) {
    const rows = expenses.filter(e => e.accountId === a.id).sort((x, y) => x.date.localeCompare(y.date));
    const totalIn = rows.filter(e => e.type === 'income').reduce((t, e) => t + e.amount, 0);
    const totalOut = rows.filter(e => e.type !== 'income').reduce((t, e) => t + e.amount, 0);
    sheets.push({
      name: tabName(a.name, used),
      rows: [
        [`Saku Cash Book - ${a.name} (${a.currency})`],
        [],
        ['Date', 'Remark', 'Category', 'Subcategory', 'Account', 'Cash In', 'Cash Out'],
        ...rows.map(e => [e.date, e.note, e.category, e.subcategory ?? '', a.name, e.type === 'income' ? e.amount : '', e.type === 'income' ? '' : e.amount]),
        [],
        ['', '', '', '', 'Total', totalIn, totalOut],
        ['', '', '', '', 'Current Balance', a.balance, ''],
      ],
    });
  }

  sheets.push({
    name: 'Goals',
    rows: [['Goal', 'Target', 'Saved', 'Currency', 'Deadline'], ...goals.map(g => [g.title, g.targetAmount, g.currentAmount, g.currency, g.deadline ?? ''])],
  });
  sheets.push({
    name: 'Debts',
    rows: [
      ['Type', 'Person', 'Amount', 'Repaid', 'Remaining', 'Currency', 'Date', 'Status', 'Note'],
      ...records.map(r => [r.type === 'borrow' ? 'I owe' : 'Owes me', r.person, r.amount, r.repaidAmount, r.amount - r.repaidAmount, r.currency, r.date, r.status, r.note ?? '']),
    ],
  });
  sheets.push({
    name: 'Budgets',
    rows: [['Category', 'Monthly limit', 'Currency', 'Since'], ...budgets.map(b => [b.category === 'all' ? 'All spending' : b.category, b.amount, b.currency, b.startMonth ?? ''])],
  });
  sheets.push({
    name: 'Scheduled',
    rows: [
      ['Remark', 'Type', 'Amount', 'Currency', 'Category', 'Account', 'Frequency', 'Next date', 'Active'],
      ...schedules.map(c => [c.note, c.type, c.amount, c.currency, c.category, accName(c.accountId), c.frequency, c.nextDate, c.active ? 'yes' : 'paused']),
    ],
  });
  sheets.push({
    name: 'Categories',
    rows: [['Category', 'Type', 'Subcategories'], ...categories.map(c => [c.name, c.type ?? 'expense', (c.subcategories ?? []).join(', ')])],
  });
  return sheets;
}

type Reply = { ok: boolean; error?: string; snapshot?: string | null; savedAt?: string; tabs?: number };

async function call(action: 'save' | 'load', extra: Record<string, unknown> = {}): Promise<Reply> {
  const { url, secret } = await getSheetConfig();
  if (!url || !secret) throw new Error('Set up Excel online first (More > Tools > Excel online setup).');
  let res: Response;
  try {
    // text/plain keeps this a "simple" request, so Apps Script needs no CORS preflight.
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, secret, ...extra }),
      redirect: 'follow',
    });
  } catch {
    throw new Error('Could not reach the sheet. Check the Web app URL and that access is set to "Anyone".');
  }
  let data: Reply;
  try { data = await res.json(); } catch {
    throw new Error('The sheet did not answer correctly. Re-deploy the script as a Web app with access "Anyone".');
  }
  if (!data.ok) throw new Error(data.error ?? 'The sheet refused the request.');
  return data;
}

export async function saveToSheet() {
  const snapshot = await readSnapshot();
  return call('save', { sheets: buildSheets(snapshot), snapshot: JSON.stringify(snapshot) });
}

export async function loadFromSheet(): Promise<Snapshot | null> {
  const data = await call('load');
  if (!data.snapshot) return null;
  const snap = JSON.parse(data.snapshot) as unknown;
  if (!snap || typeof snap !== 'object' || Array.isArray(snap)) throw new Error('The sheet backup has an invalid format.');
  return snap as Snapshot;
}
