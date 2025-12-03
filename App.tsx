/**
 * Aspayr Mobile App
 * Banking & AI Financial Assistant
 */

import React, { useEffect, useState } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Navigation
import { AppNavigator } from './src/navigation/AppNavigator';

// Theme
import { lightTheme } from './src/theme/lightTheme';
import { darkTheme } from './src/theme/darkTheme';

// Storage
import { userStorage } from './src/utils/storage';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function App() {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<'light' | 'dark'>(
    systemColorScheme === 'dark' ? 'dark' : 'light'
  );

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    const savedTheme = await userStorage.getTheme();
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (systemColorScheme) {
      setTheme(systemColorScheme);
    }
  };

  const selectedTheme = theme === 'dark' ? darkTheme : lightTheme;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={selectedTheme}>
            <StatusBar
              barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
              backgroundColor={selectedTheme.colors.background}
            />
            <AppNavigator />
          </PaperProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
