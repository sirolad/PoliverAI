import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '@poliverai/shared-ui';
import { AuthScreen } from '../../screens';
import { TabNavigator } from '../TabNavigator/TabNavigator';

const Stack = createStackNavigator();

export const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null; // You could show a loading spinner here
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={TabNavigator} />
        ) : (
          <Stack.Screen name="Login" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};