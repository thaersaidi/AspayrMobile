import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, useTheme, Divider } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/navigation';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { authApi } from '../../api';
import { initializeMsal, getMsalInstance, loginRequest, isMsalAvailable } from '../../services/msalConfig';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [msalReady, setMsalReady] = useState(false);

  React.useEffect(() => {
    // Initialize MSAL on web platform
    if (isMsalAvailable()) {
      initializeMsal()
        .then(() => {
          setMsalReady(true);
        })
        .catch((err) => {
          console.error('[Auth] MSAL initialization failed:', err);
        });
    }
  }, []);

  const handleEmailLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check if user exists
      const { exists, userUuid } = await authApi.checkUserExists(email);

      if (exists && userUuid) {
        // User exists, go to PIN verification
        navigation.navigate('PINVerify', { email });
      } else {
        setError('User not found. Please register first.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    if (!isMsalAvailable()) {
      setError('Microsoft login is only available on web. MSAL configuration is missing.');
      return;
    }

    if (!msalReady) {
      setError('Microsoft login is initializing. Please try again in a moment.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const msalInstance = getMsalInstance();
      const loginResponse = await msalInstance.loginPopup(loginRequest);
      const account = loginResponse.account;
      const userEmail = account?.username || '';

      console.log('[Auth] Microsoft login successful:', userEmail);

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
          displayName: account?.name || account?.username,
        });
      }
    } catch (err: any) {
      console.error('[Auth] Microsoft login failed:', err);
      setError(err.message || 'Microsoft login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={[styles.scroll, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text
            style={[styles.title, { color: theme.colors.onSurface }]}
          >
            Welcome Back
          </Text>
          <Text
            style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            Sign in to your account
          </Text>
        </View>

        {error ? (
          <View
            style={[
              styles.errorBox,
              { backgroundColor: theme.colors.errorContainer },
            ]}
          >
            <Text style={{ color: theme.colors.error }}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            disabled={loading}
          />

          <Input
            label="Password (PIN later)"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter temporary password"
            secureTextEntry
            disabled={loading}
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={handleEmailLogin}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Continue
          </Button>

          <View style={styles.dividerContainer}>
            <Divider style={styles.divider} />
            <Text
              style={[
                styles.dividerText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              OR
            </Text>
            <Divider style={styles.divider} />
          </View>

          <Button
            mode="outlined"
            onPress={handleMicrosoftLogin}
            disabled={loading}
            icon="microsoft"
            style={styles.button}
          >
            Continue with Microsoft
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate('Register')}
            disabled={loading}
            style={styles.linkButton}
          >
            Don't have an account? Sign up
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    marginTop: 40,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  errorBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  form: {
    flex: 1,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  linkButton: {
    marginTop: 16,
  },
});
