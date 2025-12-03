import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import {
  Text,
  Card,
  TextInput,
  Button,
  Menu,
  useTheme,
  Divider,
  IconButton,
} from 'react-native-paper';
import { Goal } from '../../types/insights';
import { calculateGoalProgress, estimateMonthsToGoal } from '../../utils/insightsCalculations';

interface GoalsScreenProps {
  goals: Goal[];
  onSaveGoal: (goal: Omit<Goal, 'id' | 'userId'>) => Promise<void>;
  onDeleteGoal: (goalId: string) => Promise<void>;
}

const GOAL_TEMPLATES = [
  { label: 'Custom Goal', value: 'custom' },
  { label: 'Emergency Fund', value: 'Emergency Fund' },
  { label: 'Vacation', value: 'Vacation' },
  { label: 'New Car', value: 'New Car' },
  { label: 'Home Down Payment', value: 'Home Down Payment' },
  { label: 'Debt Payoff', value: 'Debt Payoff' },
  { label: 'Education', value: 'Education' },
];

export const GoalsScreen: React.FC<GoalsScreenProps> = ({
  goals,
  onSaveGoal,
  onDeleteGoal,
}) => {
  const theme = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('custom');

  // New goal form state
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [savedAmount, setSavedAmount] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [saving, setSaving] = useState(false);

  const handleTemplateSelect = (template: string) => {
    setSelectedTemplate(template);
    if (template !== 'custom') {
      setGoalName(template);
    }
    setMenuVisible(false);
  };

  const handleSaveGoal = async () => {
    if (!goalName.trim()) {
      Alert.alert('Validation Error', 'Please enter a goal name');
      return;
    }

    const target = parseFloat(targetAmount) || 0;
    const saved = parseFloat(savedAmount) || 0;
    const monthly = parseFloat(monthlyContribution) || 0;

    if (target <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid target amount');
      return;
    }

    try {
      setSaving(true);

      await onSaveGoal({
        name: goalName,
        target,
        saved,
        monthly,
      });

      // Reset form
      setGoalName('');
      setTargetAmount('');
      setSavedAmount('');
      setMonthlyContribution('');
      setSelectedTemplate('custom');

      Alert.alert('Success', 'Goal saved successfully!');
    } catch (error) {
      console.error('Failed to save goal:', error);
      Alert.alert('Error', 'Failed to save goal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGoal = async (goalId: string, goalName: string) => {
    Alert.alert(
      'Delete Goal',
      `Are you sure you want to delete "${goalName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDeleteGoal(goalId);
              Alert.alert('Success', 'Goal deleted successfully');
            } catch (error) {
              console.error('Failed to delete goal:', error);
              Alert.alert('Error', 'Failed to delete goal');
            }
          },
        },
      ]
    );
  };

  const totalSaved = goals.reduce((sum, goal) => sum + (Number(goal.saved) || 0), 0);
  const totalTarget = goals.reduce((sum, goal) => sum + (Number(goal.target) || 0), 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Summary Card */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Goals Summary
          </Text>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                Total Saved
              </Text>
              <Text variant="titleLarge" style={styles.summaryValue}>
                ${totalSaved.toFixed(2)}
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                Total Target
              </Text>
              <Text variant="titleLarge" style={styles.summaryValue}>
                ${totalTarget.toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBackground,
                { backgroundColor: theme.colors.surfaceVariant },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(overallProgress, 100)}%`,
                    backgroundColor: theme.colors.primary,
                  },
                ]}
              />
            </View>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}
            >
              {overallProgress.toFixed(1)}% of total goals
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Add New Goal Card */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Add New Goal
          </Text>

          {/* Goal Template Selector */}
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setMenuVisible(true)}
                style={styles.templateButton}
                icon="chevron-down"
                contentStyle={styles.templateButtonContent}
              >
                {GOAL_TEMPLATES.find((t) => t.value === selectedTemplate)
                  ?.label || 'Select Template'}
              </Button>
            }
          >
            {GOAL_TEMPLATES.map((template) => (
              <Menu.Item
                key={template.value}
                onPress={() => handleTemplateSelect(template.value)}
                title={template.label}
              />
            ))}
          </Menu>

          {/* Goal Form */}
          <TextInput
            label="Goal Name"
            mode="outlined"
            value={goalName}
            onChangeText={setGoalName}
            placeholder="e.g., Emergency Fund"
            style={styles.input}
          />

          <TextInput
            label="Target Amount"
            mode="outlined"
            value={targetAmount}
            onChangeText={setTargetAmount}
            keyboardType="numeric"
            left={<TextInput.Affix text="$" />}
            placeholder="10000"
            style={styles.input}
          />

          <TextInput
            label="Already Saved"
            mode="outlined"
            value={savedAmount}
            onChangeText={setSavedAmount}
            keyboardType="numeric"
            left={<TextInput.Affix text="$" />}
            placeholder="0"
            style={styles.input}
          />

          <TextInput
            label="Monthly Contribution"
            mode="outlined"
            value={monthlyContribution}
            onChangeText={setMonthlyContribution}
            keyboardType="numeric"
            left={<TextInput.Affix text="$" />}
            placeholder="500"
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={handleSaveGoal}
            loading={saving}
            disabled={saving}
            style={styles.addButton}
          >
            Add Goal
          </Button>
        </Card.Content>
      </Card>

      {/* Existing Goals */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Your Goals ({goals.length})
          </Text>

          {goals.length > 0 ? (
            goals.map((goal, index) => {
              const progress = calculateGoalProgress(goal.saved, goal.target);
              const monthsLeft = estimateMonthsToGoal(
                goal.saved,
                goal.target,
                goal.monthly
              );

              return (
                <View key={goal.id}>
                  <View style={styles.goalItem}>
                    <View style={styles.goalHeader}>
                      <Text variant="titleMedium" style={styles.goalName}>
                        {goal.name}
                      </Text>
                      <IconButton
                        icon="delete"
                        size={20}
                        onPress={() => handleDeleteGoal(goal.id, goal.name)}
                      />
                    </View>

                    <View style={styles.goalStats}>
                      <View style={styles.statItem}>
                        <Text
                          variant="bodySmall"
                          style={{ color: theme.colors.onSurfaceVariant }}
                        >
                          Saved
                        </Text>
                        <Text variant="bodyLarge" style={styles.statValue}>
                          ${(Number(goal.saved) || 0).toFixed(2)}
                        </Text>
                      </View>

                      <View style={styles.statItem}>
                        <Text
                          variant="bodySmall"
                          style={{ color: theme.colors.onSurfaceVariant }}
                        >
                          Target
                        </Text>
                        <Text variant="bodyLarge" style={styles.statValue}>
                          ${(Number(goal.target) || 0).toFixed(2)}
                        </Text>
                      </View>

                      <View style={styles.statItem}>
                        <Text
                          variant="bodySmall"
                          style={{ color: theme.colors.onSurfaceVariant }}
                        >
                          Monthly
                        </Text>
                        <Text variant="bodyLarge" style={styles.statValue}>
                          ${(Number(goal.monthly) || 0).toFixed(2)}
                        </Text>
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressContainer}>
                      <View
                        style={[
                          styles.progressBackground,
                          { backgroundColor: theme.colors.surfaceVariant },
                        ]}
                      >
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${Math.min(progress, 100)}%`,
                              backgroundColor: theme.colors.primary,
                            },
                          ]}
                        />
                      </View>
                      <View style={styles.progressInfo}>
                        <Text
                          variant="bodySmall"
                          style={{ color: theme.colors.onSurfaceVariant }}
                        >
                          {progress.toFixed(1)}% complete
                        </Text>
                        {monthsLeft > 0 && (
                          <Text
                            variant="bodySmall"
                            style={{ color: theme.colors.onSurfaceVariant }}
                          >
                            ~{monthsLeft} {monthsLeft === 1 ? 'month' : 'months'}{' '}
                            left
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>

                  {index < goals.length - 1 && (
                    <Divider style={styles.divider} />
                  )}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text
                variant="bodyMedium"
                style={{
                  color: theme.colors.onSurfaceVariant,
                  textAlign: 'center',
                }}
              >
                No goals yet. Add your first goal above!
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontWeight: '700',
    marginTop: 4,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBackground: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  templateButton: {
    marginBottom: 12,
  },
  templateButtonContent: {
    flexDirection: 'row-reverse',
  },
  input: {
    marginBottom: 12,
  },
  addButton: {
    marginTop: 8,
  },
  goalItem: {
    marginBottom: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalName: {
    fontWeight: '600',
  },
  goalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontWeight: '600',
    marginTop: 4,
  },
  divider: {
    marginVertical: 16,
  },
  emptyState: {
    paddingVertical: 32,
  },
  bottomSpacer: {
    height: 32,
  },
});
