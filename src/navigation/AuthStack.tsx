import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthStackParamList } from '../types/navigation';
import { pendingAuthAccount } from '../../App';

// Import screens
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { PINSetupScreen } from '../screens/auth/PINSetupScreen';
import { PINVerifyScreen } from '../screens/auth/PINVerifyScreen';

const Stack = createStackNavigator<AuthStackParamList>();

export const AuthStack = () => {
  // If there's a pending auth (from OAuth redirect), start at Login screen
  // so its useEffect can handle the redirect to PINVerify
  const initialRouteName = pendingAuthAccount ? 'Login' : 'Welcome';

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#F8FAFC' },
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="PINSetup" component={PINSetupScreen} />
      <Stack.Screen name="PINVerify" component={PINVerifyScreen} />
    </Stack.Navigator>
  );
};
