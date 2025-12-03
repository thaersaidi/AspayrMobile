import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/navigation';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { authApi } from '../../api';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export const RegisterScreen: React.FC<Props> = ({ navigation, route }) => {
  const theme = useTheme();
  const [email, setEmail] = useState(route.params?.email || '');
  const [displayName, setDisplayName] = useState(route.params?.displayName || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const provider = route.params?.provider || null;

  const handleRegister = async () => {
    if (!email || !displayName) {
      setError('Please enter your email and name');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check if user already exists
      const { exists } = await authApi.checkUserExists(email);

      if (exists) {
        setError('Account already exists. Please sign in.');
        setLoading(false);
        return;
      }

      // User doesn't exist, proceed to PIN setup
      navigation.navigate('PINSetup', { email, isNewUser: true });
    } catch (err: any) {
      setError(err.message || 'Registration failed');
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
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            Create Account
          </Text>
          <Text
            style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            Join Aspayr to manage your finances
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
            label="Full Name"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="John Doe"
            disabled={loading}
            autoCapitalize="words"
          />

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            disabled={loading}
            style={styles.input}
          />

          <Text
            style={[styles.infoText, { color: theme.colors.onSurfaceVariant }]}
          >
            You'll create a 6-digit PIN in the next step for secure access
          </Text>

          <Button
            mode="contained"
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Continue
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate('Login')}
            disabled={loading}
            style={styles.linkButton}
          >
            Already have an account? Sign in
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
  infoText: {
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  button: {
    marginTop: 8,
  },
  linkButton: {
    marginTop: 16,
  },
});
