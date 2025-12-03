import { Transaction } from '../types/banking';
import { Budget, RecurringExpense, SpendingCategory, TimeFilter } from '../types/insights';
import { enrichTransaction } from './enrichment';

/**
 * Calculate days remaining in current month
 */
export const getDaysRemaining = (): number => {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return lastDay.getDate() - now.getDate();
};

/**
 * Filter transactions by time period
 */
export const filterTransactionsByTime = (
  transactions: any[],
  timeFilter: TimeFilter
): any[] => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const startOfThreeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  return transactions.filter((tx) => {
    const txDate = new Date(tx.timestamp || tx.bookingDateTime || tx.valueDateTime);

    switch (timeFilter) {
      case 'thisMonth':
        return txDate >= startOfMonth;
      case 'lastMonth':
        return txDate >= startOfLastMonth && txDate <= endOfLastMonth;
      case 'last3Months':
        return txDate >= startOfThreeMonthsAgo;
      case 'thisYear':
        return txDate >= startOfYear;
      case 'all':
      default:
        return true;
    }
  });
};

/**
 * Calculate spending by category from transactions
 */
export const calculateSpendingByCategory = (
  transactions: any[]
): SpendingCategory[] => {
  const categoryMap = new Map<string, {
    amount: number;
    count: number;
    icon: string;
    color: string;
  }>();

  // Group expenses by category
  transactions.forEach((tx) => {
    const enriched = tx._enriched || enrichTransaction(tx);

    // Only include expenses (negative amounts)
    if (!enriched.isCredit && enriched.amount < 0) {
      const category = enriched.category || 'Other';
      const existing = categoryMap.get(category) || {
        amount: 0,
        count: 0,
        icon: enriched.categoryIcon || '📦',
        color: enriched.categoryColor || '#64748B',
      };

      categoryMap.set(category, {
        amount: existing.amount + Math.abs(enriched.amount),
        count: existing.count + 1,
        icon: enriched.categoryIcon || existing.icon,
        color: enriched.categoryColor || existing.color,
      });
    }
  });

  // Convert to array and calculate percentages
  const totalSpent = Array.from(categoryMap.values()).reduce(
    (sum, cat) => sum + cat.amount,
    0
  );

  const categories: SpendingCategory[] = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count,
      percentage: totalSpent > 0 ? (data.amount / totalSpent) * 100 : 0,
      color: data.color,
      icon: data.icon,
      suggestedBudget: Math.ceil(data.amount * 1.2), // 120% of actual spending
    }))
    .sort((a, b) => b.amount - a.amount);

  return categories;
};

/**
 * Merge computed spending with saved budgets
 */
export const mergeBudgetsWithSpending = (
  spendingCategories: SpendingCategory[],
  savedBudgets: Budget[]
): (SpendingCategory & { budget?: number; limit?: number })[] => {
  const budgetMap = new Map(savedBudgets.map((b) => [b.category, b]));

  return spendingCategories.map((spending) => {
    const savedBudget = budgetMap.get(spending.category);
    return {
      ...spending,
      budget: savedBudget?.budget,
      limit: savedBudget?.limit,
    };
  });
};

/**
 * Detect recurring expenses from transactions
 * Merchant must have 2+ transactions with <20% amount variance
 */
