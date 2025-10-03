import React from 'react';
import { Text, useWindowDimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { HomeScreen } from '../../screens';

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

// Small icon components using emoji (keeps things simple and cross-platform)
const HomeIcon = ({ color, size }: { color?: string; size?: number }) => (
  <Text style={{ color, fontSize: size || 18, fontWeight: 'bold' }}>🏠</Text>
);

export const TabNavigator = () => {
  const { width } = useWindowDimensions();

  // Breakpoint for switching between mobile (stack/tabs) and wide (permanent drawer) layouts.
  const isWide = width >= 900;

  // Mobile / narrow devices: Bottom Tab Navigator (portrait friendly)
  if (!isWide) {
    return (
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#3B82F6',
          tabBarInactiveTintColor: '#6B7280',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#F3F4F6',
            paddingBottom: 4,
            paddingTop: 4,
            height: 60,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
          headerStyle: {
            backgroundColor: '#3B82F6',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ color, size }) => <HomeIcon color={color} size={size} />,
          }}
        />
      </Tab.Navigator>
    );
  }

  // Wide screens (web/tablet landscape): use a permanent drawer that acts like a side navigation
  return (
    <Drawer.Navigator
      initialRouteName="Home"
      screenOptions={{
        drawerType: 'permanent',
        drawerStyle: { width: 260 },
        headerShown: true,
      }}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{ drawerIcon: ({ color, size }) => <HomeIcon color={color} size={size} /> }}
      />
    </Drawer.Navigator>
  );
};