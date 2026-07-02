import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../../src/context/AppContext';
import SavingsGoals from '../../src/components/SavingsGoals';
import DebtTracker from '../../src/components/DebtTracker';

export default function GoalsDebtsTab() {
  const {
    goals, accounts, records,
    handleAddGoal, handleAddContribution, handleDeleteGoal,
    handleAddBorrowRecord, handleRecordRepayment, handleRecordCollection,
  } = useAppContext();

  return (
    <SafeAreaView className="flex-1 bg-[#faf8f5]" edges={['top']}>
      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        <SavingsGoals
          goals={goals}
          accounts={accounts}
          onAddGoal={handleAddGoal}
          onAddContribution={handleAddContribution}
          onDeleteGoal={handleDeleteGoal}
        />
        <DebtTracker
          records={records}
          accounts={accounts}
          onAddRecord={handleAddBorrowRecord}
          onRecordRepayment={handleRecordRepayment}
          onRecordCollection={handleRecordCollection}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

