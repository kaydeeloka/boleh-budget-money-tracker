import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { onToast, ToastMsg } from '@/src/utils/toast';

const COLORS = { success: '#15803d', error: '#dc2626', info: '#1c1917' };

/** Renders the latest toast for ~3 seconds. Mount once at the app root. */
export default function ToastHost() {
  const [msg, setMsg] = useState<ToastMsg | null>(null);

  useEffect(() => onToast(setMsg), []);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(m => (m?.id === msg.id ? null : m)), msg.kind === 'error' ? 5000 : 2800);
    return () => clearTimeout(t);
  }, [msg]);

  if (!msg) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 90, alignItems: 'center', paddingHorizontal: 16, zIndex: 9999 }}>
      <View style={{ maxWidth: 480, backgroundColor: COLORS[msg.kind], borderRadius: 12, paddingHorizontal: 16, paddingVertical: 11, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 8 }}>
        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700', textAlign: 'center' }}>{msg.text}</Text>
      </View>
    </View>
  );
}
