import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../../src/context/AppContext';
import StatsAndCalendar from '../../src/components/StatsAndCalendar';

export default function StatsTab() {
  const { expenses, accounts, categories, handleAddExpense, handleDeleteExpense } = useAppContext();

  return (
    <SafeAreaView className="flex-1 bg-[#faf8f5]" edges={['top']}>
      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        <StatsAndCalendar
          expenses={expenses}
          accounts={accounts}
          categories={categories}
          onAddExpense={handleAddExpense}
          onDeleteExpense={handleDeleteExpense}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

