/**
 * Transaction enrichment utilities
 * Port from aspayr-demo to React Native
 */

export interface CategoryInfo {
  category: string;
  icon: string;
  color: string;
}

export interface EnrichedTransaction {
  amount: number;
  currency: string;
  description: string;
  merchant: string;
  category: string;
  categoryIcon: string;
  categoryColor: string;
  date: string;
  isCredit: boolean;
  originalCategory: string | null;
  inferredCategory: string | null;
  payeeName: string | null;
  payerName: string | null;
}

// Category colors (hex values for React Native)
export const CATEGORY_COLORS: Record<string, string> = {
  green: '#22C55E',
  orange: '#F97316',
  purple: '#8B5CF6',
  blue: '#3B82F6',
  cyan: '#06B6D4',
  indigo: '#6366F1',
  yellow: '#EAB308',
  pink: '#EC4899',
  slate: '#64748B',
  red: '#EF4444',
  emerald: '#10B981',
};

// Transaction category inference from description
export const inferCategory = (description: string, merchant: string, amount: number): CategoryInfo => {
  const desc = (description || '').toLowerCase();
  const merch = (merchant || '').toLowerCase();
  const combined = `${desc} ${merch}`;

  // Income patterns
  if (amount > 0) {
    if (combined.match(/salary|payroll|wages|income/)) return { category: 'Income', icon: '💰', color: CATEGORY_COLORS.green };
    if (combined.match(/transfer|sent from/)) return { category: 'Transfer In', icon: '↓', color: CATEGORY_COLORS.green };
    if (combined.match(/refund|return/)) return { category: 'Refund', icon: '↩️', color: CATEGORY_COLORS.green };
    if (combined.match(/interest|dividend/)) return { category: 'Interest', icon: '📈', color: CATEGORY_COLORS.green };
    return { category: 'Income', icon: '💰', color: CATEGORY_COLORS.green };
  }

  // Expense patterns
  if (combined.match(/grocery|supermarket|tesco|sainsbury|asda|lidl|aldi|waitrose|morrisons|co-op|food/))
    return { category: 'Groceries', icon: '🛒', color: CATEGORY_COLORS.orange };
  if (combined.match(/restaurant|cafe|coffee|starbucks|costa|pret|mcdonald|burger|pizza|uber eats|deliveroo|just eat/))
    return { category: 'Dining', icon: '🍽️', color: CATEGORY_COLORS.orange };
  if (combined.match(/amazon|ebay|online|shop|store|retail|purchase/))
    return { category: 'Shopping', icon: '🛍️', color: CATEGORY_COLORS.purple };
  if (combined.match(/netflix|spotify|disney|prime|subscription|membership/))
    return { category: 'Subscriptions', icon: '📺', color: CATEGORY_COLORS.blue };
  if (combined.match(/uber|lyft|taxi|train|bus|transport|tfl|rail|parking|petrol|fuel|shell|bp|esso/))
    return { category: 'Transport', icon: '🚗', color: CATEGORY_COLORS.cyan };
  if (combined.match(/rent|mortgage|housing|landlord/))
    return { category: 'Housing', icon: '🏠', color: CATEGORY_COLORS.indigo };
  if (combined.match(/electric|gas|water|utility|council tax|broadband|internet|phone|mobile|vodafone|ee|o2|three/))
    return { category: 'Utilities', icon: '💡', color: CATEGORY_COLORS.yellow };
  if (combined.match(/health|pharmacy|doctor|hospital|dentist|gym|fitness/))
    return { category: 'Health', icon: '🏥', color: CATEGORY_COLORS.pink };
  if (combined.match(/entertainment|cinema|theatre|game|ticket|event/))
    return { category: 'Entertainment', icon: '🎬', color: CATEGORY_COLORS.purple };
  if (combined.match(/atm|cash|withdrawal/))
    return { category: 'Cash', icon: '💵', color: CATEGORY_COLORS.slate };
  if (combined.match(/transfer|sent to|payment to/))
    return { category: 'Transfer Out', icon: '↑', color: CATEGORY_COLORS.slate };
  if (combined.match(/insurance|premium/))
    return { category: 'Insurance', icon: '🛡️', color: CATEGORY_COLORS.blue };
  if (combined.match(/office|supplies|business|work/))
    return { category: 'Business', icon: '💼', color: CATEGORY_COLORS.slate };

  return { category: 'Other', icon: '📌', color: CATEGORY_COLORS.slate };
};

