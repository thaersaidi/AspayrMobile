import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import {
  Text,
  useTheme,
  SegmentedButtons,
  IconButton,
  Surface,
  Menu,
  Button,
} from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BottomTabParamList } from '../../types/navigation';
import { Loading } from '../../components/common/Loading';
import { userStorage } from '../../utils/storage';
import { storageApi } from '../../api';
import { enrichTransaction } from '../../utils/enrichment';
import { Budget, Goal, TimeFilter } from '../../types/insights';
import {
  filterTransactionsByTime,
  calculateSpendingByCategory,
  detectRecurringExpenses,
  calculateIncomeExpenses,
} from '../../utils/insightsCalculations';

// Import new screen components
import { SpendingScreen } from '../insights/SpendingScreen';
import { BudgetsScreen } from '../insights/BudgetsScreen';
import { RecurringScreen } from '../insights/RecurringScreen';
import { GoalsScreen } from '../insights/GoalsScreen';

type Props = NativeStackScreenProps<BottomTabParamList, 'Insights'>;

const TIME_FILTER_OPTIONS = [
  { label: 'This Month', value: 'thisMonth' as TimeFilter },
  { label: 'Last Month', value: 'lastMonth' as TimeFilter },
  { label: 'Last 3 Months', value: 'last3Months' as TimeFilter },
  { label: 'This Year', value: 'thisYear' as TimeFilter },
  { label: 'All Time', value: 'all' as TimeFilter },
];

