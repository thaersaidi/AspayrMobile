import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Text, useTheme, Surface } from 'react-native-paper';
import { PieChart, BarChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface ChartsScreenProps {
  accounts: any[];
  transactions: any[];
}

const CHART_WIDTH = Dimensions.get('window').width - 48;

export const ChartsScreen: React.FC<ChartsScreenProps> = ({
  accounts,
  transactions,
}) => {
  const theme = useTheme();

  // Group accounts by Type
  const accountTypeData = useMemo(() => {
    if (!accounts || accounts.length === 0) return [];

    const typeMap = accounts.reduce((acc: any, account: any) => {
      const key = account.type || account.accountType || 'Unknown';
      if (!acc[key]) {
        acc[key] = 0;
      }
      acc[key] += 1;
      return acc;
    }, {});

    const colors = [
      '#8B5CF6', // purple
      '#06B6D4', // cyan
      '#F59E0B', // amber
      '#10B981', // emerald
      '#EF4444', // red
      '#A855F7', // light purple
    ];

    return Object.keys(typeMap).map((key, index) => ({
      name: key,
      value: typeMap[key],
      color: colors[index % colors.length],
      legendFontColor: theme.colors.onSurface,
      legendFontSize: 12,
    }));
  }, [accounts, theme]);

  // Group accounts by Currency
  const accountCurrencyData = useMemo(() => {
    if (!accounts || accounts.length === 0) return [];

    const currencyMap = accounts.reduce((acc: any, account: any) => {
      const key = account.currency || 'Unknown';
      if (!acc[key]) {
        acc[key] = 0;
      }
      acc[key] += 1;
      return acc;
    }, {});

    const colors = [
      '#06B6D4', // cyan
      '#10B981', // emerald
      '#F59E0B', // amber
      '#8B5CF6', // purple
      '#EF4444', // red
      '#A855F7', // light purple
    ];

    return Object.keys(currencyMap).map((key, index) => ({
      name: key,
      value: currencyMap[key],
      color: colors[index % colors.length],
      legendFontColor: theme.colors.onSurface,
      legendFontSize: 12,
    }));
  }, [accounts, theme]);

  // Top 10 Payees/Merchants by volume
  const topPayeesData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return { labels: [], datasets: [{ data: [] }] };
    }

    const merchantMap = transactions.reduce((acc: any, tx: any) => {
      const merchant =
        tx._enriched?.merchant ||
        tx.merchant?.name ||
        tx.description ||
        'Unknown';
      const amount = Math.abs(
        tx._enriched?.amount ?? tx.amount ?? tx.transactionAmount?.amount ?? 0
      );
      if (!acc[merchant]) {
        acc[merchant] = 0;
      }
      acc[merchant] += amount;
      return acc;
    }, {});

    const sorted = Object.entries(merchantMap)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 10);

    return {
      labels: sorted.map(([name]) =>
        name.length > 15 ? name.substring(0, 12) + '...' : name
      ),
      datasets: [
        {
          data: sorted.map(([, value]) => value as number),
        },
      ],
    };
  }, [transactions]);

  // Daily Cash Flow (Income vs Expenses) - Last 14 days
  const cashFlowData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return {
        labels: [],
        datasets: [{ data: [] }, { data: [] }],
        legend: ['Income', 'Expenses'],
      };
    }

    const flowMap: any = {};
    transactions.forEach((tx: any) => {
      const date = tx._enriched?.date || tx.timestamp || tx.date;
      if (!date) return;

      const dateKey = new Date(date).toISOString().split('T')[0];
      if (!flowMap[dateKey]) {
        flowMap[dateKey] = { income: 0, expense: 0 };
      }

      const amount =
        tx._enriched?.amount ?? tx.amount ?? tx.transactionAmount?.amount ?? 0;
      const isCredit = tx._enriched?.isCredit ?? amount > 0;

      if (isCredit) {
        flowMap[dateKey].income += Math.abs(amount);
      } else {
        flowMap[dateKey].expense += Math.abs(amount);
      }
    });

    const sorted = Object.entries(flowMap)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .slice(-14);

    return {
      labels: sorted.map(([date]) => {
        const d = new Date(date);
        return `${d.getDate()}/${d.getMonth() + 1}`;
      }),
      datasets: [
        {
          data: sorted.map(([, value]: any) => value.income),
          color: () => '#10B981', // Green for income
        },
        {
          data: sorted.map(([, value]: any) => value.expense),
          color: () => '#EF4444', // Red for expenses
        },
      ],
      legend: ['Income', 'Expenses'],
    };
  }, [transactions]);

  const chartConfig = {
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.7,
    decimalPlaces: 0,
    labelColor: () => theme.colors.onSurface,
    propsForLabels: {
      fontSize: 10,
    },
  };

  const styles = createStyles(theme);

  if (accounts.length === 0 && transactions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="chart-box-outline" size={64} color={theme.colors.onSurfaceVariant} />
        <Text style={styles.emptyText}>
          No data available. Link your bank accounts to see charts.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >

      {/* Accounts Charts */}
      {accountTypeData.length > 0 && (
        <>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            Account Distribution
          </Text>

          <Surface style={styles.chartCard} elevation={1}>
            <Text style={styles.chartTitle}>Accounts by Type</Text>
            <View style={styles.chartContainer}>
              <PieChart
                data={accountTypeData}
                width={CHART_WIDTH}
                height={220}
                chartConfig={chartConfig}
                accessor="value"
                backgroundColor="transparent"
                paddingLeft="15"
                center={[10, 0]}
                hasLegend={true}
              />
            </View>
          </Surface>

          <Surface style={styles.chartCard} elevation={1}>
            <Text style={styles.chartTitle}>Accounts by Currency</Text>
            <View style={styles.chartContainer}>
              <PieChart
                data={accountCurrencyData}
                width={CHART_WIDTH}
                height={220}
                chartConfig={chartConfig}
                accessor="value"
                backgroundColor="transparent"
                paddingLeft="15"
                center={[10, 0]}
                hasLegend={true}
              />
            </View>
          </Surface>
        </>
      )}

      {/* Transactions Charts */}
      {transactions.length > 0 && (
        <>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            Transaction Analytics
          </Text>

          {topPayeesData.datasets[0].data.length > 0 ? (
            <Surface style={styles.chartCard} elevation={1}>
              <Text style={styles.chartTitle}>Top 10 Payees by Volume</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chartContainer}>
                  <BarChart
                    data={topPayeesData}
                    width={Math.max(
                      CHART_WIDTH,
                      topPayeesData.labels.length * 60
                    )}
                    height={280}
                    chartConfig={{
                      ...chartConfig,
                      barPercentage: 0.6,
                    }}
                    fromZero
                    showValuesOnTopOfBars
                    yAxisLabel=""
                    yAxisSuffix=""
                    style={{
                      marginVertical: 8,
                    }}
                  />
                </View>
              </ScrollView>
            </Surface>
          ) : null}

          {cashFlowData.datasets[0].data.length > 0 ? (
            <Surface style={styles.chartCard} elevation={1}>
              <Text style={styles.chartTitle}>Daily Cash Flow (Last 14 Days)</Text>
              <View style={styles.cashFlowLegendContainer}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.legendText}>Income</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                  <Text style={styles.legendText}>Expenses</Text>
                </View>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chartContainer}>
                  <BarChart
                    data={cashFlowData}
                    width={Math.max(CHART_WIDTH, cashFlowData.labels.length * 45)}
                    height={280}
                    chartConfig={chartConfig}
                    fromZero
                    showValuesOnTopOfBars={false}
                    yAxisLabel=""
                    yAxisSuffix=""
                    style={{
                      marginVertical: 8,
                    }}
                  />
                </View>
              </ScrollView>
            </Surface>
          ) : null}
        </>
      )}
    </ScrollView>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      paddingBottom: 24,
    },
    header: {
      padding: 16,
      paddingBottom: 8,
    },
    headerTitle: {
      fontWeight: '600',
      marginBottom: 4,
      color: theme.colors.onSurface,
    },
    headerSubtitle: {
      fontSize: 13,
    },
    sectionTitle: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    sectionSubtitle: {
      color: theme.colors.primary,
      fontSize: 12,
    },
    chartCard: {
      marginHorizontal: 16,
      marginBottom: 16,
      padding: 16,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
    },
    chartTitle: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 4,
      color: theme.colors.onSurface,
    },
    chartContainer: {
      alignItems: 'center',
    },
    legendContainer: {
      marginTop: 12,
      gap: 8,
    },
    cashFlowLegendContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 16,
      marginBottom: 12,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: theme.colors.surfaceVariant,
    },
    legendDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    legendText: {
      fontSize: 12,
      color: theme.colors.onSurface,
      flex: 1,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    emptyText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      marginTop: 16,
    },
  });
