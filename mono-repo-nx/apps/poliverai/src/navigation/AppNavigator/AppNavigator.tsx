import React from 'react';
import { ActivityIndicator, View, Text, Platform } from 'react-native';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { appColors } from '@poliverai/shared-ui';
import LoginScreen from '../../screens/LoginScreen/LoginScreen';
import PolicyAnalysisScreen from '../../screens/PolicyAnalysisScreen';
import ReportsScreen from '../../screens/ReportsScreen';
import RegisterScreen from '../../screens/RegisterScreen/RegisterScreen';
import DashboardScreen from '../../screens/DashboardScreen';
import { LandingScreen } from '../../screens/LandingScreen';
import CreditsScreen from '../../screens/CreditsScreen';
import PaymentReturnScreen from '../../screens/PaymentReturnScreen';

const Stack = createStackNavigator();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: appColors.blue600,
    background: appColors.white,
    card: appColors.white,
    text: appColors.ink900,
    border: appColors.slate200,
    notification: appColors.blue600,
  },
};

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
  const isWeb = Platform.OS === 'web' && typeof window !== 'undefined';
  const linking = {
    prefixes: isWeb ? [window.location.origin, 'poliverai://'] : ['poliverai://'],
    config: {
      screens: {
        WebLanding: '',
        Login: 'login',
        Register: 'register',
        Signup: 'signup',
        Dashboard: 'dashboard',
        Analyze: 'analyze',
        Reports: 'reports',
        Credits: 'credits',
        PaymentReturn: 'payments/return',
        Main: {
          path: 'app',
        },
      },
    },
  };

  if (loading && authenticated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: appColors.sky50, gap: 12 }}>
        <ActivityIndicator size="large" color={appColors.blue600} />
        <Text style={{ color: appColors.slate600, fontSize: 16, fontWeight: '600' }}>Loading your dashboard...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={navigationTheme}
      linking={linking}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: appColors.white },
          ...(Platform.OS === 'macos' ? ({ animationEnabled: false } as any) : null),
        }}
        initialRouteName={authenticated ? 'Dashboard' : 'WebLanding'}
      >
        {/* Always include the key web routes as screens so the linking config can navigate to them */}
        <Stack.Screen name="WebLanding" component={LandingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Signup" component={RegisterScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Analyze" component={PolicyAnalysisScreen} />
        <Stack.Screen name="Reports" component={ReportsScreen} />
        <Stack.Screen name="Credits" component={CreditsScreen} />
        <Stack.Screen name="PaymentReturn" component={PaymentReturnScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
