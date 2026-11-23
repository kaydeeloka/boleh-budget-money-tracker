import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppContext } from '@/src/context/AppContext';
import { T } from '@/src/theme';

/** Shows whether the Google Sheet (Excel online) is connected and when it was last saved. Tap to sync / set up. */
export default function SheetStatusChip({ onDark = false }: { onDark?: boolean }) {
  const router = useRouter();
  const { sheetStatus: s, syncSheetNow } = useAppContext();
  const time = s.at ? new Date(s.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const map = {
    off: { dot: '#a8a29e', text: 'Excel: not connected' },
    idle: { dot: '#f59e0b', text: 'Excel connected' },
    saving: { dot: '#0284c7', text: 'Saving to Excel…' },
    saved: { dot: '#22c55e', text: `Excel saved ${time}` },
    error: { dot: '#ef4444', text: 'Excel sync failed' },
  }[s.state];
  const press = () => {
    if (s.state === 'off') router.navigate('/stats' as any);
    else if (s.state !== 'saving') syncSheetNow().catch(() => router.navigate('/stats' as any));
  };
  return (
    <TouchableOpacity onPress={press} accessibilityLabel={map.text} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: onDark ? 'rgba(255,255,255,0.18)' : T.line2 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: map.dot }} />
      <Text style={{ fontSize: 11, fontWeight: '700', color: onDark ? T.white : T.ink2 }}>{map.text}</Text>
    </TouchableOpacity>
  );
}
