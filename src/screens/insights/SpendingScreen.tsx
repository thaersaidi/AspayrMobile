import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button, useTheme } from 'react-native-paper';
import { CircularProgress } from '../../components/common/CircularProgress';
import { CategoryProgressBar } from '../../components/common/CategoryProgressBar';
import { SpendingCategory } from '../../types/insights';

interface SpendingScreenProps {
  totalSpent: number;
  budgetLimit: number;
  categories: SpendingCategory[];
  onGetInsights?: () => void;
}

export const SpendingScreen: React.FC<SpendingScreenProps> = ({
  totalSpent,
  budgetLimit,
  categories,
  onGetInsights,
}) => {
  const theme = useTheme();
  const percentage = budgetLimit > 0 ? (totalSpent / budgetLimit) * 100 : 0;
  const topCategories = categories.slice(0, 8);

  // Adjust font size based on amount length to fit in circle
  const amountString = totalSpent.toFixed(2);
  const getFontSize = () => {
    if (amountString.length > 12) return 20;
    if (amountString.length > 10) return 24;
    return 28;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Total Spent Card */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content style={styles.cardContent}>
          <CircularProgress percentage={percentage} size={180} strokeWidth={12}>
            <View style={styles.circleContent}>
              <Text
                style={[styles.totalAmount, { fontSize: getFontSize() }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                ${totalSpent.toFixed(2)}
              </Text>
              <Text
                variant="bodySmall"
                style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
              >
                Total Spent
              </Text>
              <Text
                variant="bodySmall"
                style={[styles.percentage, { color: theme.colors.onSurfaceVariant }]}
              >
                {percentage.toFixed(0)}% Used
              </Text>
            </View>
          </CircularProgress>

          <View style={styles.budgetInfo}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Monthly Budget
            </Text>
            <Text variant="titleMedium" style={styles.budgetAmount}>
              ${budgetLimit.toFixed(2)}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Top Categories Card */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Top Categories
            </Text>
            <Text
              variant="bodySmall"
              style={[styles.monthLink, { color: theme.colors.primary }]}
            >
              Month →
            </Text>
          </View>

          {topCategories.length > 0 ? (
            topCategories.map((category, index) => (
              <CategoryProgressBar
                key={`${category.category}-${index}`}
                label={category.category}
                amount={`$${category.amount.toFixed(2)}`}
                count={category.count}
                percentage={category.percentage}
                color={category.color}
                icon={category.icon}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
              >
                No spending data available.
                {'\n'}
                Link a bank account to see your spending insights.
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Budget Insights Button */}
      {onGetInsights && (
        <Button
          mode="contained"
          onPress={onGetInsights}
          style={styles.insightsButton}
          icon="lightbulb-on"
        >
          Get Budget Insights
        </Button>
      )}

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
  cardContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  circleContent: {
    alignItems: 'center',
    maxWidth: 140,
  },
  totalAmount: {
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
    width: 140,
  },
  subtitle: {
    marginBottom: 4,
  },
  percentage: {
    fontSize: 12,
  },
  budgetInfo: {
    alignItems: 'center',
    marginTop: 16,
  },
  budgetAmount: {
    fontWeight: '600',
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  monthLink: {
    fontWeight: '500',
  },
  emptyState: {
    paddingVertical: 32,
  },
  insightsButton: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  bottomSpacer: {
    height: 32,
  },
});