export const InsightsScreenNew: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activeScreen, setActiveScreen] = useState<
    'spending' | 'budgets' | 'recurring' | 'goals'
  >('spending');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('last3Months');
  const [timeFilterMenuVisible, setTimeFilterMenuVisible] = useState(false);
  const [userUuid, setUserUuid] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await userStorage.getUser();
      if (user?.userUuid) {
        setUserUuid(user.userUuid);

        // Load transactions
        const transactionsData = await storageApi.getTransactions(user.userUuid);
        const enrichedTransactions = (transactionsData || []).map(enrichTransaction);
        setTransactions(enrichedTransactions);

        // Load budgets
        const budgetsData = await storageApi.getBudgets(user.userUuid);
        setBudgets(budgetsData || []);

        // Load goals
        const goalsData = await storageApi.getGoals(user.userUuid);
        setGoals(goalsData || []);
      }
    } catch (error) {
      console.error('Error loading insights data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Filter transactions by time period
  const filteredTransactions = useMemo(() => {
    return filterTransactionsByTime(transactions, timeFilter);
  }, [transactions, timeFilter]);

  // Calculate spending by category
  const spendingCategories = useMemo(() => {
    return calculateSpendingByCategory(filteredTransactions);
  }, [filteredTransactions]);

  // Detect recurring expenses
  const recurringExpenses = useMemo(() => {
    return detectRecurringExpenses(filteredTransactions);
  }, [filteredTransactions]);

  // Calculate income and expenses
  const incomeExpenses = useMemo(() => {
    return calculateIncomeExpenses(filteredTransactions);
  }, [filteredTransactions]);

  // Calculate total budget limit
  const totalBudgetLimit = useMemo(() => {
    if (budgets.length > 0) {
      return budgets.reduce((sum, b) => sum + b.limit, 0);
    }
    // Use suggested budget from spending
    return spendingCategories.reduce((sum, cat) => sum + (cat.suggestedBudget || 0), 0);
  }, [budgets, spendingCategories]);

  // Handle budget save
  const handleSaveBudgets = async (
    budgetsToSave: Array<{ category: string; limit: number }>
  ) => {
    try {
      if (!userUuid) return;

      const budgetsWithData = budgetsToSave.map((b) => {
        const spending = spendingCategories.find((s) => s.category === b.category);
        return {
          category: b.category,
          budget: b.limit,
          spent: spending?.amount || 0,
          limit: b.limit,
          period: 'monthly' as const,
        };
      });

      await storageApi.saveBudgetsBulk(userUuid, budgetsWithData);

      // Reload budgets
      const budgetsData = await storageApi.getBudgets(userUuid);
      setBudgets(budgetsData || []);
    } catch (error) {
      console.error('Failed to save budgets:', error);
      throw error;
    }
  };

  // Handle goal save
  const handleSaveGoal = async (goal: Omit<Goal, 'id' | 'userId'>) => {
    try {
      if (!userUuid) return;

      await storageApi.saveGoal(userUuid, goal);

      // Reload goals
      const goalsData = await storageApi.getGoals(userUuid);
      setGoals(goalsData || []);
    } catch (error) {
      console.error('Failed to save goal:', error);
      throw error;
    }
  };

  // Handle goal delete
  const handleDeleteGoal = async (goalId: string) => {
    try {
      if (!userUuid) return;

      await storageApi.deleteGoal(userUuid, goalId);

      // Reload goals
      const goalsData = await storageApi.getGoals(userUuid);
      setGoals(goalsData || []);
    } catch (error) {
      console.error('Failed to delete goal:', error);
      throw error;
    }
  };

  if (loading) {
    return <Loading message="Loading insights..." />;
  }

  const selectedTimeFilter = TIME_FILTER_OPTIONS.find((o) => o.value === timeFilter);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Financial Insights
        </Text>
        <Text
          variant="bodySmall"
          style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}
        >
          Track spending, budgets, recurring expenses, and goals
        </Text>
      </Surface>

      {/* Time Filter */}
      <View style={styles.filterContainer}>
        <Menu
          visible={timeFilterMenuVisible}
          onDismiss={() => setTimeFilterMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setTimeFilterMenuVisible(true)}
              icon="calendar"
              contentStyle={styles.filterButtonContent}
              style={styles.filterButton}
            >
              {selectedTimeFilter?.label || 'Last 3 Months'}
            </Button>
          }
        >
          {TIME_FILTER_OPTIONS.map((option) => (
            <Menu.Item
              key={option.value}
              onPress={() => {
                setTimeFilter(option.value);
                setTimeFilterMenuVisible(false);
              }}
              title={option.label}
              leadingIcon={timeFilter === option.value ? 'check' : undefined}
            />
          ))}
        </Menu>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tabButtons}>
            <Button
              mode={activeScreen === 'spending' ? 'contained' : 'outlined'}
              onPress={() => setActiveScreen('spending')}
              icon="chart-pie"
              style={styles.tabButton}
              compact
            >
              Spending
            </Button>
            <Button
              mode={activeScreen === 'budgets' ? 'contained' : 'outlined'}
              onPress={() => setActiveScreen('budgets')}
              icon="wallet"
              style={styles.tabButton}
              compact
            >
              Budgets
            </Button>
            <Button
              mode={activeScreen === 'recurring' ? 'contained' : 'outlined'}
              onPress={() => setActiveScreen('recurring')}
              icon="refresh"
              style={styles.tabButton}
              compact
            >
              Recurring
            </Button>
            <Button
              mode={activeScreen === 'goals' ? 'contained' : 'outlined'}
              onPress={() => setActiveScreen('goals')}
              icon="target"
              style={styles.tabButton}
              compact
            >
              Goals
            </Button>
          </View>
        </ScrollView>
      </View>

      {/* Screen Content */}
      <View style={styles.content}>
        {activeScreen === 'spending' && (
          <SpendingScreen
            totalSpent={incomeExpenses.expenses}
            budgetLimit={totalBudgetLimit}
            categories={spendingCategories}
            onGetInsights={() => {
              // TODO: Navigate to AI insights
              console.log('Get AI insights');
            }}
          />
        )}

        {activeScreen === 'budgets' && (
          <BudgetsScreen
            categories={spendingCategories}
            savedBudgets={budgets}
            onSaveBudgets={handleSaveBudgets}
          />
        )}

        {activeScreen === 'recurring' && (
          <RecurringScreen recurringExpenses={recurringExpenses} />
        )}

        {activeScreen === 'goals' && (
          <GoalsScreen
            goals={goals}
            onSaveGoal={handleSaveGoal}
            onDeleteGoal={handleDeleteGoal}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 24,
  },
  headerTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterButton: {
    alignSelf: 'flex-start',
  },
  filterButtonContent: {
    flexDirection: 'row-reverse',
  },
  tabContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  tabButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  tabButton: {
    marginRight: 8,
  },
  content: {
    flex: 1,
  },
});
