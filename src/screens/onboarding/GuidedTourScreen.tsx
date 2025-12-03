import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { Text, Button, Surface, IconButton, useTheme, ProgressBar } from 'react-native-paper';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

interface TourStep {
  id: string;
  type?: 'intro' | 'complete';
  title: string;
  subtitle?: string;
  description: string;
  emoji: string;
  actions?: { label: string; primary?: boolean; skip?: boolean }[];
  progress?: number;
  features?: string[];
  location?: string;
  tip?: string;
  action?: string;
}

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'GuidedTour'>;
}

const { width } = Dimensions.get('window');

const GuidedTourScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const [currentStep, setCurrentStep] = useState(0);

  const tourSteps: TourStep[] = [
    {
      id: 'intro',
      type: 'intro',
      title: 'Welcome to Aspayr! 👋',
      subtitle: 'Start Your Journey',
      description: 'Discover how to make the most of your AI-powered banking assistant',
      emoji: '🚀',
      actions: [
        { label: "Let's go!", primary: true },
        { label: 'Skip tour', skip: true },
      ],
    },
    {
      id: 'step1',
      title: 'Connect Your Banks',
      progress: 14,
      emoji: '🏦',
      description: 'Link your bank accounts securely using the Open Banking standard.',
      features: [
        'Support for 1000+ financial institutions',
        'Secure OAuth2 authentication',
        'Both redirect and embedded auth flows',
        'Manage multiple bank connections',
      ],
      location: 'Link Bank tab',
      tip: 'You can connect multiple banks from different countries!',
    },
    {
      id: 'step2',
      title: 'View Your Accounts',
      progress: 28,
      emoji: '💳',
      description: 'Access all your accounts in one place with real-time data.',
      features: [
        'Real-time account balances',
        'Transaction history and search',
        'Multi-currency support',
        'Automatic data refresh every 5 minutes',
      ],
      location: 'Accounts tab',
      tip: 'Click on any account to see detailed balances and transactions!',
    },
    {
      id: 'step3',
      title: 'Financial Insights',
      progress: 42,
      emoji: '💡',
      description: 'Get smart insights about your spending and financial health.',
      features: [
        'Spending breakdown by category',
        'Income vs. expenses analysis',
        'Monthly spending trends',
        'Smart budgeting recommendations',
      ],
      location: 'Insights tab',
      tip: 'Check insights regularly to stay on top of your finances!',
    },
    {
      id: 'step4',
      title: 'Interactive Dashboards',
      progress: 56,
      emoji: '📊',
      description: 'Visualize your financial data with beautiful charts.',
      features: [
        'Spending by category pie chart',
        'Monthly trends line chart',
        'Top merchants analysis',
        'Export data to CSV',
      ],
      location: 'Dashboards tab',
      tip: 'Dashboards update automatically when you add new accounts!',
    },
    {
      id: 'step5',
      title: 'Make Payments',
      progress: 70,
      emoji: '💸',
      description: 'Initiate secure payments directly from the app.',
      features: [
        'Domestic and international payments',
        'IBAN-based transfers',
        'Payment status tracking',
        'Secure consent flow',
      ],
      location: 'Payments tab',
      tip: 'All payments require bank authorization for maximum security!',
    },
    {
      id: 'step6',
      title: 'AI Chat Assistants',
      progress: 84,
      emoji: '💬',
      description: 'Chat with specialized AI agents for personalized help.',
      features: [
        'Smart Router: Automatically picks the best agent',
        'Finance Planner: Budget and financial goals',
        'Spend Analyst: Analyze your spending patterns',
        'Forecast Guide: Financial predictions',
        'Support Desk: General assistance',
      ],
      location: 'Chat button (bottom right)',
      tip: 'The router agent can understand any question and route to specialists!',
    },
    {
      id: 'step7',
      title: 'Personalized Experience',
      progress: 100,
      emoji: '🎯',
      description: 'Complete your financial profile for better AI recommendations.',
      features: [
        'Tailored financial advice',
        'Personalized insights',
        'Budget recommendations',
        'Smart spending alerts',
      ],
      location: 'Profile → Financial Profile',
      tip: 'Update your profile anytime from the user menu!',
    },
    {
      id: 'complete',
      type: 'complete',
      title: "You're all set! 🎉",
      description: "You're ready to take control of your finances with Aspayr",
      emoji: '✨',
      action: 'Start Exploring',
    },
  ];

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    navigation.goBack();
  };

  const currentTourStep = tourSteps[currentStep];
  const totalFeatureSteps = tourSteps.length - 2; // Exclude intro and complete

  if (!currentTourStep) return null;

  // Intro screen
  if (currentTourStep.type === 'intro') {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Surface style={styles.card} elevation={4}>
          {/* Title Bar */}
          <View style={[styles.titleBar, { borderBottomColor: theme.colors.outlineVariant }]}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
              Aspayr Tour
            </Text>
            <Button mode="text" compact onPress={handleSkip}>
              Skip
            </Button>
          </View>

          {/* Content */}
          <View style={styles.introContent}>
            <View style={[styles.emojiContainerLarge, { backgroundColor: theme.colors.primaryContainer }]}>
              <Text style={styles.emojiLarge}>{currentTourStep.emoji}</Text>
            </View>

            <Text variant="headlineMedium" style={[styles.introTitle, { color: theme.colors.onSurface }]}>
              {currentTourStep.title}
            </Text>
            <Text variant="titleMedium" style={[styles.introSubtitle, { color: theme.colors.primary }]}>
              {currentTourStep.subtitle}
            </Text>
            <Text variant="bodyMedium" style={[styles.introDescription, { color: theme.colors.onSurfaceVariant }]}>
              {currentTourStep.description}
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.introActions}>
            <Button
              mode="contained"
              onPress={handleNext}
              style={styles.primaryButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              {currentTourStep.actions?.[0].label}
            </Button>
            <Button
              mode="text"
              onPress={handleSkip}
              style={styles.skipButton}
            >
              {currentTourStep.actions?.[1].label}
            </Button>
          </View>

          {/* Progress indicator */}
          <View style={styles.progressDots}>
            {[...Array(3)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  i === 0
                    ? { width: 32, backgroundColor: theme.colors.primary }
                    : { width: 6, backgroundColor: theme.colors.outlineVariant },
                ]}
              />
            ))}
          </View>
        </Surface>
      </View>
    );
  }

  // Complete screen
  if (currentTourStep.type === 'complete') {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Surface style={styles.card} elevation={4}>
          {/* Title Bar */}
          <View style={[styles.titleBar, { borderBottomColor: theme.colors.outlineVariant }]}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
              Aspayr Tour
            </Text>
            <View style={{ width: 48 }} />
          </View>

          {/* Content */}
          <View style={styles.completeContent}>
            <View style={[styles.completeEmojiContainer, { backgroundColor: theme.colors.primaryContainer }]}>
              <Text style={styles.completeEmoji}>{currentTourStep.emoji}</Text>
            </View>

            <Text variant="headlineSmall" style={[styles.completeTitle, { color: theme.colors.onSurface }]}>
              {currentTourStep.title}
            </Text>
            <Text
              variant="bodyMedium"
              style={[styles.completeDescription, { color: theme.colors.onSurfaceVariant }]}
            >
              {currentTourStep.description}
            </Text>

            <Button
              mode="contained"
              onPress={handleComplete}
              style={styles.completeButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              {currentTourStep.action}
            </Button>
          </View>

          {/* Full progress bar */}
          <View style={styles.fullProgressContainer}>
            <View style={[styles.fullProgressBar, { backgroundColor: theme.colors.primary }]} />
          </View>
        </Surface>
      </View>
    );
  }

  // Feature screens
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Surface style={styles.featureCard} elevation={4}>
        {/* Title Bar */}
        <View style={[styles.titleBar, { borderBottomColor: theme.colors.outlineVariant }]}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={handleBack}
            iconColor={theme.colors.primary}
          />
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
            Aspayr Tour
          </Text>
          <Button mode="text" compact onPress={handleSkip}>
            Skip
          </Button>
        </View>

        {/* Scrollable Content */}
        <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}>
          {/* Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                Step {currentStep} of {totalFeatureSteps}
              </Text>
              <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
                {currentTourStep.progress}%
              </Text>
            </View>
            <ProgressBar
              progress={(currentTourStep.progress || 0) / 100}
              color={theme.colors.primary}
              style={styles.progressBar}
            />
          </View>

          {/* Feature Content */}
          <View style={styles.featureHeader}>
            <Text style={styles.featureEmoji}>{currentTourStep.emoji}</Text>
            <View style={styles.featureHeaderText}>
              <Text variant="titleLarge" style={[styles.featureTitle, { color: theme.colors.onSurface }]}>
                {currentTourStep.title}
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {currentTourStep.description}
              </Text>
              <View style={[styles.locationBadge, { backgroundColor: theme.colors.primaryContainer }]}>
                <Text style={styles.locationIcon}>📍</Text>
                <Text variant="labelSmall" style={{ color: theme.colors.primary }}>
                  {currentTourStep.location}
                </Text>
              </View>
            </View>
          </View>

          {/* Features List */}
          <Surface style={[styles.featuresContainer, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
            <Text variant="titleSmall" style={[styles.featuresTitle, { color: theme.colors.onSurface }]}>
              Key Features:
            </Text>
            {currentTourStep.features?.map((feature, idx) => (
              <View key={idx} style={styles.featureItem}>
                <Text style={{ color: theme.colors.primary }}>✓</Text>
                <Text variant="bodySmall" style={[styles.featureText, { color: theme.colors.onSurfaceVariant }]}>
                  {feature}
                </Text>
              </View>
            ))}
          </Surface>

          {/* Tip */}
          <View style={[styles.tipContainer, { backgroundColor: theme.colors.primaryContainer }]}>
            <View style={[styles.tipBorder, { backgroundColor: theme.colors.primary }]} />
            <View style={styles.tipContent}>
              <Text style={styles.tipIcon}>💡</Text>
              <View style={styles.tipTextContainer}>
                <Text variant="labelSmall" style={[styles.tipLabel, { color: theme.colors.primary }]}>
                  Pro Tip
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {currentTourStep.tip}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Navigation - Fixed at bottom */}
        <View style={[styles.navigationContainer, { borderTopColor: theme.colors.outlineVariant }]}>
          <Button
            mode="contained"
            onPress={handleNext}
            style={styles.nextButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            Next →
          </Button>

          {/* Progress dots */}
          <View style={styles.progressDots}>
            {[...Array(totalFeatureSteps)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  i < currentStep
                    ? { width: 32, backgroundColor: theme.colors.primary }
                    : { width: 6, backgroundColor: theme.colors.outlineVariant },
                ]}
              />
            ))}
          </View>
        </View>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
  },
  featureCard: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '95%',
    borderRadius: 24,
    overflow: 'hidden',
    flex: 1,
  },
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  introContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  emojiContainerLarge: {
    width: 128,
    height: 128,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    transform: [{ rotate: '-6deg' }],
  },
  emojiLarge: {
    fontSize: 56,
  },
  introTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  introSubtitle: {
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  introDescription: {
    textAlign: 'center',
    maxWidth: 280,
  },
  introActions: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 8,
  },
  primaryButton: {
    borderRadius: 28,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonLabel: {
    fontWeight: '600',
    fontSize: 16,
  },
  skipButton: {
    marginTop: 4,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 24,
  },
  progressDot: {
    height: 4,
    borderRadius: 2,
  },
  completeContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 64,
  },
  completeEmojiContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  completeEmoji: {
    fontSize: 48,
  },
  completeTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  completeDescription: {
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 32,
  },
  completeButton: {
    width: '100%',
    borderRadius: 28,
  },
  fullProgressContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  fullProgressBar: {
    height: 4,
    borderRadius: 2,
    width: '100%',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 16,
  },
  progressSection: {
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  featureHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  featureEmoji: {
    fontSize: 48,
  },
  featureHeaderText: {
    flex: 1,
    gap: 8,
  },
  featureTitle: {
    fontWeight: 'bold',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  locationIcon: {
    fontSize: 12,
  },
  featuresContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  featuresTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  featureText: {
    flex: 1,
  },
  tipContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: 16,
  },
  tipBorder: {
    width: 4,
  },
  tipContent: {
    flex: 1,
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  tipIcon: {
    fontSize: 18,
  },
  tipTextContainer: {
    flex: 1,
  },
  tipLabel: {
    fontWeight: '600',
    marginBottom: 4,
  },
  navigationContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  nextButton: {
    borderRadius: 28,
    marginBottom: 16,
  },
});

export default GuidedTourScreen;