// Generic categories to skip from ISO bank codes
const GENERIC_CATEGORIES = [
  'Domestic Credit Transfer',
  'Issued Credit Transfers',
  'Payments',
  'Credit Transfers',
  'Debit Transfers',
  'Card Payments',
  'Other',
  'Transfer',
  'Deposit',
  'Withdrawal',
  'Direct Debit',
  'Standing Order',
  'Fee',
  'Interest',
  'Adjustment',
  'Refund',
  'Salary',
  'Pension',
  'Loan',
  'Tax',
  'Dividend',
  'Rent',
  'Mortgage',
  'Insurance',
  'Utility',
  'Subscription',
  'Cash',
  'ATM',
  'Unknown',
];

// Enrich transaction with inferred data
export const enrichTransaction = (tx: any): any => {
  const amount = tx.transactionAmount?.amount ?? tx.amount?.amount ?? tx.amount ?? 0;
  const currency = tx.transactionAmount?.currency ?? tx.amount?.currency ?? tx.currency ?? 'EUR';

  // Base description for logic
  const rawDescription = tx.description || tx.reference || tx.remittanceInformationUnstructured || 'Transaction';

  // Get payee/payer details
  const payeeName = tx.payeeDetails?.name;
  const payerName = tx.payerDetails?.name;

  // Get merchant from various sources
  const existingMerchant =
    tx.merchant?.merchantName ||
    tx.enrichment?.merchant?.merchantName ||
    tx.creditorName ||
    tx.debtorName ||
    payeeName ||
    payerName;

  // Use ISO bank transaction code for better categorization, but skip generic ones
  const isoBankCode = tx.isoBankTransactionCode;
  let existingCategory = tx.enrichment?.categorisation?.category;
  
  // Also check for categories array
  if (!existingCategory && tx.enrichment?.categorisation?.categories?.length > 0) {
    existingCategory = tx.enrichment.categorisation.categories[0];
  }
  
  if (!existingCategory && isoBankCode) {
    const subFamily = isoBankCode.subFamilyCode?.name;
    const family = isoBankCode.familyCode?.name;
    const domain = isoBankCode.domainCode?.name;
    
    if (subFamily && !GENERIC_CATEGORIES.includes(subFamily)) {
      existingCategory = subFamily;
    } else if (family && !GENERIC_CATEGORIES.includes(family)) {
      existingCategory = family;
    } else if (domain && !GENERIC_CATEGORIES.includes(domain)) {
      existingCategory = domain;
    }
  }

  // Infer merchant from description if not present
  let merchant = existingMerchant;
  if (!merchant) {
    const words = rawDescription.split(/[\s,.-]+/).filter((w: string) => w.length > 2);
    if (words.length > 0) {
      merchant = words
        .slice(0, 2)
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }
  }

  // Get inferred category - use existing category if available and not generic, otherwise infer
  const numericAmount = parseFloat(amount);
  let inferred: CategoryInfo;
  
  if (existingCategory && !GENERIC_CATEGORIES.includes(existingCategory)) {
    // Map existing category to our icon/color system
    inferred = mapCategoryToInfo(existingCategory, numericAmount);
  } else {
    inferred = inferCategory(rawDescription, merchant, numericAmount);
  }

  // Determine best display description
  let displayDescription = rawDescription;
  if (tx.remittanceInformationUnstructured && tx.remittanceInformationUnstructured.length > 2) {
    displayDescription = tx.remittanceInformationUnstructured;
  } else if (tx.reference && tx.reference.length > 2 && tx.reference !== rawDescription) {
    displayDescription = tx.reference;
  } else if (tx.transactionInformation && tx.transactionInformation.length > 0) {
    displayDescription = tx.transactionInformation.join(' ');
  }

  return {
    ...tx,
    _enriched: {
      amount: numericAmount,
      currency,
      description: displayDescription,
      merchant: merchant || 'Unknown',
      category: inferred.category,
      categoryIcon: inferred.icon,
      categoryColor: inferred.color,
      date: tx.bookingDateTime || tx.valueDateTime || tx.date || tx.timestamp,
      isCredit: numericAmount >= 0,
      originalCategory: existingCategory || null,
      inferredCategory: existingCategory ? null : inferred.category,
      payeeName,
      payerName,
    },
  };
};

