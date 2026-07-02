import { Tabs, useRouter } from 'expo-router';
import { View, TouchableOpacity } from 'react-native';
import { CreditCard, Receipt, Plus, PiggyBank, BarChart2 } from 'lucide-react-native';

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
          title: 'Costs',
          tabBarIcon: ({ color, size }) => <Receipt size={size} color={color} />,
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
          title: 'Goals',
          tabBarIcon: ({ color, size }) => <PiggyBank size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, size }) => <BarChart2 size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
