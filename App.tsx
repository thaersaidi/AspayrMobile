/**
 * Aspayr Mobile App
 * Banking & AI Financial Assistant
 */

import React, { useEffect, useState } from 'react';
import { StatusBar, Platform, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Navigation
import { AppNavigator } from './src/navigation/AppNavigator';

// Theme
import { lightTheme } from './src/theme/lightTheme';
import { darkTheme } from './src/theme/darkTheme';
import { ThemeProvider, useThemeContext } from './src/contexts/ThemeContext';

// Auth
import { initializeMsal, getRedirectResult, isMsalAvailable } from './src/services/authService';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Store auth result globally so LoginScreen can access it
export let pendingAuthAccount: any = null;

// Function to clear pending auth (for logout)
export const clearPendingAuthAccount = () => {
  pendingAuthAccount = null;
  console.log('[App] Cleared pendingAuthAccount');
};

function AppContent() {
  const { theme } = useThemeContext();
  const selectedTheme = theme === 'dark' ? darkTheme : lightTheme;

  return (
    <PaperProvider theme={selectedTheme}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={selectedTheme.colors.background}
      />
      <AppNavigator />
    </PaperProvider>
  );
}

function App() {
  const [msalReady, setMsalReady] = useState(Platform.OS !== 'web');

  useEffect(() => {
    // On web, initialize MSAL before rendering to handle redirects
    if (Platform.OS === 'web' && isMsalAvailable()) {
      console.log('[App] Initializing MSAL before render...');
      initializeMsal()
        .then(() => {
          // Check for auth result from sessionStorage
          const result = getRedirectResult();
          if (result && result.account) {
            console.log('[App] Got pending auth account:', result.account.username);
            pendingAuthAccount = result.account;
          }
          setMsalReady(true);
        })
        .catch((err) => {
          console.error('[App] MSAL init failed:', err);
          setMsalReady(true); // Continue anyway
        });
    }
  }, []);

  // Show loading while MSAL initializes on web
  if (!msalReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
