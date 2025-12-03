import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Text, useTheme, SegmentedButtons, IconButton, Surface } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BottomTabParamList } from '../../types/navigation';
import { Loading } from '../../components/common/Loading';
import { userStorage } from '../../utils/storage';
import { storageApi } from '../../api';
import { formatCurrency } from '../../utils/formatters';
import { enrichTransaction, getCategoryFromTransaction, CategoryInfo, CATEGORY_COLORS } from '../../utils/enrichment';

type Props = NativeStackScreenProps<BottomTabParamList, 'Insights'>;

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const screenWidth = Dimensions.get('window').width;

export const InsightsScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await userStorage.getUser();
      if (user?.userUuid) {
        const transactionsData = await storageApi.getTransactions(user.userUuid);
        // Enrich all transactions with category inference
        const enrichedTransactions = (transactionsData || []).map(enrichTransaction);
        setTransactions(enrichedTransactions);
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

  // Filter transactions by selected month
  const filteredTransactions = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    return transactions.filter(tx => {
      const dateStr = tx.timestamp || tx.date;
      if (!dateStr) return false;

      const txDate = new Date(dateStr);
      if (isNaN(txDate.getTime())) return false;

      return txDate.getMonth() === selectedMonth && txDate.getFullYear() === selectedYear;
    }).sort((a, b) => {
      const dateA = new Date(a.timestamp || a.date).getTime();
      const dateB = new Date(b.timestamp || b.date).getTime();
      return dateB - dateA;
    });
  }, [transactions, selectedMonth, selectedYear]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, any[]> = {};
    
    filteredTransactions.forEach(tx => {
      const dateStr = tx.timestamp || tx.date;
      const date = new Date(dateStr);
      const key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(tx);
    });
    
    return groups;
  }, [filteredTransactions]);

  // Calculate spending summary
  const summary = useMemo(() => {
    const income = filteredTransactions
      .filter(tx => (tx.amount || tx.transactionAmount?.amount || 0) > 0)
      .reduce((sum, tx) => sum + (tx.amount || tx.transactionAmount?.amount || 0), 0);

    const expenses = filteredTransactions
      .filter(tx => (tx.amount || tx.transactionAmount?.amount || 0) < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amount || tx.transactionAmount?.amount || 0), 0);

    return { income, expenses, net: income - expenses };
  }, [filteredTransactions]);

  // Get category info from enriched transaction
  const getCategoryInfo = (transaction: any): CategoryInfo => {
    return getCategoryFromTransaction(transaction);
  };

  if (loading) {
    return <Loading message="Loading insights..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Insights</Text>
      </View>

      {/* Segmented Tabs */}
      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          buttons={[
            { value: 'overview', label: 'Overview' },
            { value: 'transactions', label: 'Transactions' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {/* Month Picker */}
      <TouchableOpacity
        style={styles.monthPicker}
        onPress={() => setShowMonthPicker(true)}
      >
        <Icon name="chevron-left" size={24} color={theme.colors.primary} />
        <Text style={styles.monthText}>
          {MONTHS[selectedMonth]} {selectedYear}
        </Text>
        <Icon name="chevron-right" size={24} color={theme.colors.primary} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'overview' ? (
          <OverviewTab summary={summary} transactions={filteredTransactions} theme={theme} />
        ) : (
          <TransactionsTab
            groupedTransactions={groupedTransactions}
            getCategoryInfo={getCategoryInfo}
            theme={theme}
            navigation={navigation}
          />
        )}
      </ScrollView>

      {/* Month Picker Modal */}
      <MonthPickerModal
        visible={showMonthPicker}
        onClose={() => setShowMonthPicker(false)}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onSelectMonth={(month, year) => {
          setSelectedMonth(month);
          setSelectedYear(year);
          setShowMonthPicker(false);
        }}
        theme={theme}
      />
    </View>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{ summary: any; transactions: any[]; theme: any }> = ({
  summary,
  transactions,
  theme,
}) => {
  // Calculate spending by category using enriched data
  const categorySpending = useMemo(() => {
    const expenses = transactions.filter(tx => {
      const amount = tx._enriched?.amount ?? tx.amount ?? tx.transactionAmount?.amount ?? 0;
      return amount < 0;
    });
    const categoryMap: Record<string, { amount: number; icon: string; color: string }> = {};

    expenses.forEach(tx => {
      const info = getCategoryFromTransaction(tx);
      const category = info.category;
      const amount = Math.abs(tx._enriched?.amount ?? tx.amount ?? tx.transactionAmount?.amount ?? 0);
      
      if (!categoryMap[category]) {
        categoryMap[category] = { amount: 0, icon: info.icon, color: info.color };
      }
      categoryMap[category].amount += amount;
    });

    return Object.entries(categoryMap)
      .map(([name, data]) => ({ name, amount: data.amount, icon: data.icon, color: data.color }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);
  }, [transactions]);

  return (
    <View style={styles.tabContent}>
      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <Surface style={[styles.summaryCard, { backgroundColor: '#ECFDF5' }]} elevation={0}>
          <Text style={[styles.summaryLabel, { color: '#059669' }]}>Income</Text>
          <Text style={[styles.summaryValue, { color: '#059669' }]}>
            {formatCurrency(summary.income)}
          </Text>
        </Surface>
        <Surface style={[styles.summaryCard, { backgroundColor: '#FEF2F2' }]} elevation={0}>
          <Text style={[styles.summaryLabel, { color: '#DC2626' }]}>Expenses</Text>
          <Text style={[styles.summaryValue, { color: '#DC2626' }]}>
            {formatCurrency(summary.expenses)}
          </Text>
        </Surface>
      </View>

      {/* Net Balance */}
      <Surface style={styles.netCard} elevation={1}>
        <Text style={styles.netLabel}>Net Balance</Text>
        <Text style={[styles.netValue, { color: summary.net >= 0 ? '#059669' : '#DC2626' }]}>
          {summary.net >= 0 ? '+' : ''}{formatCurrency(summary.net)}
        </Text>
      </Surface>

      {/* Spending by Category */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Spending by Category</Text>
      </View>

      {categorySpending.length > 0 ? (
        categorySpending.map((cat, index) => {
          return (
            <Surface key={index} style={styles.categoryRow} elevation={0}>
              <View style={[styles.categoryIcon, { backgroundColor: cat.color + '20' }]}>
                <Text style={styles.categoryEmoji}>{cat.icon}</Text>
              </View>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{cat.name}</Text>
                <View style={styles.categoryBar}>
                  <View
                    style={[
                      styles.categoryBarFill,
                      {
                        backgroundColor: cat.color,
                        width: `${Math.min((cat.amount / summary.expenses) * 100, 100)}%`,
                      },
                    ]}
                  />
                </View>
              </View>
              <Text style={styles.categoryAmount}>{formatCurrency(cat.amount)}</Text>
            </Surface>
          );
        })
      ) : (
        <Surface style={styles.emptyState} elevation={0}>
          <Text style={styles.emptyText}>No spending data for this period</Text>
        </Surface>
      )}
    </View>
  );
};

// Transactions Tab Component
const TransactionsTab: React.FC<{
  groupedTransactions: Record<string, any[]>;
  getCategoryInfo: (tx: any) => { icon: string; color: string };
  theme: any;
  navigation: any;
}> = ({ groupedTransactions, getCategoryInfo, theme, navigation }) => {
  const dateGroups = Object.entries(groupedTransactions);

  if (dateGroups.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="receipt-text-outline" size={64} color="#9CA3AF" />
        <Text style={styles.emptyTitle}>No Transactions</Text>
        <Text style={styles.emptySubtext}>No transactions for this month</Text>
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      {dateGroups.map(([date, txs]) => (
        <View key={date} style={styles.dateGroup}>
          <Text style={styles.dateHeader}>{date}</Text>
          {txs.map((tx, index) => {
            const info = getCategoryInfo(tx);
            const enriched = tx._enriched;
            const amount = enriched?.amount ?? tx.amount ?? tx.transactionAmount?.amount ?? 0;
            const isExpense = amount < 0;
            const displayName = enriched?.merchant || enriched?.description || tx.description || 'Transaction';
            const category = enriched?.category || 'Other';

            return (
              <TouchableOpacity
                key={tx.id || index}
                style={styles.transactionRow}
                onPress={() => (navigation as any).getParent()?.navigate('TransactionDetail', { transactionId: tx.id })}
              >
                <View style={[styles.txIcon, { backgroundColor: info.color + '20' }]}>
                  <Text style={styles.txEmoji}>{info.icon}</Text>
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txDescription} numberOfLines={1}>
                    {displayName}
                  </Text>
                  <Text style={styles.txCategory}>
                    {category}
                  </Text>
                </View>
                <Text style={[styles.txAmount, { color: isExpense ? '#DC2626' : '#059669' }]}>
                  {isExpense ? '-' : '+'}{formatCurrency(Math.abs(amount))}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
};

// Month Picker Modal
const MonthPickerModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  selectedMonth: number;
  selectedYear: number;
  onSelectMonth: (month: number, year: number) => void;
  theme: any;
}> = ({ visible, onClose, selectedMonth, selectedYear, onSelectMonth, theme }) => {
  const [tempYear, setTempYear] = useState(selectedYear);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Month</Text>
            <IconButton icon="close" size={24} onPress={onClose} />
          </View>

          {/* Year Selector */}
          <View style={styles.yearSelector}>
            <IconButton
              icon="chevron-left"
              size={24}
              onPress={() => setTempYear(tempYear - 1)}
            />
            <Text style={styles.yearText}>{tempYear}</Text>
            <IconButton
              icon="chevron-right"
              size={24}
              onPress={() => setTempYear(tempYear + 1)}
            />
          </View>

          {/* Month Grid */}
          <View style={styles.monthGrid}>
            {MONTHS.map((month, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.monthItem,
                  selectedMonth === index && tempYear === selectedYear && {
                    backgroundColor: theme.colors.primary,
                  },
                ]}
                onPress={() => onSelectMonth(index, tempYear)}
              >
                <Text
                  style={[
                    styles.monthItemText,
                    selectedMonth === index && tempYear === selectedYear && {
                      color: '#FFFFFF',
                    },
                  ]}
                >
                  {month.substring(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  tabContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  segmentedButtons: {
    backgroundColor: '#E5E7EB',
  },
  monthPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 16,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  content: {
    paddingBottom: 100,
  },
  tabContent: {
    paddingHorizontal: 20,
  },
  // Summary styles
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  netCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    marginBottom: 24,
  },
  netLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  netValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  // Section styles
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  // Category styles
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  categoryBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 12,
  },
  // Transaction styles
  dateGroup: {
    marginBottom: 20,
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    paddingLeft: 4,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txEmoji: {
    fontSize: 20,
  },
  txInfo: {
    flex: 1,
  },
  txDescription: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  txCategory: {
    fontSize: 13,
    color: '#6B7280',
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  emptyState: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  yearText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    minWidth: 80,
    textAlign: 'center',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'center',
    gap: 8,
  },
  monthItem: {
    width: (screenWidth - 64) / 4,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  monthItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
});