// Map existing category names to our icon/color system
const mapCategoryToInfo = (category: string, amount: number): CategoryInfo => {
  const categoryLower = category.toLowerCase();
  
  // Income types
  if (amount > 0 || categoryLower.includes('income') || categoryLower.includes('salary')) {
    return { category, icon: '💰', color: CATEGORY_COLORS.green };
  }
  
  // Map common categories
  if (categoryLower.includes('grocer') || categoryLower.includes('food') || categoryLower.includes('supermarket')) {
    return { category, icon: '🛒', color: CATEGORY_COLORS.orange };
  }
  if (categoryLower.includes('dining') || categoryLower.includes('restaurant') || categoryLower.includes('cafe')) {
    return { category, icon: '🍽️', color: CATEGORY_COLORS.orange };
  }
  if (categoryLower.includes('shop') || categoryLower.includes('retail')) {
    return { category, icon: '🛍️', color: CATEGORY_COLORS.purple };
  }
  if (categoryLower.includes('subscri') || categoryLower.includes('stream')) {
    return { category, icon: '📺', color: CATEGORY_COLORS.blue };
  }
  if (categoryLower.includes('transport') || categoryLower.includes('travel') || categoryLower.includes('fuel')) {
    return { category, icon: '🚗', color: CATEGORY_COLORS.cyan };
  }
  if (categoryLower.includes('housing') || categoryLower.includes('rent') || categoryLower.includes('mortgage')) {
    return { category, icon: '🏠', color: CATEGORY_COLORS.indigo };
  }
  if (categoryLower.includes('util') || categoryLower.includes('bill') || categoryLower.includes('electric')) {
    return { category, icon: '💡', color: CATEGORY_COLORS.yellow };
  }
  if (categoryLower.includes('health') || categoryLower.includes('medical') || categoryLower.includes('pharmacy')) {
    return { category, icon: '🏥', color: CATEGORY_COLORS.pink };
  }
  if (categoryLower.includes('entertain') || categoryLower.includes('cinema') || categoryLower.includes('game')) {
    return { category, icon: '🎬', color: CATEGORY_COLORS.purple };
  }
  if (categoryLower.includes('cash') || categoryLower.includes('atm')) {
    return { category, icon: '💵', color: CATEGORY_COLORS.slate };
  }
  if (categoryLower.includes('transfer')) {
    return { category, icon: '↔️', color: CATEGORY_COLORS.slate };
  }
  if (categoryLower.includes('insurance')) {
    return { category, icon: '🛡️', color: CATEGORY_COLORS.blue };
  }
  if (categoryLower.includes('business') || categoryLower.includes('office')) {
    return { category, icon: '💼', color: CATEGORY_COLORS.slate };
  }
  
  // Default
  return { category, icon: '📌', color: CATEGORY_COLORS.slate };
};

// Helper to get category info from a transaction
export const getCategoryFromTransaction = (transaction: any): CategoryInfo => {
  // If already enriched, use that
  if (transaction._enriched) {
    return {
      category: transaction._enriched.category,
      icon: transaction._enriched.categoryIcon,
      color: transaction._enriched.categoryColor,
    };
  }
  
  // Otherwise enrich and return
  const enriched = enrichTransaction(transaction);
  return {
    category: enriched._enriched.category,
    icon: enriched._enriched.categoryIcon,
    color: enriched._enriched.categoryColor,
  };
};

// Batch enrich transactions
export const enrichTransactions = (transactions: any[]): any[] => {
  return transactions.map(enrichTransaction);
};
