import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Text, useTheme, ProgressBar } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../types/navigation';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { storageApi } from '../../api';
import { userStorage } from '../../utils/storage';

type Props = NativeStackScreenProps<MainStackParamList, 'OnboardingQuiz'>;

interface QuizOption {
  emoji: string;
  label: string;
}

interface QuizQuestion {
  id: string;
  type?: 'intro' | 'complete' | 'question';
  title: string;
  subtitle?: string;
  description?: string;
  question?: string;
  progress?: number;
  options?: QuizOption[];
  actions?: { label: string; primary?: boolean; skip?: boolean }[];
  action?: string;
}

const questions: QuizQuestion[] = [
  {
    id: 'intro',
    type: 'intro',
    title: 'Hey👋',
    subtitle: "Let's quiz you a bit",
    description: 'This will help us customize your account to best suit you',
    actions: [
      { label: 'Yes. Quiz me!', primary: true },
      { label: 'Skip, will do it later', skip: true },
    ],
  },
  {
    id: 'q1',
    type: 'question',
    title: "Let's get started",
    progress: 20,
    question: 'I track my monthly expenses and create a budget...',
    options: [
      { emoji: '📅', label: 'Regularly' },
      { emoji: '🔵', label: 'Occasionally' },
      { emoji: '👤', label: 'People still create personal budgets?' },
      { emoji: '🙅', label: 'Rarely' },
    ],
  },
  {
    id: 'q2',
    type: 'question',
    title: "There's progress!",
    progress: 40,
    question: 'Do you have any outstanding debts?...',
    options: [
      { emoji: '🏊', label: "I'm drowning in debt" },
      { emoji: '✅', label: "Yes, but it's under control" },
      { emoji: '🚫', label: 'No outstanding debts' },
      { emoji: '⚠️', label: 'Trust me, you do not want to know' },
    ],
  },
  {
    id: 'q3',
    type: 'question',
    title: "There's progress!",
    progress: 60,
    question: 'How often do you seek financial advice?...',
    options: [
      { emoji: '🔵', label: 'Frequently' },
      { emoji: '🔴', label: 'Occasionally' },
      { emoji: '🔴', label: 'Rarely' },
      { emoji: '❌', label: 'Never' },
    ],
  },
  {
    id: 'q4',
    type: 'question',
    title: 'Great! Half way...',
    progress: 50,
    question: 'How often do you participate in financial forums?...',
    options: [
      { emoji: '🔵', label: 'Frequently' },
      { emoji: '👤', label: 'Occasionally' },
      { emoji: '🔴', label: 'Rarely' },
      { emoji: '👥', label: 'People do that?' },
    ],
  },
  {
    id: 'q5',
    type: 'question',
    title: 'Great! close...',
    progress: 70,
    question: 'How do you monitor your monthly expenses?...',
    options: [
      { emoji: '📱', label: 'I use a budget app or software' },
      { emoji: '✍️', label: 'I manually write down my expenses' },
      { emoji: '🚫', label: "I don't monitor my expenses" },
    ],
  },
  {
    id: 'q6',
    type: 'question',
    title: 'Great! close...',
    progress: 85,
    question: 'Primarily, my financial goals revolve around?...',
    options: [
      { emoji: '🏠', label: 'Saving for a house' },
      { emoji: '🎓', label: 'Paying off student loans' },
      { emoji: '💰', label: 'Building an emergency fund' },
      { emoji: '🏖️', label: 'Saving for retirement' },
    ],
  },
  {
    id: 'q7',
    type: 'question',
    title: 'One more!',
    progress: 90,
    question: 'When it comes to financial literacy, I consider myself to be...',
    options: [
      { emoji: '🥷', label: 'Ninja level' },
      { emoji: '😊', label: "I try, at least I am conscious about it" },
      { emoji: '💡', label: 'No idea what you are talking about' },
    ],
  },
  {
    id: 'q8',
    type: 'question',
    title: 'One more!',
    progress: 95,
    question: 'Currently I am?...',
    options: [
      { emoji: '💼', label: 'Employed, full-time' },
      { emoji: '⏰', label: 'Employed, part-time' },
      { emoji: '💰', label: 'Self-employed' },
      { emoji: '🎓', label: 'A student' },
      { emoji: '🏖️', label: 'Retired' },
      { emoji: '🔴', label: 'Unemployed' },
    ],
  },
  {
    id: 'q9',
    type: 'question',
    title: '...And we done!',
    progress: 100,
    question: 'In a good year I make...',
    options: [
      { emoji: '💵', label: 'Less than $20,000' },
      { emoji: '💵💵', label: '$20,000 - $40,000' },
      { emoji: '💵💵💵', label: '$40,000 - $60,000' },
      { emoji: '💵💵💵💵', label: '$60,000 - $80,000' },
      { emoji: '💵💵💵💵💵', label: 'Over $80,000' },
    ],
  },
  {
    id: 'complete',
    type: 'complete',
    title: 'We making progress!',
    description: 'Your account will be customized to better suit you',
    action: 'Continue',
  },
];

