import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/navigation';
import { NumericKeypad } from '../../components/auth/NumericKeypad';
import { authApi } from '../../api';
import { secureStorage, userStorage } from '../../utils/storage';

type Props = NativeStackScreenProps<AuthStackParamList, 'PINSetup'>;

export const PINSetupScreen: React.FC<Props> = ({ navigation, route }) => {
  const theme = useTheme();
  const { email, isNewUser } = route.params;
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePinPress = (value: string) => {
    setError('');

    if (step === 'create') {
      if (pin.length < 6) {
        setPin(pin + value);
        if (pin.length === 5) {
          // Move to confirm step
          setTimeout(() => setStep('confirm'), 300);
        }
      }
    } else {
      if (confirmPin.length < 6) {
        const newConfirmPin = confirmPin + value;
        setConfirmPin(newConfirmPin);

        if (newConfirmPin.length === 6) {
          // Check if PINs match
          setTimeout(() => validateAndCreatePin(newConfirmPin), 300);
        }
      }
    }
  };

  const handleDelete = () => {
    setError('');

    if (step === 'create') {
      setPin(pin.slice(0, -1));
    } else {
      setConfirmPin(confirmPin.slice(0, -1));
    }
  };

  const validateAndCreatePin = async (confirmedPin: string) => {
    if (pin !== confirmedPin) {
      setError('PINs do not match. Please try again.');
      setPin('');
      setConfirmPin('');
      setStep('create');
      return;
    }

    setLoading(true);

    try {
      // Create user with temporary password in Yapily
      const { userUuid, user } = await authApi.createOrLoginUser(email, pin);

      // Save PIN securely in Keychain
      await secureStorage.setPIN(userUuid, pin);

      // Create PIN in backend database
      await authApi.createPin(userUuid, pin, email);

      // Save user data
      await userStorage.setUser({
        userUuid,
        userDetails: user,
        username: email,
      });

      // Mark session as verified
      // sessionStorage equivalent in RN would need AsyncStorage
      await userStorage.set('aspayr_session_verified', 'true');

      console.log('[PINSetup] PIN created successfully, navigating to main app');
      setLoading(false);

      // Force reload the app to re-check auth status
      // For web, reload the page to trigger AppNavigator auth check
      if (typeof window !== 'undefined' && window.location) {
        window.location.reload();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create PIN');
      setLoading(false);
    }
  };

  const renderPinDots = (currentPin: string) => {
    return (
      <View style={styles.pinDotsContainer}>
        {[...Array(6)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.pinDot,
              {
                backgroundColor:
                  index < currentPin.length
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
          {step === 'create' ? 'Create Your PIN' : 'Confirm Your PIN'}
        </Text>
        <Text
          style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
        >
          {step === 'create'
            ? 'Enter a 6-digit PIN for secure access'
            : 'Enter your PIN again to confirm'}
        </Text>
      </View>

      {renderPinDots(step === 'create' ? pin : confirmPin)}

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
          Creating your account...
        </Text>
      )}
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
});
