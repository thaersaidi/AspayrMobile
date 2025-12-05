import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Platform } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/navigation';
import { authApi } from '../../api';
import { initializeMsal, getMsalInstance, msalLogin, isMsalAvailable } from '../../services/authService';
import { pendingAuthAccount } from '../../../App';
import { Logo } from '../../components/common/Logo';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [msalReady, setMsalReady] = useState(false);

  React.useEffect(() => {
    console.log('[LoginScreen] useEffect running');
    console.log('[LoginScreen] pendingAuthAccount:', pendingAuthAccount ? pendingAuthAccount.username : 'null');
    
    // On web, check if we have a pending auth account from redirect (set in App.tsx)
    if (Platform.OS === 'web' && pendingAuthAccount) {
      const account = pendingAuthAccount;
      const userEmail = account.username || '';
      
      console.log('[Auth] Processing pending auth, email:', userEmail);
      
      // Process the auth result
      (async () => {
        try {
          // Check if user exists in our system
          const { exists, userUuid } = await authApi.checkUserExists(userEmail);

          if (exists && userUuid) {
            // Existing user - go to PIN verification
            console.log('[LoginScreen] Navigating to PINVerify');
            navigation.navigate('PINVerify', { email: userEmail });
          } else {
            // New user - go to registration with pre-filled email
            console.log('[LoginScreen] Navigating to Register');
            navigation.navigate('Register', {
              email: userEmail,
              provider: 'microsoft',
              displayName: account.name || account.username,
            });
          }
        } catch (err: any) {
          console.error('[Auth] Failed to process Microsoft login:', err);
          alert(err.message || 'Failed to process login');
        }
      })();
      
      return;
    }
    
    // Initialize MSAL on all platforms (for native or if no pending result on web)
    if (isMsalAvailable()) {
      initializeMsal()
        .then(() => {
          console.log('[LoginScreen] MSAL initialized');
          setMsalReady(true);
        })
        .catch((err) => {
          console.error('[Auth] MSAL initialization failed:', err);
        });
    }
  }, [navigation]);

  const handleMicrosoftLogin = async () => {
    if (!isMsalAvailable()) {
      alert('Microsoft login is not configured. Please set MSAL_CLIENT_ID.');
      return;
    }

    setLoading(true);

    try {
      // Initialize MSAL if not ready yet
      if (!msalReady) {
        console.log('[Auth] MSAL not ready, initializing...');
        await initializeMsal();
        setMsalReady(true);
      }

      // Use platform-agnostic login function
      const result = await msalLogin();
      
      // On web, loginRedirect doesn't return a result (page redirects)
      // On native, we get the result directly
      if (Platform.OS !== 'web' && result) {
        const userEmail = result.account?.username || '';
        const displayName = result.account?.name || '';
        
        console.log('[Auth] Microsoft login successful:', userEmail);
        
        try {
          // Check if user exists in our system
          const { exists, userUuid } = await authApi.checkUserExists(userEmail);

          if (exists && userUuid) {
            // Existing user - go to PIN verification
            navigation.navigate('PINVerify', { email: userEmail });
          } else {
            // New user - go to registration with pre-filled email
            navigation.navigate('Register', {
              email: userEmail,
              provider: 'microsoft',
              displayName: displayName,
            });
          }
        } catch (err: any) {
          console.error('[Auth] Failed to process Microsoft login:', err);
          alert(err.message || 'Failed to process login');
        }
      }
      // For web, the result is handled in useEffect after redirect
    } catch (err: any) {
      console.error('[Auth] Microsoft login failed:', err);
      alert(err.message || 'Microsoft login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={styles.container}>
        {/* Header with Logo */}
        <View style={styles.header}>
          <Logo style={styles.logo} />
        </View>

        {/* Scrollable content */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        {/* Phone mockup placeholder */}
        <View style={styles.mockupContainer}>
          <View style={[styles.phoneMockup, { backgroundColor: theme.colors.surfaceVariant }]}>
            <View style={[styles.phoneScreen, { backgroundColor: '#000' }]}>
              <View style={styles.phoneContent}>
                <Text style={styles.mockupText}>📊</Text>
                <Text style={[styles.mockupLabel, { color: '#fff' }]}>Analytics Report</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressDot, { backgroundColor: theme.colors.surfaceVariant }]} />
          <View style={[styles.progressDot, styles.progressDotActive, { backgroundColor: theme.colors.primary }]} />
          <View style={[styles.progressDot, { backgroundColor: theme.colors.surfaceVariant }]} />
        </View>

        {/* Main content */}
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            Save & Invest Your Money
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Where saving and investing your money is made simple
          </Text>
        </View>
        </ScrollView>

        {/* Action buttons - fixed at bottom */}
        <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.joinButton, { borderColor: theme.colors.primary }]}
          onPress={() => navigation.navigate('Register')}
          disabled={loading}
        >
          <Text style={[styles.joinButtonText, { color: theme.colors.primary }]}>
            Join Aspayr
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.loginButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleMicrosoftLogin}
          disabled={loading}
        >
          <Text style={[styles.loginButtonText, { color: theme.colors.onPrimary }]}>
            {loading ? 'Logging in...' : 'Login'}
          </Text>
        </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  brandText: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 1,
  },
  logo: {
    width: 120,
    height: 40,
    resizeMode: 'contain',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  mockupContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  phoneMockup: {
    width: 180,
    height: 320,
    borderRadius: 30,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  phoneScreen: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneContent: {
    alignItems: 'center',
  },
  mockupText: {
    fontSize: 48,
    marginBottom: 16,
  },
  mockupLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 16,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressDotActive: {
    width: 24,
  },
  content: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    paddingVertical: 16,
    paddingBottom: 20,
    gap: 12,
  },
  joinButton: {
    paddingVertical: 16,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loginButton: {
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
