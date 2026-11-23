import React, { useState } from 'react';
import { Alert, View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import {
  LayoutGrid, BookOpen, CalendarClock, CalendarDays, TrendingDown, ArrowLeftRight, Tag, CreditCard, Target, HandCoins, ChevronRight, GraduationCap, Trash2, CloudUpload, CloudDownload,
} from 'lucide-react-native';
import { T } from '@/src/theme';
import { useAppContext } from '@/src/context/AppContext';
import { downloadSnapshot, uploadSnapshot } from '@/src/data/googleDrive';
import { Page, AppBar, Body, Section, Row } from '@/src/components/ui/Ledger';
import CategoryManager from '@/src/features/insights/CategoryManager';

WebBrowser.maybeCompleteAuthSession();

type Item = { label: string; subtitle: string; icon: React.ReactNode; href?: string; onPress?: () => void };

export default function MoreScreen() {
  const router = useRouter();
  const { loadDemoData, clearDemoData, isDemoData, restoreDriveSnapshot } = useAppContext();
  const [catsOpen, setCatsOpen] = useState(false);
  const [driveBusy, setDriveBusy] = useState(false);
  const [request, , promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });

  const getDriveToken = async () => {
    if (!request) throw new Error('Google Drive is not configured. Add the Expo Google client IDs first.');
    const result = await promptAsync();
    if (result.type !== 'success' || !result.authentication?.accessToken) throw new Error('Google sign-in was cancelled or did not return a Drive token.');
    return result.authentication.accessToken;
  };

  const saveToDrive = async () => {
    setDriveBusy(true);
    try {
      await uploadSnapshot(await getDriveToken());
      Alert.alert('Saved to Google Drive', 'Your data is saved as saku-data.json in My Drive.');
    } catch (error) {
      Alert.alert('Could not save to Google Drive', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setDriveBusy(false);
    }
  };

  const loadFromDrive = async () => {
    Alert.alert(
      'Load from Google Drive?',
      'This replaces the data currently stored on this device with the Drive backup.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Load backup',
          style: 'destructive',
          onPress: async () => {
            setDriveBusy(true);
            try {
              const snapshot = await downloadSnapshot(await getDriveToken());
              if (!snapshot) {
                Alert.alert('No backup found', 'Save your local data to Google Drive first.');
              } else {
                restoreDriveSnapshot(snapshot);
                Alert.alert('Loaded from Google Drive', 'The Drive backup is now active on this device.');
              }
            } catch (error) {
              Alert.alert('Could not load from Google Drive', error instanceof Error ? error.message : 'Please try again.');
            } finally {
              setDriveBusy(false);
            }
          },
        },
      ],
    );
  };
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
          onPress: () => Alert.alert(
            'Use test data?',
            'This replaces the current local data on this device with sample accounts, transactions, goals, debts, budgets, and schedules.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Use test data', style: 'destructive', onPress: loadDemoData },
            ],
          ),
        },
        {
          label: driveBusy ? 'Syncing…' : 'Save to Google Drive',
          subtitle: 'Save a visible saku-data.json backup in My Drive',
          icon: ic(CloudUpload, '#0284c7'),
          onPress: saveToDrive,
        },
        {
          label: driveBusy ? 'Syncing…' : 'Load from Google Drive',
          subtitle: 'Replace this device’s data with your Drive backup',
          icon: ic(CloudDownload, '#0284c7'),
          onPress: loadFromDrive,
        },
        ...(isDemoData ? [{
          label: 'Start using my own data',
          subtitle: 'Remove the test data and start with an empty app',
          icon: ic(Trash2, T.out),
          onPress: () => Alert.alert(
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
      <CategoryManager open={catsOpen} onClose={() => setCatsOpen(false)} />
    </Page>
  );
}
