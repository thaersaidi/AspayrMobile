import React from 'react';
import { View, StyleSheet, Image, ScrollView } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/navigation';
import { Button } from '../../components/common/Button';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.logoContainer}>
        <Text
          style={[
            styles.logo,
            { color: theme.colors.primary },
          ]}
        >
          Aspayr
        </Text>
        <Text style={[styles.tagline, { color: theme.colors.onSurface }]}>
          Banking + AI Financial Assistant
        </Text>
      </View>

      <View style={styles.features}>
        <FeatureItem
          icon="🏦"
          title="Multi-Bank Integration"
          description="Link accounts from 200+ financial institutions"
        />
        <FeatureItem
          icon="🤖"
          title="AI-Powered Insights"
          description="Intelligent financial advice and analysis"
        />
        <FeatureItem
          icon="📊"
          title="Visual Dashboards"
          description="Charts and graphs for your financial data"
        />
        <FeatureItem
          icon="🔒"
          title="Secure & Private"
          description="Bank-level encryption and biometric auth"
        />
      </View>

      <View style={styles.actions}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Login')}
          style={styles.button}
        >
          Sign In
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('Register')}
          style={styles.button}
        >
          Create Account
        </Button>
      </View>
    </ScrollView>
  );
};

const FeatureItem: React.FC<{
  icon: string;
  title: string;
  description: string;
}> = ({ icon, title, description }) => {
  const theme = useTheme();

  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <View style={styles.featureText}>
        <Text
          style={[styles.featureTitle, { color: theme.colors.onSurface }]}
        >
          {title}
        </Text>
        <Text
          style={[
            styles.featureDescription,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          {description}
        </Text>
      </View>
    </View>
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
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  features: {
    flex: 1,
    justifyContent: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  featureIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    marginTop: 40,
  },
  button: {
    marginBottom: 12,
  },
});
