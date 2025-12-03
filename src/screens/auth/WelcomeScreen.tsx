import React from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/navigation';
import { Logo } from '../../components/common/Logo';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();

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
                  <Text style={styles.mockupText}>💰</Text>
                  <Text style={[styles.mockupAmount, { color: theme.colors.primary }]}>$20,000.00</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Progress indicator */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressDot, styles.progressDotActive, { backgroundColor: theme.colors.primary }]} />
            <View style={[styles.progressDot, { backgroundColor: theme.colors.surfaceVariant }]} />
            <View style={[styles.progressDot, { backgroundColor: theme.colors.surfaceVariant }]} />
          </View>

          {/* Main content */}
          <View style={styles.content}>
            <Text style={[styles.title, { color: theme.colors.onSurface }]}>
              Your Money, Your Way
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              Take control of your finances with Aspayr
            </Text>
          </View>
        </ScrollView>

        {/* Continue button - fixed at bottom */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={[styles.continueButtonText, { color: theme.colors.onPrimary }]}>
              Continue
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
  mockupAmount: {
    fontSize: 32,
    fontWeight: 'bold',
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
  },
  continueButton: {
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
