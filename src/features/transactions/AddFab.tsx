import React, { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { Plus } from 'lucide-react-native';
import { T, useIsWide } from '@/src/theme';
import NewEntryPicker from './NewEntryPicker';

/**
 * Floating "+" (bottom-right) that opens the Income / Expense / Transfer chooser.
 * Desktop only — on phones the centre "+" in the tab bar does the same job.
 * Place it as the last child of a page.
 */
export default function AddFab() {
  const isWide = useIsWide();
  const [open, setOpen] = useState(false);
  if (!isWide) return null;
  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        accessibilityLabel="New entry"
        activeOpacity={0.85}
        style={{
          position: 'absolute', right: 28, bottom: 28, width: 58, height: 58, borderRadius: 29,
          backgroundColor: T.brand, alignItems: 'center', justifyContent: 'center',
          shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 8,
        }}
      >
        <Plus size={28} color={T.white} />
      </TouchableOpacity>
      <NewEntryPicker open={open} onClose={() => setOpen(false)} />
    </>
  );
}
