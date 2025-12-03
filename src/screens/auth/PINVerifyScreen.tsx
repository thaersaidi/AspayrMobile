import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/navigation';
import { NumericKeypad } from '../../components/auth/NumericKeypad';
import { authApi } from '../../api';
import { secureStorage, userStorage } from '../../utils/storage';
import { Button } from '../../components/common/Button';

type Props = NativeStackScreenProps<AuthStackParamList, 'PINVerify'>;

export const PINVerifyScreen: React.FC<Props> = ({ navigation, route }) => {
  const theme = useTheme();
  const { email } = route.params;
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePinPress = (value: string) => {
    setError('');

    if (pin.length < 6) {
      const newPin = pin + value;
      setPin(newPin);

      if (newPin.length === 6) {
        // Verify PIN
        setTimeout(() => verifyPin(newPin), 300);
      }
    }
  };

  const handleDelete = () => {
    setError('');
    setPin(pin.slice(0, -1));
  };

  const verifyPin = async (enteredPin: string) => {
    setLoading(true);

    try {
      // Get user data
      const { exists, userUuid } = await authApi.checkUserExists(email);

      if (!exists || !userUuid) {
        setError('User not found');
        setPin('');
        setLoading(false);
        return;
      }

      // Verify PIN - throws on failure (401/404/500), returns { success: true } on success
      try {
        await authApi.verifyPin(userUuid, enteredPin);
      } catch (pinError: any) {
        // Extract error message from response if available
        const errorMessage = pinError.response?.data?.error || 'Incorrect PIN. Please try again.';
        console.log('[PINVerify] PIN verification failed:', errorMessage);
        setError(errorMessage);
        setPin('');
        setLoading(false);
        return;
      }

      // PIN is correct, login user
      const { user } = await authApi.getUser(userUuid);

      // Save user data
      await userStorage.setUser({
        userUuid,
        userDetails: user,
        username: email,
      });

      // Mark session as verified
      await userStorage.set('aspayr_session_verified', 'true');

      console.log('[PINVerify] PIN verified successfully, navigating to main app');
      setLoading(false);
      
      // Force reload the app to re-check auth status
      // This will trigger AppNavigator to check AsyncStorage again
      navigation.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      });
      
      // Alternative: Reload the entire app to trigger AppNavigator auth check
      // For web, we can reload the page
      if (typeof window !== 'undefined' && window.location) {
        window.location.reload();
      }
    } catch (err: any) {
      console.error('[PINVerify] Verification error:', err);
      setError(err.message || 'Verification failed');
      setPin('');
      setLoading(false);
    }
  };

  const renderPinDots = () => {
    return (
      <View style={styles.pinDotsContainer}>
        {[...Array(6)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.pinDot,
              {
                backgroundColor:
                  index < pin.length
                    ? theme.colors.primary
                    : theme.colors.surfaceVariant,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
          Enter Your PIN
        </Text>
        <Text
          style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
        >
          {email}
        </Text>
      </View>

      {renderPinDots()}

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

      <NumericKeypad
        onPress={handlePinPress}
        onDelete={handleDelete}
        disabled={loading}
      />

      {loading && (
        <Text
          style={[
            styles.loadingText,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          Verifying...
        </Text>
      )}

      <Button
        mode="text"
        onPress={() => navigation.navigate('Login')}
        disabled={loading}
        style={styles.backButton}
      >
        Back to Login
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: 40,
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  pinDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 40,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  errorBox: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 16,
    alignItems: 'center',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 16,
  },
  backButton: {
    marginTop: 24,
  },
});
