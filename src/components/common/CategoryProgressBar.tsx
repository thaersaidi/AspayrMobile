import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

interface CategoryProgressBarProps {
  label: string;
  amount: string;
  count?: number;
  percentage: number;
  color: string;
  icon?: string;
  spent?: number;
  limit?: number;
}

export const CategoryProgressBar: React.FC<CategoryProgressBarProps> = ({
  label,
  amount,
  count,
  percentage,
  color,
  icon,
  spent,
  limit,
}) => {
  const theme = useTheme();
  const isOverBudget = spent !== undefined && limit !== undefined && spent > limit;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.labelContainer}>
          {icon && <Text style={styles.icon}>{icon}</Text>}
          <Text style={styles.label}>{label}</Text>
          {count !== undefined && (
            <Text style={[styles.count, { color: theme.colors.onSurfaceVariant }]}>
              {count} tx
            </Text>
          )}
        </View>
        <View style={styles.amountContainer}>
          <Text style={[styles.amount, isOverBudget && styles.overBudget]}>
            {amount}
          </Text>
          {percentage !== undefined && (
            <Text
              style={[
                styles.percentage,
                { color: theme.colors.onSurfaceVariant },
                isOverBudget && styles.overBudget,
              ]}
            >
              {percentage.toFixed(2)}%
            </Text>
          )}
        </View>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressBackground, { backgroundColor: theme.colors.surfaceVariant }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: isOverBudget ? '#EF4444' : color,
            },
          ]}
        />
      </View>

      {/* Budget info (if provided) */}
      {spent !== undefined && limit !== undefined && (
        <Text style={[styles.budgetInfo, { color: theme.colors.onSurfaceVariant }]}>
          {`${spent.toFixed(2)} of ${limit.toFixed(2)}`}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  count: {
    fontSize: 12,
    marginLeft: 8,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  percentage: {
    fontSize: 12,
  },
  overBudget: {
    color: '#EF4444',
  },
  progressBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetInfo: {
    fontSize: 11,
    marginTop: 4,
  },
});
