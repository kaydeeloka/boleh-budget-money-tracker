import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  LayoutGrid,
  CalendarDays,
  TrendingDown,
  ArrowLeftRight,
  Tag,
  CreditCard,
  Target,
  HandCoins,
  Info,
  GraduationCap,
} from 'lucide-react-native';

type GridItem = {
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  bg: string;
  iconBg: string;
  onPress: () => void;
  full?: boolean;
};

export default function MoreScreen() {
  const router = useRouter();

  const items: GridItem[] = [
    {
      label: 'Calendar Log',
      subtitle: 'Browse & log transactions by date',
      icon: <CalendarDays size={26} color="#22c55e" />,
      bg: '#f0fdf4',
      iconBg: '#dcfce7',
      onPress: () => router.push('/calendar'),
      full: true,
    },
    {
      label: 'Daily Stats',
      subtitle: 'Spending & income overview',
      icon: <TrendingDown size={22} color="#ef4444" />,
      bg: '#fff1f2',
      iconBg: '#fecdd3',
      onPress: () => router.navigate('/(tabs)/expenses'),
    },
    {
      label: 'Exchange Rate',
      subtitle: 'KRW ↔ MYR converter',
      icon: <ArrowLeftRight size={22} color="#0ea5e9" />,
      bg: '#f0f9ff',
      iconBg: '#bae6fd',
      onPress: () => router.navigate('/(tabs)/'),
    },
    {
      label: 'My Goals',
      subtitle: 'Tabung & savings targets',
      icon: <Target size={22} color="#f59e0b" />,
      bg: '#fffbeb',
      iconBg: '#fde68a',
      onPress: () => router.navigate('/(tabs)/goals-debts'),
    },
    {
      label: 'Debts & IOUs',
      subtitle: 'Who owes who',
      icon: <HandCoins size={22} color="#8b5cf6" />,
      bg: '#f5f3ff',
      iconBg: '#ddd6fe',
      onPress: () => router.navigate('/(tabs)/goals-debts'),
    },
    {
      label: 'Accounts',
      subtitle: 'Hana Bank & Maybank',
      icon: <CreditCard size={22} color="#44403c" />,
      bg: '#fafaf9',
      iconBg: '#e7e5e4',
      onPress: () => router.navigate('/(tabs)/'),
    },
    {
      label: 'Categories',
      subtitle: 'Manage spending categories',
      icon: <Tag size={22} color="#14b8a6" />,
      bg: '#f0fdfa',
      iconBg: '#99f6e4',
      onPress: () => router.navigate('/(tabs)/expenses'),
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#faf8f5' }} edges={['top']}>

      {/* Header */}
      <View style={{
        backgroundColor: '#ffffff',
        borderBottomWidth: 1, borderBottomColor: '#e7e5e4',
        paddingHorizontal: 16, paddingVertical: 12,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#f5f5f4', alignItems: 'center', justifyContent: 'center' }}>
            <LayoutGrid size={18} color="#44403c" />
          </View>
          <View>
            <Text style={{ fontSize: 9, fontWeight: '800', letterSpacing: 2, color: '#78716c', textTransform: 'uppercase' }}>
              BolehBudget
            </Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#1c1917' }}>More</Text>
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ padding: 16, gap: 10 }}>

          {/* Grid */}
          {(() => {
            const rows: React.ReactNode[] = [];
            let i = 0;
            while (i < items.length) {
              const item = items[i];
              if (item.full) {
                rows.push(<GridCard key={item.label} item={item} />);
                i++;
              } else {
                const next = items[i + 1];
                rows.push(
                  <View key={item.label} style={{ flexDirection: 'row', gap: 10 }}>
                    <GridCard item={item} half />
                    {next && <GridCard item={next} half />}
                  </View>,
                );
                i += 2;
              }
            }
            return rows;
          })()}

          {/* About card */}
          <View style={{
            backgroundColor: '#1c1917',
            borderRadius: 20, padding: 20,
            borderWidth: 1, borderColor: '#292524',
            marginTop: 4,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center' }}>
                <GraduationCap size={20} color="white" />
              </View>
              <View>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#ffffff' }}>BolehBudget</Text>
                <Text style={{ fontSize: 11, color: '#a8a29e', marginTop: 1 }}>Student Pocket Vault · v2.0</Text>
              </View>
            </View>
            <Text style={{ fontSize: 12, color: '#78716c', lineHeight: 18, fontWeight: '500' }}>
              Designed for Malaysian students in Korea to track KRW & MYR spending, savings goals, and cross-border transfers in one place.
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, borderTopWidth: 1, borderTopColor: '#292524', paddingTop: 12 }}>
              <Info size={13} color="#78716c" />
              <Text style={{ fontSize: 11, color: '#57534e' }}>Annyeong & Selamat Datang!</Text>
            </View>
          </View>

          <View style={{ height: 24 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function GridCard({ item, half }: { item: GridItem; half?: boolean }) {
  return (
    <TouchableOpacity
      onPress={item.onPress}
      activeOpacity={0.75}
      style={{
        flex: half ? 1 : undefined,
        backgroundColor: item.bg,
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e7e5e4',
        gap: 10,
      }}
    >
      <View style={{
        width: 44, height: 44, borderRadius: 14,
        backgroundColor: item.iconBg,
        alignItems: 'center', justifyContent: 'center',
      }}>
        {item.icon}
      </View>
      <View>
        <Text style={{ fontSize: half ? 13 : 15, fontWeight: '700', color: '#1c1917' }}>
          {item.label}
        </Text>
        <Text style={{ fontSize: 11, color: '#78716c', marginTop: 2, lineHeight: 15 }} numberOfLines={2}>
          {item.subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
