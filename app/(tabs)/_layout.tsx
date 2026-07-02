import { Tabs, useRouter } from 'expo-router';
import { View, TouchableOpacity } from 'react-native';
import { CreditCard, BarChart2, Plus, LayoutGrid } from 'lucide-react-native';
import Svg, { Rect, Circle, Path } from 'react-native-svg';

function TabungIcon({ size = 24, color = '#22C55E' }: { size?: number; color?: string }) {
  const isActive = color !== '#a8a29e';
  const op = isActive ? 1 : 0.55;
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none" opacity={op}>
      {/* Jar body */}
      <Path
        d="M11 11 L21 11 C25 12 26 14 26 15.5 L26 27.5 C26 29 24.7 30 23 30 L9 30 C7.3 30 6 29 6 27.5 L6 15.5 C6 14 7 12 11 11 Z"
        fill="#DEE6FF" stroke="#B8C4EE" strokeWidth="0.8"
      />
      {/* Glass shine */}
      <Path d="M8.5 15 C8.2 17 8 20 8.3 24" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.75" />
      {/* Lid */}
      <Rect x="6" y="7.5" width="20" height="5" rx="2.5" fill="#8B5E3C" />
      {/* Lid top highlight */}
      <Rect x="6.5" y="7.5" width="19" height="2" rx="1.5" fill="#A87848" />
      {/* Coin slot */}
      <Rect x="13.5" y="5.8" width="5" height="3" rx="1" fill="#5A3820" />
      {/* Top coin (partially above lid) */}
      <Circle cx="16" cy="5" r="3.8" fill="#F5C518" />
      <Circle cx="16" cy="5" r="3.8" stroke="#D4A017" strokeWidth="0.7" fill="none" />
      <Circle cx="16" cy="5" r="2.4" stroke="#D4A017" strokeWidth="0.5" fill="none" />
      <Path d="M16 2.5 L16 7.5" stroke="#D4A017" strokeWidth="0.8" strokeLinecap="round" fill="none" />
      <Path d="M14.3 3.7 C14.8 3.3 15.3 3.1 16 3.1 C17.2 3.1 17.8 3.8 17.8 4.5 C17.8 5.2 17 5.5 16 5.5 C14.9 5.5 14.3 6 14.3 6.6 C14.3 7.2 15 7.6 16 7.6" stroke="#D4A017" strokeWidth="0.7" strokeLinecap="round" fill="none" />
      {/* Coin 1 inside (upper-left) */}
      <Circle cx="13" cy="18.5" r="4.8" fill="#F5C518" />
      <Circle cx="13" cy="18.5" r="4.8" stroke="#D4A017" strokeWidth="0.7" fill="none" />
      <Circle cx="13" cy="18.5" r="3" stroke="#D4A017" strokeWidth="0.5" fill="none" />
      <Path d="M13 15.5 L13 21.5" stroke="#D4A017" strokeWidth="0.9" strokeLinecap="round" fill="none" />
      <Path d="M11.1 16.9 C11.6 16.4 12.2 16.2 13 16.2 C14.4 16.2 15.1 17 15.1 17.8 C15.1 18.6 14.2 18.9 13 18.9 C11.7 18.9 11.1 19.5 11.1 20.1 C11.1 20.8 12 21.2 13 21.2" stroke="#D4A017" strokeWidth="0.8" strokeLinecap="round" fill="none" />
      {/* Coin 2 inside (lower-right) */}
      <Circle cx="19" cy="25.5" r="4.2" fill="#F5C518" />
      <Circle cx="19" cy="25.5" r="4.2" stroke="#D4A017" strokeWidth="0.7" fill="none" />
      <Circle cx="19" cy="25.5" r="2.6" stroke="#D4A017" strokeWidth="0.5" fill="none" />
      <Path d="M19 22.8 L19 28.2" stroke="#D4A017" strokeWidth="0.9" strokeLinecap="round" fill="none" />
      <Path d="M17.2 24.1 C17.7 23.7 18.2 23.5 19 23.5 C20.3 23.5 21 24.2 21 24.9 C21 25.7 20.1 26 19 26 C17.8 26 17.2 26.5 17.2 27.1 C17.2 27.7 18 28.1 19 28.1" stroke="#D4A017" strokeWidth="0.8" strokeLinecap="round" fill="none" />
    </Svg>
  );
}

const ACTIVE = '#22C55E';
const INACTIVE = '#a8a29e';

function CenterButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: ACTIVE,
        alignItems: 'center',
        justifyContent: 'center',
        bottom: 18,
        shadowColor: ACTIVE,
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

export default function TabLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ACTIVE,
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
          title: 'Vault',
          tabBarIcon: ({ color, size }) => <CreditCard size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, size }) => <BarChart2 size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: '',
          tabBarLabel: () => null,
          tabBarIcon: () => null,
          tabBarButton: () => (
            <CenterButton onPress={() => router.navigate('/(tabs)/expenses')} />
          ),
        }}
      />
      <Tabs.Screen
        name="goals-debts"
        options={{
          title: 'Tabung',
          tabBarIcon: ({ color, size }) => <TabungIcon size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => <LayoutGrid size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
