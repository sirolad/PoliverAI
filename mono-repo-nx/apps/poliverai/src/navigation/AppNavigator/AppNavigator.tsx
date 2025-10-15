import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { LoginScreen } from '../../screens';
import { RegisterScreen } from '../../screens/RegisterScreen';
import { HomeScreen } from '../../screens/HomeScreen/HomeScreen';
import { TabNavigator } from '../TabNavigator/TabNavigator';
import { LandingScreen } from '../../screens/LandingScreen';

const Stack = createStackNavigator();

export const AppNavigator = ({
  initialPlatform,
  isAuthenticated,
  isLoading,
}: {
  initialPlatform?: string;
  // Accept auth state from the caller to avoid importing useAuth here and creating a circular dependency.
  isAuthenticated?: boolean;
  isLoading?: boolean;
} = {}) => {
  // If parent didn't provide auth state, default to not loading and not authenticated to avoid blocking rendering.
  // Prefer passing real auth state from the app root to this navigator to preserve behavior.
  const loading = isLoading ?? false;
  const authenticated = isAuthenticated ?? false;

  if (loading) {
    return null; // You could show a loading spinner here
  }

  return (
    <NavigationContainer
      linking={
        // Basic web linking configuration so paths map to the intended screens
        // - '/': LandingScreen
        // - '/login': LoginScreen
        // - '/register' and '/signup': RegisterScreen
        // - '/dashboard': HomeScreen (dashboard)
        {
          prefixes: [typeof window !== 'undefined' ? window.location.origin : 'app://'],
          config: {
            screens: {
              WebLanding: '',
              Login: 'login',
              Register: 'register',
              Signup: 'signup',
              Dashboard: 'dashboard',
              Main: {
                path: 'app',
              },
            },
          },
        }
      }
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Always include the key web routes as screens so the linking config can navigate to them */}
        <Stack.Screen name="WebLanding" component={LandingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Signup" component={RegisterScreen} />
        <Stack.Screen name="Dashboard" component={HomeScreen} />
        {authenticated ? (
          <Stack.Screen name="Main" component={TabNavigator} />
        ) : null}
      </Stack.Navigator>
    </NavigationContainer>
  );
};