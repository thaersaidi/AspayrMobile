import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Chip, useTheme, Divider } from 'react-native-paper';
import { RecurringExpense } from '../../types/insights';
import { formatDate } from '../../utils/formatters';

interface RecurringScreenProps {
  recurringExpenses: RecurringExpense[];
}

export const RecurringScreen: React.FC<RecurringScreenProps> = ({
  recurringExpenses,
}) => {
  const theme = useTheme();

  const totalMonthly = recurringExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Summary Card */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Recurring Expenses Summary
          </Text>

          <View style={styles.summaryBox}>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Total Monthly Recurring
            </Text>
            <Text variant="displaySmall" style={styles.totalAmount}>
              ${totalMonthly.toFixed(2)}
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}
            >
              {recurringExpenses.length} recurring{' '}
              {recurringExpenses.length === 1 ? 'expense' : 'expenses'} detected
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Recurring Expenses List */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Detected Recurring Expenses
          </Text>

          {recurringExpenses.length > 0 ? (
            recurringExpenses.map((expense, index) => (
              <View key={`${expense.merchant}-${index}`}>
                <View style={styles.expenseItem}>
                  <View style={styles.expenseHeader}>
                    <View style={styles.merchantInfo}>
                      <Text style={styles.icon}>{expense.categoryIcon}</Text>
                      <View style={styles.textContainer}>
                        <Text variant="bodyLarge" style={styles.merchantName}>
                          {expense.merchant}
                        </Text>
                        <Chip
                          mode="outlined"
                          compact
                          style={[
                            styles.categoryChip,
                            { borderColor: expense.categoryColor },
                          ]}
                          textStyle={{ fontSize: 11, textAlign: 'center' }}
                        >
                          {expense.category}
                        </Chip>
                      </View>
                    </View>

                    <View style={styles.amountContainer}>
                      <Text variant="titleMedium" style={styles.amount}>
                        ${expense.amount.toFixed(2)}
                      </Text>
                      <Text
                        variant="bodySmall"
                        style={{ color: theme.colors.onSurfaceVariant }}
                      >
                        /month
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                      <Text
                        variant="bodySmall"
                        style={{ color: theme.colors.onSurfaceVariant }}
                      >
                        Frequency
                      </Text>
                      <Text variant="bodyMedium" style={styles.detailValue}>
                        {expense.frequency}x
                      </Text>
                    </View>

                    <View style={styles.detailItem}>
                      <Text
                        variant="bodySmall"
                        style={{ color: theme.colors.onSurfaceVariant }}
                      >
                        Next Expected
                      </Text>
                      <Text variant="bodyMedium" style={styles.detailValue}>
                        {formatDate(expense.nextDate)}
                      </Text>
                    </View>
                  </View>

                  {/* Transaction History */}
                  <View style={styles.historyContainer}>
                    <Text
                      variant="bodySmall"
                      style={[
                        styles.historyTitle,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                    >
                      Recent Transactions:
                    </Text>
                    {expense.transactions.slice(0, 3).map((tx, txIndex) => (
                      <View key={tx.id} style={styles.historyItem}>
                        <Text
                          variant="bodySmall"
                          style={{ color: theme.colors.onSurfaceVariant }}
                        >
                          {formatDate(tx.date)}
                        </Text>
                        <Text
                          variant="bodySmall"
                          style={{ color: theme.colors.onSurfaceVariant }}
                        >
                          ${tx.amount.toFixed(2)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                {index < recurringExpenses.length - 1 && (
                  <Divider style={styles.divider} />
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text
                variant="bodyLarge"
                style={{
                  color: theme.colors.onSurfaceVariant,
                  textAlign: 'center',
                  marginBottom: 8,
                }}
              >
                No Recurring Expenses Detected
              </Text>
              <Text
                variant="bodyMedium"
                style={{
                  color: theme.colors.onSurfaceVariant,
                  textAlign: 'center',
                }}
              >
                We look for merchants with 2+ transactions with similar amounts across different months.
                {'\n'}
                Add more transaction history to see recurring patterns.
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
  summaryBox: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  totalAmount: {
    fontWeight: '700',
    marginTop: 8,
  },
  expenseItem: {
    marginBottom: 16,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  merchantInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  merchantName: {
    fontWeight: '600',
    marginBottom: 6,
  },
  categoryChip: {
    alignSelf: 'flex-start',
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontWeight: '700',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  detailItem: {
    flex: 1,
  },
  detailValue: {
    fontWeight: '500',
    marginTop: 4,
  },
  historyContainer: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: 12,
    borderRadius: 8,
  },
  historyTitle: {
    marginBottom: 8,
    fontWeight: '500',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  divider: {
    marginVertical: 16,
  },
  emptyState: {
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  bottomSpacer: {
    height: 32,
  },
});
