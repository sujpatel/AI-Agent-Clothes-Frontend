import { Tabs } from 'expo-router';
import React from 'react';
import { useColorScheme } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const activeColor = colorScheme === 'dark' ? '#F0EBDF' : '#17150F';
  const inactiveColor = colorScheme === 'dark' ? '#9A9282' : '#8B8477';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarLabelStyle: { fontWeight: '600', fontSize: 10.5 },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="sun.max.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Wardrobe',
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="hanger" color={color} />,
        }}
      />
      <Tabs.Screen
        name="laundry"
        options={{
          title: 'Laundry',
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="washer.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
