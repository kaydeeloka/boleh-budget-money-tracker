import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  rate: 'saku_rate',
  accounts: 'saku_accounts',
  expenses: 'saku_expenses',
  goals: 'saku_goals',
  records: 'saku_records',
  categories: 'saku_categories',
  categoryVersion: 'saku_cat_version',
  rateUpdatedAt: 'saku_rate_updated',
  system: 'saku_system',
  scope: 'saku_scope',
  schedules: 'saku_schedules',
  budgets: 'saku_budgets',
} as const;

export const storage = {
  get: (key: string) => AsyncStorage.getItem(key),
  set: (key: string, value: string) => AsyncStorage.setItem(key, value),
};
