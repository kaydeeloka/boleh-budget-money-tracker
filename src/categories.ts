import type React from 'react';
import {
  Utensils, ShoppingCart, Bus, House, Wifi, Smile, HeartPulse, Repeat, ShoppingBag, Sparkles, Sofa, Wallet,
  Package, BookOpen, Plane, Dumbbell, Tag, Coins, GraduationCap, Briefcase, Gift, ArrowLeftRight, Coffee, HelpCircle,
} from 'lucide-react-native';
import type { BudgetCategory } from './types';

/** Icon name (stored on the category) → component. */
export const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  Utensils, ShoppingCart, Bus, House, Wifi, Smile, HeartPulse, Repeat, ShoppingBag, Sparkles, Sofa, Wallet,
  Package, BookOpen, Plane, Dumbbell, Tag, Coins, GraduationCap, Briefcase, Gift, ArrowLeftRight, Coffee,
};

export const CATEGORY_COLORS: Record<string, string> = {
  Rose: '#f43f5e', Emerald: '#10b981', Blue: '#3b82f6', Violet: '#8b5cf6', Amber: '#f59e0b', Cyan: '#06b6d4',
  Teal: '#14b8a6', Pink: '#ec4899', Orange: '#f97316', Slate: '#64748b', Lime: '#65a30d', Indigo: '#6366f1', Brown: '#8b5e3c',
};

const c = (id: string, name: string, icon: string, color: string, subcategories: string[] = [], type: 'expense' | 'income' = 'expense'): BudgetCategory =>
  ({ id, name, icon, color, isCustom: false, type, subcategories });

/** Default categories, with the subcategories carried over from Money Manager. */
export const DEFAULT_CATEGORIES: BudgetCategory[] = [
  // Expense
  c('cat-food', 'Food & Dining', 'Utensils', 'Rose', ['Cafe', 'Outing', 'Delivery']),
  c('cat-groceries', 'Groceries', 'ShoppingCart', 'Emerald', ['Daiso', 'Groceries', 'Conv Store']),
  c('cat-transport', 'Transport', 'Bus', 'Cyan', ['Teksi', 'Subway/Bas', 'Basikal']),
  c('cat-bills', 'Bills & Rent', 'House', 'Amber', ['Air', 'Gas', 'Wolse']),
  c('cat-internet', 'Internet & Phone', 'Wifi', 'Blue', ['Wifi', 'KT']),
  c('cat-fun', 'Entertainment', 'Smile', 'Violet', ['Karaoke', 'Netflix', 'Teater']),
  c('cat-health', 'Health', 'HeartPulse', 'Rose', ['Medical', 'Pharmacy']),
  c('cat-subs', 'Subscriptions', 'Repeat', 'Indigo', ['Google One', 'AI claude']),
  c('cat-shopping', 'Shopping', 'ShoppingBag', 'Blue', ['Dobi', 'Shopping']),
  c('cat-coupang', 'Coupang', 'Package', 'Orange', ['Groceries', 'Digital', 'Outfit']),
  c('cat-beauty', 'Beauty', 'Sparkles', 'Pink', ['Olive Young', 'Lens']),
  c('cat-housing', 'Housing', 'Sofa', 'Brown', ['Furniture', 'Decorations']),
  c('cat-topup', 'Top-up', 'Wallet', 'Teal', ['Coupang', 'Kakaopay', 'NaverPay']),
  c('cat-study', 'Study', 'BookOpen', 'Violet', ['Textbooks', 'Classes']),
  c('cat-travel', 'Travel', 'Plane', 'Cyan', ['Flights', 'Hotel', 'Souvenirs']),
  c('cat-fitness', 'Fitness', 'Dumbbell', 'Lime'),
  c('cat-others', 'Others', 'Tag', 'Slate'),
  // Income
  c('inc-allowance', 'Allowance', 'Coins', 'Emerald', [], 'income'),
  c('inc-scholarship', 'Scholarship', 'GraduationCap', 'Blue', [], 'income'),
  c('inc-salary', 'Salary', 'Briefcase', 'Indigo', [], 'income'),
  c('inc-kayhangeul', 'Kayhangeul', 'BookOpen', 'Amber', ['Kelas Korea', 'Ebook'], 'income'),
  c('inc-transfer', 'Transfer In', 'ArrowLeftRight', 'Slate', [], 'income'),
  c('inc-other', 'Other Income', 'Gift', 'Pink', [], 'income'),
];

/** Old category names (before subcategories) → new category + subcategory. */
const RENAMED: Record<string, { category: string; subcategory?: string }> = {
  'Cafe & Study': { category: 'Food & Dining', subcategory: 'Cafe' },
  'Fun & Entertainment': { category: 'Entertainment' },
  'Flights & Travel': { category: 'Travel' },
  'Textbooks & School': { category: 'Study', subcategory: 'Textbooks' },
};
export function migrateCategory<E extends { category: string; subcategory?: string }>(e: E): E {
  const r = RENAMED[e.category];
  return r ? { ...e, category: r.category, subcategory: e.subcategory ?? r.subcategory } : e;
}

export function categoryStyle(categories: BudgetCategory[], name: string) {
  if (name === 'Transfer') return { Icon: ArrowLeftRight, color: '#64748b' };
  const cat = categories.find(x => x.name === name);
  return {
    Icon: CATEGORY_ICONS[cat?.icon ?? ''] ?? HelpCircle,
    color: CATEGORY_COLORS[cat?.color ?? ''] ?? '#a8a29e',
  };
}

/** "Food & Dining · Cafe" */
export const categoryLabel = (e: { category: string; subcategory?: string }) =>
  e.subcategory ? `${e.category} · ${e.subcategory}` : e.category;
