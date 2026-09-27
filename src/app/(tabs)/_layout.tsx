import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';

import { Icon } from '@/components/symbol';
import { dark, light } from '@/lib/theme';

/**
 * Tabs are peers (navigation law 5): each tab keeps its own stack, no
 * sliding between tabs, SF Symbols with the filled variant for the active
 * tab, labels always on.
 */
export default function TabsLayout() {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? dark : light;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.secondary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        headerTitleStyle: { fontWeight: '600', fontSize: 17 },
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.label,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chats',
          tabBarIcon: ({ focused }) => (
            <Icon
              name={focused ? 'message.fill' : 'message'}
              size={24}
              color={focused ? colors.accent : colors.secondary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="models"
        options={{
          title: 'Models',
          tabBarIcon: ({ focused }) => (
            <Icon
              name={focused ? 'cpu.fill' : 'cpu'}
              size={24}
              color={focused ? colors.accent : colors.secondary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => (
            <Icon
              name={focused ? 'gearshape.fill' : 'gearshape'}
              size={24}
              color={focused ? colors.accent : colors.secondary}
            />
          ),
        }}
      />
    </Tabs>
  );
}
