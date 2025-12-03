import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Card, TextInput, Button, useTheme } from 'react-native-paper';
import { CategoryProgressBar } from '../../components/common/CategoryProgressBar';
import { SpendingCategory } from '../../types/insights';
import { Budget } from '../../types/insights';

interface BudgetsScreenProps {
  categories: SpendingCategory[];
  savedBudgets: Budget[];
  onSaveBudgets: (budgets: Array<{ category: string; limit: number }>) => Promise<void>;
}

export const BudgetsScreen: React.FC<BudgetsScreenProps> = ({
  categories,
  savedBudgets,
  onSaveBudgets,
}) => {
  const theme = useTheme();
  const [budgetLimits, setBudgetLimits] = useState<Map<string, string>>(
    new Map(
      savedBudgets.map((b) => [b.category, b.limit.toString()])
    )
  );
  const [saving, setSaving] = useState(false);

  // Merge saved budgets with spending categories
  const budgetMap = new Map(savedBudgets.map((b) => [b.category, b]));
  const categoriesWithBudgets = categories.map((cat) => ({
    ...cat,
    limit: budgetMap.get(cat.category)?.limit || cat.suggestedBudget || 0,
    spent: cat.amount,
  }));

  const handleBudgetChange = (category: string, value: string) => {
    const newLimits = new Map(budgetLimits);
    newLimits.set(category, value);
    setBudgetLimits(newLimits);
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);

      const budgetsToSave = Array.from(budgetLimits.entries())
        .map(([category, limitStr]) => ({
          category,
          limit: parseFloat(limitStr) || 0,
        }))
        .filter((b) => b.limit > 0);

      await onSaveBudgets(budgetsToSave);

      Alert.alert('Success', 'Budgets saved successfully!');
    } catch (error) {
      console.error('Failed to save budgets:', error);
      Alert.alert('Error', 'Failed to save budgets. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const totalBudget = categoriesWithBudgets.reduce((sum, cat) => sum + cat.limit, 0);
  const totalSpent = categoriesWithBudgets.reduce((sum, cat) => sum + cat.spent, 0);
  const overBudgetCount = categoriesWithBudgets.filter(
    (cat) => cat.spent > cat.limit
  ).length;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Summary Card */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Budget Overview
            </Text>

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  Total Budget
                </Text>
                <Text variant="titleLarge" style={styles.summaryValue}>
                  ${totalBudget.toFixed(2)}
                </Text>
              </View>

              <View style={styles.summaryItem}>
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  Total Spent
                </Text>
                <Text
                  variant="titleLarge"
                  style={[
                    styles.summaryValue,
                    totalSpent > totalBudget && styles.overBudgetText,
                  ]}
                >
                  ${totalSpent.toFixed(2)}
                </Text>
              </View>
            </View>

            {overBudgetCount > 0 && (
              <View style={[styles.warningBanner, { backgroundColor: '#FEE2E2' }]}>
                <Text style={{ color: '#991B1B', fontSize: 13 }}>
                  ⚠️ {overBudgetCount} {overBudgetCount === 1 ? 'category is' : 'categories are'} over budget
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Budget Categories */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Category Budgets
            </Text>

            {categoriesWithBudgets.length > 0 ? (
              categoriesWithBudgets.map((category, index) => {
                const currentLimit =
                  budgetLimits.get(category.category) ||
                  category.limit.toString();
                const limitNum = parseFloat(currentLimit) || 0;
                const percentage = limitNum > 0 ? (category.spent / limitNum) * 100 : 0;

                return (
                  <View key={`${category.category}-${index}`} style={styles.budgetItem}>
                    <View style={styles.budgetHeader}>
                      <Text style={styles.categoryLabel}>
                        {category.icon} {category.category}
                      </Text>
                      <Text
                        variant="bodySmall"
                        style={{ color: theme.colors.onSurfaceVariant }}
                      >
                        Spent: ${category.spent.toFixed(2)}
                      </Text>
                    </View>

                    <TextInput
                      label="Budget Limit"
                      mode="outlined"
                      value={currentLimit}
                      onChangeText={(value) =>
                        handleBudgetChange(category.category, value)
                      }
                      keyboardType="numeric"
                      left={<TextInput.Affix text="$" />}
                      dense
                      style={styles.input}
                    />

                    <CategoryProgressBar
                      label=""
                      amount={`${percentage.toFixed(0)}%`}
                      percentage={percentage}
                      color={category.color}
                      spent={category.spent}
                      limit={limitNum}
                    />
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
                  No spending data available.
                  {'\n'}
                  Link a bank account to set budgets.
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Save Button */}
      {categoriesWithBudgets.length > 0 && (
        <View style={[styles.footer, { backgroundColor: theme.colors.elevation.level2 }]}>
          <Button
            mode="contained"
            onPress={handleSaveAll}
            loading={saving}
            disabled={saving}
            style={styles.saveButton}
          >
            Save All Budgets
          </Button>
        </View>
      )}
    </View>
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
    marginBottom: 12,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontWeight: '700',
    marginTop: 4,
  },
  overBudgetText: {
    color: '#EF4444',
  },
  warningBanner: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  budgetItem: {
    marginBottom: 24,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  input: {
    marginBottom: 8,
  },
  emptyState: {
    paddingVertical: 32,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  saveButton: {
    paddingVertical: 4,
  },
  bottomSpacer: {
    height: 80,
  },
});
