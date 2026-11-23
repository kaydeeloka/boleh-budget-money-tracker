import React, { useState } from 'react';
import { View, Text, ScrollView, Modal, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import {
  LayoutGrid, BookOpen, CalendarClock, CalendarDays, TrendingDown, ArrowLeftRight, Tag, CreditCard, Target, HandCoins, ChevronRight, GraduationCap, Trash2, Sheet, CloudUpload, CloudDownload,
} from 'lucide-react-native';
import { T } from '@/src/theme';
import { useAppContext } from '@/src/context/AppContext';
import { getSheetConfig, setSheetConfig, loadFromSheet } from '@/src/data/sheetSync';
import { dialog } from '@/src/utils/dialog';
import { toast } from '@/src/utils/toast';
import { Page, AppBar, Body, Section, Row } from '@/src/components/ui/Ledger';
import CategoryManager from '@/src/features/insights/CategoryManager';

type Item = { label: string; subtitle: string; icon: React.ReactNode; href?: string; onPress?: () => void };

export default function MoreScreen() {
  const router = useRouter();
  const { loadDemoData, clearDemoData, isDemoData, restoreSnapshot, sheetStatus, syncSheetNow, refreshSheetConfig } = useAppContext();
  const [catsOpen, setCatsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetSecret, setSheetSecret] = useState('');

  const openSetup = async () => {
    const c = await getSheetConfig();
    setSheetUrl(c.url);
    setSheetSecret(c.secret);
    setSetupOpen(true);
  };
  const saveSetup = async () => {
    await setSheetConfig(sheetUrl, sheetSecret);
    setSetupOpen(false);
    await refreshSheetConfig();
    toast(sheetUrl.trim() && sheetSecret.trim() ? 'Excel online connected' : 'Excel online setup cleared', 'info');
  };
  const toSheet = async () => {
    setBusy(true);
    try {
      await syncSheetNow();
      toast('Saved to Excel online - your sheet is up to date');
    } catch (e) {
      dialog('Could not save', e instanceof Error ? e.message : 'Please try again.');
    } finally { setBusy(false); }
  };
  const fromSheet = () => dialog(
    'Load from Excel online?',
    'This replaces the data on this device with the last data saved to the sheet.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Load', style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            const snap = await loadFromSheet();
            if (!snap) dialog('Nothing to load', 'Save to Excel online first.');
            else restoreSnapshot(snap);
          } catch (e) {
            dialog('Could not load', e instanceof Error ? e.message : 'Please try again.');
          } finally { setBusy(false); }
        },
      },
    ],
  );
  const ic = (Icon: React.ComponentType<any>, color: string) => (
    <View style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: T.line2, alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={18} color={color} />
    </View>
  );

  const groups: { title: string; items: Item[] }[] = [
    {
      title: 'Money',
      items: [
        { label: 'Cash Book', subtitle: 'Daily / weekly / monthly / yearly cash in & out', icon: ic(BookOpen, T.brand), href: '/cashbook' },
        { label: 'Calendar', subtitle: 'Monthly calendar in the Cash Book', icon: ic(CalendarDays, T.brand), href: '/cashbook?view=monthly' },
        { label: 'Scheduled', subtitle: 'Subscriptions & repeating entries', icon: ic(CalendarClock, T.brand), href: '/scheduled' },
        { label: 'Stats', subtitle: 'Spending by category & transaction log', icon: ic(TrendingDown, T.out), href: '/expenses' },
        { label: 'Accounts', subtitle: 'Bank accounts & Excel import', icon: ic(CreditCard, T.ink2), href: '/accounts' },
      ],
    },
    {
      title: 'Planning',
      items: [
        { label: 'Tabung Goals', subtitle: 'Savings targets', icon: ic(Target, '#d97706'), href: '/goals-debts' },
        { label: 'Debts & IOUs', subtitle: 'Who owes who', icon: ic(HandCoins, T.brandMid), href: '/goals-debts' },
      ],
    },
    {
      title: 'Tools',
      items: [
        { label: 'Exchange Rate', subtitle: 'KRW ↔ MYR converter on the Overview', icon: ic(ArrowLeftRight, '#0284c7'), href: '/' },
        { label: 'Categories', subtitle: 'Edit categories & subcategories', icon: ic(Tag, '#0d9488'), onPress: () => setCatsOpen(true) },
        {
          label: 'Use test data',
          subtitle: 'Replace local data with clearly labeled sample records',
          icon: ic(GraduationCap, T.brand),
          onPress: () => dialog(
            'Use test data?',
            'This replaces the current local data on this device with sample accounts, transactions, goals, debts, budgets, and schedules.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Use test data', style: 'destructive', onPress: loadDemoData },
            ],
          ),
        },
        {
          label: busy ? 'Working...' : 'Save to Excel online',
          subtitle: sheetStatus.state === 'off' ? 'Not connected - tap "Excel online setup" first'
            : sheetStatus.state === 'error' ? `Failed: ${sheetStatus.message ?? ''}`
            : sheetStatus.at ? `Connected - last saved ${new Date(sheetStatus.at).toLocaleString()} (auto-saves after changes)`
            : 'Connected - saves automatically after changes',
          icon: ic(CloudUpload, '#0284c7'),
          onPress: toSheet,
        },
        {
          label: 'Load from Excel online',
          subtitle: 'Replace this device\u2019s data with what is in the sheet',
          icon: ic(CloudDownload, '#0284c7'),
          onPress: fromSheet,
        },
        { label: 'Excel online setup', subtitle: 'Paste your Apps Script Web app URL and key', icon: ic(Sheet, '#0284c7'), onPress: openSetup },
        ...(isDemoData ? [{
          label: 'Start using my own data',
          subtitle: 'Remove the test data and start with an empty app',
          icon: ic(Trash2, T.out),
          onPress: () => dialog(
            'Start using your own data?',
            'This removes all test accounts, transactions, goals, debts, budgets, and schedules on this device.',
            [
              { text: 'Cancel', style: 'cancel' as const },
              { text: 'Clear test data', style: 'destructive' as const, onPress: clearDemoData },
            ],
          ),
        }] : []),
      ],
    },
  ];

  return (
    <Page>
      <AppBar icon={<LayoutGrid size={20} color="rgba(255,255,255,0.85)" />} title="More" subtitle="Saku" />
      <ScrollView style={{ flex: 1 }}>
        <Body>
          {groups.map(g => (
            <Section key={g.title} title={g.title}>
              {g.items.map((it, i) => (
                <Row
                  key={it.label}
                  index={i}
                  left={it.icon}
                  title={it.label}
                  detail={it.subtitle}
                  onPress={it.onPress ?? (() => router.navigate(it.href as any))}
                  right={<ChevronRight size={18} color={T.faint} />}
                />
              ))}
            </Section>
          ))}

          <Section title="About">
            <View style={{ flexDirection: 'row', gap: 12, padding: 16 }}>
              <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: T.brand, alignItems: 'center', justifyContent: 'center' }}>
                <GraduationCap size={20} color={T.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: T.ink }}>Saku · v2.0</Text>
                <Text style={{ fontSize: 12, color: T.brandMid, fontWeight: '700', marginTop: 2 }}>Track Every Won &amp; Ringgit.</Text>
                <Text style={{ fontSize: 12, color: T.muted, marginTop: 4, lineHeight: 18 }}>
                  Designed for Malaysian students in Korea to track KRW & MYR spending, savings goals, and transfers in one place.
                  Annyeong & Selamat Datang!
                </Text>
              </View>
            </View>
          </Section>
        </Body>
      </ScrollView>
      <Modal visible={setupOpen} transparent animationType="fade" onRequestClose={() => setSetupOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: T.white, borderRadius: 12, padding: 16, gap: 10, maxWidth: 520, width: '100%', alignSelf: 'center' }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: T.ink }}>Excel online setup</Text>
            <Text style={{ fontSize: 12, color: T.muted }}>Stored on this device only. See apps-script/Code.gs for the setup steps.</Text>
            <TextInput value={sheetUrl} onChangeText={setSheetUrl} placeholder="Web app URL (https://script.google.com/macros/s/.../exec)" autoCapitalize="none" autoCorrect={false}
              style={{ borderWidth: 1, borderColor: T.line, borderRadius: 8, padding: 10, color: T.ink }} />
            <TextInput value={sheetSecret} onChangeText={setSheetSecret} placeholder="Key (SECRET from the script)" autoCapitalize="none" autoCorrect={false} secureTextEntry
              style={{ borderWidth: 1, borderColor: T.line, borderRadius: 8, padding: 10, color: T.ink }} />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 4 }}>
              <TouchableOpacity onPress={() => setSetupOpen(false)}><Text style={{ color: T.muted, fontWeight: '700' }}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={saveSetup}><Text style={{ color: T.brandMid, fontWeight: '800' }}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <CategoryManager open={catsOpen} onClose={() => setCatsOpen(false)} />
    </Page>
  );
}