export const OnboardingQuizScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const currentQuestion = questions[currentStep];

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers({ ...answers, [questionId]: answer });

    // Move to next step
    if (currentStep < questions.length - 1) {
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, 300);
    }
  };

  const handleSkip = async () => {
    await completeOnboarding({});
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = async (quizAnswers: Record<string, string>) => {
    setLoading(true);
    try {
      // Get user data
      const userData = await userStorage.getUser() as { userUuid?: string; username?: string } | null;
      if (userData?.userUuid) {
        // Save onboarding data to backend
        await storageApi.saveOnboardingData(userData.userUuid, {
          quizAnswers: quizAnswers,
          completedAt: new Date().toISOString(),
          quizVersion: '1.0',
          username: userData.username || '',
        });
      }

      // Mark onboarding as completed locally
      await userStorage.setOnboardingCompleted(true);

      // Navigate back to dashboard
      navigation.goBack();
    } catch (error) {
      console.error('[Onboarding] Error saving quiz data:', error);
      // Still mark as completed locally
      await userStorage.setOnboardingCompleted(true);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const renderProgressDots = () => {
    const totalDots = 10;
    return (
      <View style={styles.progressDots}>
        {[...Array(totalDots)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              {
                width: i <= currentStep - 1 ? 24 : 6,
                backgroundColor:
                  i <= currentStep - 1
                    ? theme.colors.primary
                    : theme.colors.surfaceVariant,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  // Intro screen
  if (currentQuestion.type === 'intro') {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
              Onboarding Quiz
            </Text>
            <TouchableOpacity onPress={handleSkip}>
              <Text style={{ color: theme.colors.primary }}>Skip</Text>
            </TouchableOpacity>
          </View>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <View
              style={[
                styles.iconBox,
                { backgroundColor: theme.colors.primaryContainer },
              ]}
            >
              <Text style={styles.iconEmoji}>📋</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            {currentQuestion.title}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.primary }]}>
            {currentQuestion.subtitle}
          </Text>
          <Text
            style={[
              styles.description,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {currentQuestion.description}
          </Text>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              mode="contained"
              onPress={() => setCurrentStep(currentStep + 1)}
              style={styles.primaryButton}
            >
              {currentQuestion.actions?.[0].label}
            </Button>
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={{ color: theme.colors.primary }}>
                {currentQuestion.actions?.[1].label}
              </Text>
            </TouchableOpacity>
          </View>

          {renderProgressDots()}
        </View>
      </View>
    );
  }

  // Complete screen
  if (currentQuestion.type === 'complete') {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
              Onboarding Quiz
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <View
              style={[
                styles.successIcon,
                { backgroundColor: theme.colors.primaryContainer },
              ]}
            >
              <Text style={styles.checkmark}>✓</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            {currentQuestion.title}
          </Text>
          <Text
            style={[
              styles.description,
              { color: theme.colors.onSurfaceVariant, marginTop: 16 },
            ]}
          >
            {currentQuestion.description}
          </Text>

          {/* Continue Button */}
          <Button
            mode="contained"
            onPress={() => completeOnboarding(answers)}
            loading={loading}
            disabled={loading}
            style={[styles.primaryButton, { marginTop: 32 }]}
          >
            {currentQuestion.action}
          </Button>

          {/* Full progress bar */}
          <View style={styles.fullProgressContainer}>
            <View
              style={[
                styles.fullProgressBar,
                { backgroundColor: theme.colors.primary },
              ]}
            />
          </View>
        </View>
      </View>
    );
  }

  // Question screens
  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={[styles.backArrow, { color: theme.colors.primary }]}>
            ←
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
          Onboarding Quiz
        </Text>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={{ color: theme.colors.primary }}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress */}
        <View style={styles.progressSection}>
          <Text style={[styles.progressTitle, { color: theme.colors.onSurface }]}>
            {currentQuestion.title}
          </Text>
          <ProgressBar
            progress={(currentQuestion.progress || 0) / 100}
            color={theme.colors.primary}
            style={styles.progressBar}
          />
        </View>

        {/* Question */}
        <Text
          style={[styles.questionText, { color: theme.colors.onSurface }]}
        >
          {currentQuestion.question}
        </Text>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options?.map((option, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleAnswer(currentQuestion.id, option.label)}
              style={[
                styles.optionButton,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.outline,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={styles.optionEmoji}>{option.emoji}</Text>
              <Text
                style={[styles.optionLabel, { color: theme.colors.onSurface }]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {renderProgressDots()}
      </ScrollView>
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    padding: 8,
  },
  backArrow: {
    fontSize: 24,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  iconBox: {
    width: 120,
    height: 120,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '-6deg' }],
  },
  iconEmoji: {
    fontSize: 56,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 280,
  },
  actions: {
    width: '100%',
    marginTop: 32,
    alignItems: 'center',
  },
  primaryButton: {
    width: '100%',
    borderRadius: 24,
    paddingVertical: 4,
  },
  skipButton: {
    marginTop: 16,
    padding: 8,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    gap: 6,
  },
  progressDot: {
    height: 4,
    borderRadius: 2,
  },
  progressSection: {
    marginBottom: 24,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  questionText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    gap: 12,
  },
  optionEmoji: {
    fontSize: 24,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  fullProgressContainer: {
    marginTop: 32,
    width: '80%',
    alignSelf: 'center',
  },
  fullProgressBar: {
    height: 4,
    borderRadius: 2,
    width: '100%',
  },
});

export default OnboardingQuizScreen;
