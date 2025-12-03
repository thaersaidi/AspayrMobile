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

// Custom Tab Button Component
interface TabButtonProps {
  icon: string;
  label: string;
  active: boolean;
  onPress: () => void;
  theme: any;
}

const TabButton: React.FC<TabButtonProps> = ({ icon, label, active, onPress, theme }) => {
  return (
    <TouchableOpacity
      style={[
        styles.customTabButton,
        {
          backgroundColor: active ? theme.colors.primary : 'transparent',
          borderColor: active ? theme.colors.primary : theme.colors.outline,
          borderWidth: 1,
        },
      ]}
      onPress={onPress}
    >
      <Icon
        name={icon}
        size={24}
        color={active ? theme.colors.onPrimary : theme.colors.primary}
      />
      <Text
        variant="labelSmall"
        style={[
          styles.customTabButtonText,
          { color: active ? theme.colors.onPrimary : theme.colors.onSurface },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

// Import new screen components
import { SpendingScreen } from '../insights/SpendingScreen';
import { BudgetsScreen } from '../insights/BudgetsScreen';
import { RecurringScreen } from '../insights/RecurringScreen';
import { GoalsScreen } from '../insights/GoalsScreen';
import { ChartsScreen } from '../insights/ChartsScreen';

type Props = NativeStackScreenProps<BottomTabParamList, 'Insights'>;

const TIME_FILTER_OPTIONS = [
  { label: 'This Month', value: 'thisMonth' as TimeFilter },
  { label: 'Last Month', value: 'lastMonth' as TimeFilter },
  { label: 'Last 3 Months', value: 'last3Months' as TimeFilter },
  { label: 'This Year', value: 'thisYear' as TimeFilter },
  { label: 'All Time', value: 'all' as TimeFilter },
];

export const InsightsScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activeScreen, setActiveScreen] = useState<
    'spending' | 'budgets' | 'recurring' | 'goals' | 'charts'
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

        // Load accounts for charts
        const accountsData = await storageApi.getAccounts(user.userUuid);
        setAccounts(accountsData || []);

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
          Track spending, budgets, recurring expenses, goals, and visual charts
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContent}>
          <View style={styles.tabButtons}>
            <TabButton
              icon="chart-pie"
              label="Spending"
              active={activeScreen === 'spending'}
              onPress={() => setActiveScreen('spending')}
              theme={theme}
            />
            <TabButton
              icon="wallet"
              label="Budgets"
              active={activeScreen === 'budgets'}
              onPress={() => setActiveScreen('budgets')}
              theme={theme}
            />
            <TabButton
              icon="refresh"
              label="Recurring"
              active={activeScreen === 'recurring'}
              onPress={() => setActiveScreen('recurring')}
              theme={theme}
            />
            <TabButton
              icon="target"
              label="Goals"
              active={activeScreen === 'goals'}
              onPress={() => setActiveScreen('goals')}
              theme={theme}
            />
            <TabButton
              icon="chart-bar"
              label="Charts"
              active={activeScreen === 'charts'}
              onPress={() => setActiveScreen('charts')}
              theme={theme}
            />
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

        {activeScreen === 'charts' && (
          <ChartsScreen accounts={accounts} transactions={filteredTransactions} />
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
  tabScrollContent: {
    paddingRight: 16,
  },
  tabButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  customTabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    minWidth: 70,
    marginRight: 8,
  },
  customTabButtonText: {
    marginTop: 4,
    fontSize: 11,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
});
