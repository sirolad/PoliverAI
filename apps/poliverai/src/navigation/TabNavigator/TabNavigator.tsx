import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen, ContactsScreen, InquiriesScreen } from '../../screens';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
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
          tabBarIcon: ({ color, size }) => (
            <HomeIcon color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Contacts"
        component={ContactsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <ContactsIcon color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Inquiries"
        component={InquiriesScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <InquiriesIcon color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Simple icon components using text
const HomeIcon = ({ color, size }: { color: string; size: number }) => (
  <Text style={{ color, fontSize: size, fontWeight: 'bold' }}>🏠</Text>
);

const ContactsIcon = ({ color, size }: { color: string; size: number }) => (
  <Text style={{ color, fontSize: size, fontWeight: 'bold' }}>👥</Text>
);

const InquiriesIcon = ({ color, size }: { color: string; size: number }) => (
  <Text style={{ color, fontSize: size, fontWeight: 'bold' }}>💬</Text>
);