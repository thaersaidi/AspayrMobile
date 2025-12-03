import React, { useEffect, useState } from 'react';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Linking } from 'react-native';
import { RootStackParamList } from '../types/navigation';
import { AuthStack } from './AuthStack';
import { MainStack } from './MainStack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';

const Stack = createStackNavigator<RootStackParamList>();

// Deep linking configuration for OAuth callbacks
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['aspayr://', 'https://aspayr.app', 'http://localhost:5173'],
  config: {
    screens: {
      Main: {
        screens: {
          LinkBank: {
            path: 'callback',
            parse: {
              consent: (consent: string) => consent,
            },
          },
          Home: {
            screens: {
              Dashboard: 'dashboard',
              Accounts: 'accounts',
              Insights: 'insights',
              Payments: {
                path: 'payments/:payment?',
              },
              Profile: 'profile',
            },
          },
        },
      },
      Auth: {
        screens: {
          Welcome: 'welcome',
          Login: 'login',
        },
      },
    },
  },
  // Custom URL handler for OAuth callbacks
  async getInitialURL() {
    // Check if app was opened from a deep link
    const url = await Linking.getInitialURL();
    console.log('[DeepLink] Initial URL:', url);
    return url;
  },
  subscribe(listener) {
    // Listen for incoming links
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('[DeepLink] Incoming URL:', url);
      listener(url);
    });
    return () => subscription.remove();
  },
};

export const AppNavigator = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      const sessionVerifiedRaw = await AsyncStorage.getItem('aspayr_session_verified');
      
      // Parse the session verified value (it's JSON-stringified)
      let sessionVerified = false;
      if (sessionVerifiedRaw) {
        try {
          sessionVerified = JSON.parse(sessionVerifiedRaw) === true || JSON.parse(sessionVerifiedRaw) === 'true';
        } catch {
          sessionVerified = sessionVerifiedRaw === 'true';
        }
      }
      
      console.log('[AppNavigator] Auth check - user:', !!userJson, 'sessionRaw:', sessionVerifiedRaw, 'sessionParsed:', sessionVerified);
      
      if (userJson && sessionVerified) {
        const user = JSON.parse(userJson);
        // Check if user exists AND session is verified (PIN entered)
        setIsAuthenticated(!!user.userUuid);
        console.log('[AppNavigator] User authenticated:', !!user.userUuid);
      } else {
        console.log('[AppNavigator] Not authenticated');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    // Show splash screen or loading indicator
    const { View, ActivityIndicator, StyleSheet } = require('react-native');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : (
          <Stack.Screen name="Main" component={MainStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = require('react-native').StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
});
