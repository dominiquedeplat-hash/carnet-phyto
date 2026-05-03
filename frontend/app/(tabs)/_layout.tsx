import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/theme';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.borderLight,
          borderTopWidth: 1,
          height: 64 + bottomInset,
          paddingTop: 8,
          paddingBottom: bottomInset,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
          marginBottom: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
          tabBarTestID: 'tab-home',
        }}
      />
      <Tabs.Screen
        name="fields"
        options={{
          title: 'Champs',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="leaf" size={size} color={color} />
          ),
          tabBarTestID: 'tab-fields',
        }}
      />
      <Tabs.Screen
        name="treatments"
        options={{
          title: 'Traitements',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="water" size={size} color={color} />
          ),
          tabBarTestID: 'tab-treatments',
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Produits',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flask" size={size} color={color} />
          ),
          tabBarTestID: 'tab-products',
        }}
      />
      <Tabs.Screen
        name="export"
        options={{
          title: 'Export',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="share-outline" size={size} color={color} />
          ),
          tabBarTestID: 'tab-export',
        }}
      />
    </Tabs>
  );
}
