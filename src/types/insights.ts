export interface Budget {
  id: string;
  userId: string;
  category: string;
  budget: number;
  spent: number;
  limit: number;
  period: 'monthly' | 'weekly' | 'yearly';
  updatedAt: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  name: string;
  target: number;
  saved: number;
  monthly: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface RecurringExpense {
  merchant: string;
  category: string;
  categoryIcon: string;
  categoryColor: string;
  amount: number;
  frequency: number;
  nextDate: string;
  transactions: Array<{
    id: string;
    date: string;
    amount: number;
  }>;
}

export interface SpendingCategory {
  category: string;
  amount: number;
  count: number;
  percentage: number;
  color: string;
  icon: string;
  suggestedBudget?: number;
}

export type TimeFilter = 'thisMonth' | 'lastMonth' | 'last3Months' | 'thisYear' | 'all';

export interface InsightsSummary {
  totalSpent: number;
  totalIncome: number;
  netBalance: number;
  budgetUsage: number;
  categoriesOverBudget: number;
  recurringExpensesTotal: number;
  goalsProgress: number;
}
