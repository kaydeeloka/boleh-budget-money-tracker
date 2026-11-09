import React, { useState } from 'react';
import { Tabs, useRouter } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity } from 'react-native';
import { LayoutDashboard, CreditCard, BarChart2, Plus, LayoutGrid, BookOpen, Landmark, Wallet, Coins, CalendarClock } from 'lucide-react-native';
import { useAppContext } from '@/src/context/AppContext';
import { T, useIsWide, money } from '@/src/theme';
import { ScopePanel } from '@/src/features/navigation/ScopePicker';
import NewEntryPicker from '@/src/features/transactions/NewEntryPicker';


const ACTIVE = () => T.green; // follows the selected currency theme
const INACTIVE = '#a8a29e';

function CenterButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityLabel="Add transaction"
      style={{
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: ACTIVE(),
        alignItems: 'center',
        justifyContent: 'center',
        bottom: 18,
        shadowColor: ACTIVE(),
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.45,
        shadowRadius: 10,
        elevation: 10,
      }}
    >
      <Plus size={28} color="white" />
    </TouchableOpacity>
  );
}

/** Sidebar entries for the wide (website) layout. `route` is the tab route name. */
const SIDE_NAV: { route: string; href: string; label: string; icon: (c: string) => React.ReactNode }[] = [
  { route: 'index',       href: '/',            label: 'Overview',  icon: c => <LayoutDashboard size={18} color={c} /> },
  { route: 'cashbook',    href: '/cashbook',    label: 'Cash Book', icon: c => <BookOpen size={18} color={c} /> },
  { route: 'scheduled',   href: '/scheduled',   label: 'Scheduled', icon: c => <CalendarClock size={18} color={c} /> },
  { route: 'expenses',    href: '/expenses',    label: 'Stats',     icon: c => <BarChart2 size={18} color={c} /> },
  { route: 'goals-debts', href: '/goals-debts', label: 'Tabung',    icon: c => <Coins size={18} color={c} /> },
  { route: 'accounts',    href: '/accounts',    label: 'Accounts',  icon: c => <Landmark size={18} color={c} /> },
  { route: 'stats',       href: '/stats',       label: 'More',      icon: c => <LayoutGrid size={18} color={c} /> },
];

function SideNav({ state }: BottomTabBarProps) {
  const router = useRouter();
  const { system, scopeIds, systemAccounts, scopeName } = useAppContext();
  const current = state.routes[state.index]?.name;
  const total = systemAccounts.filter(a => scopeIds.has(a.id)).reduce((s, a) => s + a.balance, 0);

  return (
    <View style={{ width: 240, backgroundColor: T.white, borderRightWidth: 1, borderRightColor: T.line, paddingVertical: 20, paddingHorizontal: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 6, marginBottom: 20 }}>
        <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: T.brand, alignItems: 'center', justifyContent: 'center' }}>
          <Wallet size={18} color={T.white} />
        </View>
        <View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: T.ink }}>Saku</Text>
          <Text style={{ fontSize: 9, color: T.muted, marginTop: 1 }}>Track Every Won &amp; Ringgit.</Text>
        </View>
      </View>

      {/* Global scope: currency system + account — every page follows this */}
      <View style={{ marginBottom: 12 }}>
        <ScopePanel />
      </View>

      <View style={{ height: 6 }} />

      <View style={{ gap: 2 }}>
        {SIDE_NAV.map(item => {
          const active = current === item.route;
          return (
            <TouchableOpacity
              key={item.route}
              onPress={() => router.navigate(item.href as any)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 6, backgroundColor: active ? T.brandSoft : 'transparent' }}
            >
              {item.icon(active ? T.brandDark : T.muted)}
              <Text style={{ fontSize: 14, fontWeight: active ? '700' : '500', color: active ? T.brandDark : T.ink2 }}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ flex: 1 }} />
      <View style={{ backgroundColor: T.brand, borderRadius: 14, padding: 14 }}>
        <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' }}>{scopeName}</Text>
        <Text style={{ color: T.white, fontSize: 20, fontWeight: '800', marginTop: 4 }} numberOfLines={1} adjustsFontSizeToFit>{money(total, system)}</Text>
      </View>
    </View>
  );
}

export default function TabLayout() {
  useAppContext(); // re-render (tab bar colours) when the currency system changes
  const isWide = useIsWide();
  // "New entry" (sidebar) and the phone's + button both open the Income / Expense chooser
  const [entryOpen, setEntryOpen] = useState(false);
  // On wide screens the sidebar replaces the tab bar, so every tab is reachable from it.

  return (
    <>
    <Tabs
      backBehavior="history"
      tabBar={isWide ? props => <SideNav {...props} /> : undefined}
      // Website layout: centre each page in a readable column beside the sidebar.
      screenLayout={isWide ? ({ children }: { children: React.ReactNode }) => (
        <View style={{ flex: 1, backgroundColor: T.page }}>
          <View style={{ flex: 1, width: '100%', maxWidth: 1200, alignSelf: 'center' }}>{children}</View>
        </View>
      ) : undefined}
      screenOptions={{
        tabBarPosition: isWide ? 'left' : 'bottom',
        tabBarActiveTintColor: ACTIVE(),
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopColor: '#f0efee',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Overview',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cashbook"
        options={{
          title: 'Cash Book',
          tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        // expo-router forbids href together with tabBarButton, so pick one per layout
        options={isWide ? { title: '', href: null } : {
          title: '',
          tabBarLabel: () => null,
          tabBarIcon: () => null,
          tabBarButton: () => (
            <CenterButton onPress={() => setEntryOpen(true)} />
          ),
        }}
      />
      <Tabs.Screen
        name="goals-debts"
        options={{
          title: 'Tabung',
          tabBarIcon: ({ color, size }) => <Coins size={size} color={color} />,
        }}
      />
      {/* Phones: "Account" hub tab; its ⚙ Settings button opens More (still in the desktop sidebar) */}
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, size }) => <Wallet size={size} color={color} />,
        }}
      />
      <Tabs.Screen name="stats" options={{ title: 'More', href: null }} />
      {/* Not in the phone tab bar; reachable from More / the + button / the sidebar */}
      <Tabs.Screen name="expenses" options={{ title: 'Stats', href: null }} />
      <Tabs.Screen name="accounts" options={{ title: 'Accounts', href: null }} />
      <Tabs.Screen name="scheduled" options={{ title: 'Scheduled', href: null }} />
    </Tabs>
    <NewEntryPicker open={entryOpen} onClose={() => setEntryOpen(false)} />
    </>
  );
}