export const detectRecurringExpenses = (
  transactions: any[],
  minTransactions: number = 2,
  maxVariance: number = 0.2
): RecurringExpense[] => {
  const merchantMap = new Map<string, any[]>();

  // Group by merchant
  transactions.forEach((tx) => {
    const enriched = tx._enriched || enrichTransaction(tx);

    // Only expenses (negative amounts)
    if (!enriched.isCredit && enriched.merchant) {
      const merchant = enriched.merchant;
      if (!merchantMap.has(merchant)) {
        merchantMap.set(merchant, []);
      }
      merchantMap.get(merchant)!.push({
        id: tx.id,
        date: enriched.date,
        amount: Math.abs(enriched.amount),
        category: enriched.category,
        categoryIcon: enriched.categoryIcon,
        categoryColor: enriched.categoryColor,
      });
    }
  });

  // Find recurring patterns
  const recurring: RecurringExpense[] = [];

  merchantMap.forEach((txs, merchant) => {
    if (txs.length < minTransactions) return;

    // Sort by date
    txs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Group transactions by month and sum amounts within each month
    const monthlyTotals = new Map<string, { total: number; transactions: typeof txs }>();

    txs.forEach((t) => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;

      if (!monthlyTotals.has(monthKey)) {
        monthlyTotals.set(monthKey, { total: 0, transactions: [] });
      }

      const monthData = monthlyTotals.get(monthKey)!;
      monthData.total += t.amount;
      monthData.transactions.push(t);
    });

    // Only consider as recurring if transactions span at least 2 different months
    if (monthlyTotals.size < 2) return;

    // Calculate average of monthly totals and variance
    const monthlyAmounts = Array.from(monthlyTotals.values()).map((m) => m.total);
    const avgMonthlyAmount = monthlyAmounts.reduce((sum, amt) => sum + amt, 0) / monthlyAmounts.length;
    const variance = monthlyAmounts.reduce((sum, amt) => sum + Math.abs(amt - avgMonthlyAmount), 0) / monthlyAmounts.length;
    const varianceRatio = variance / avgMonthlyAmount;

    // If variance is low enough, it's recurring
    if (varianceRatio <= maxVariance) {
      // Estimate next payment date (30 days from last transaction)
      const lastDate = new Date(txs[txs.length - 1].date);
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + 30);

      recurring.push({
        merchant,
        category: txs[0].category || 'Other',
        categoryIcon: txs[0].categoryIcon || '📦',
        categoryColor: txs[0].categoryColor || '#64748B',
        amount: avgMonthlyAmount,
        frequency: monthlyTotals.size, // Number of months, not number of transactions
        nextDate: nextDate.toISOString(),
        transactions: txs,
      });
    }
  });

  // Sort by amount (highest first) and limit to top 6
  return recurring
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);
};

/**
 * Calculate total income and expenses
 */
export const calculateIncomeExpenses = (
  transactions: any[]
): { income: number; expenses: number; net: number } => {
  let income = 0;
  let expenses = 0;

  transactions.forEach((tx) => {
    const enriched = tx._enriched || enrichTransaction(tx);

    if (enriched.isCredit && enriched.amount > 0) {
      income += enriched.amount;
    } else if (!enriched.isCredit && enriched.amount < 0) {
      expenses += Math.abs(enriched.amount);
    }
  });

  return {
    income,
    expenses,
    net: income - expenses,
  };
};

/**
 * Calculate budget usage percentage
 */
export const calculateBudgetUsage = (
  spendingCategories: SpendingCategory[],
  savedBudgets: Budget[]
): { usage: number; categoriesOverBudget: number } => {
  if (savedBudgets.length === 0) {
    return { usage: 0, categoriesOverBudget: 0 };
  }

  const budgetMap = new Map(spendingCategories.map((s) => [s.category, s.amount]));
  let totalSpent = 0;
  let totalBudget = 0;
  let overBudgetCount = 0;

  savedBudgets.forEach((budget) => {
    const spent = budgetMap.get(budget.category) || 0;
    totalSpent += spent;
    totalBudget += budget.limit;

    if (spent > budget.limit) {
      overBudgetCount++;
    }
  });

  const usage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return {
    usage,
    categoriesOverBudget: overBudgetCount,
  };
};

/**
 * Calculate total monthly recurring expenses
 */
export const calculateRecurringTotal = (recurring: RecurringExpense[]): number => {
  return recurring.reduce((sum, r) => sum + r.amount, 0);
};

/**
 * Calculate goal progress
 */
export const calculateGoalProgress = (saved: number, target: number): number => {
  const savedNum = Number(saved) || 0;
  const targetNum = Number(target) || 0;
  if (targetNum <= 0) return 0;
  return Math.min((savedNum / targetNum) * 100, 100);
};

/**
 * Estimate months to reach goal
 */
export const estimateMonthsToGoal = (
  saved: number,
  target: number,
  monthly: number
): number => {
  const savedNum = Number(saved) || 0;
  const targetNum = Number(target) || 0;
  const monthlyNum = Number(monthly) || 0;
  if (monthlyNum <= 0 || savedNum >= targetNum) return 0;
  const remaining = targetNum - savedNum;
  return Math.ceil(remaining / monthlyNum);
};
