import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  FlatList,
  TouchableOpacity,
  SectionList,
  Image,
} from 'react-native';
import { Text, useTheme, Searchbar, SegmentedButtons, Surface, Button } from 'react-native-paper';
import { StackScreenProps } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { BottomTabParamList } from '../../types/navigation';
import { Loading } from '../../components/common/Loading';
import { userStorage } from '../../utils/storage';
import { storageApi, bankingApi } from '../../api';
import { formatCurrency, formatRelativeTime } from '../../utils/formatters';
import { enrichTransaction, getCategoryFromTransaction, CategoryInfo } from '../../utils/enrichment';
import { AuthRequest, Institution } from '../../types/banking';
import { User } from '../../types/auth';

type Props = StackScreenProps<BottomTabParamList, 'Accounts'>;

const TRANSACTIONS_PAGE_SIZE = 20;

const normalizeAccounts = (rawAccounts: any[] = []) => {
  const seen = new Map<string, any>();
  rawAccounts.forEach((account) => {
    const key = account.id || `${account.accountNumber || ''}-${account.type || ''}-${account.accountName || ''}`;
    if (!seen.has(key)) {
      seen.set(key, account);
    } else {
      const existing = seen.get(key);
      // Preserve highest balance or enriched fields if duplicates exist
      if ((existing.balance || 0) === 0 && (account.balance || 0) !== 0) {
        seen.set(key, { ...existing, balance: account.balance });
      }
    }
  });
  return Array.from(seen.values());
};

const getTransactionAccountId = (transaction: any): string | undefined => {
  return (
    transaction?.accountId ||
    transaction?._accountId ||
    transaction?.account?.id ||
    transaction?._account?.id
  );
};

export const AccountsScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedAccountId, setSelectedAccountId] = useState<'all' | string>('all');
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [authorizedBanks, setAuthorizedBanks] = useState<AuthRequest[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setTransactionsPage(1);
    filterTransactions();
  }, [searchQuery, activeTab, transactions, selectedAccountId]);

  const loadData = async () => {
    try {
      const user = await userStorage.getUser() as User | null;
      if (user?.userUuid) {
        const [accountsData, transactionsData, authRequestsData, institutionsData] = await Promise.all([
          storageApi.getAccounts(user.userUuid),
          storageApi.getTransactions(user.userUuid),
          bankingApi.getAuthRequests(user.userUuid).catch(() => ({ data: [] })),
          bankingApi.getInstitutions().catch(() => ({ institutions: [] })),
        ]);

        setAccounts(normalizeAccounts(accountsData || []));
        // Enrich all transactions with category inference
        const enrichedTransactions = (transactionsData || []).map(enrichTransaction);
        setTransactions(enrichedTransactions);
        
        // Filter only AUTHORIZED banks
        const authRequests = authRequestsData.data || authRequestsData || [];
        const authorized = Array.isArray(authRequests) 
          ? authRequests.filter((r: AuthRequest) => r.status === 'AUTHORIZED')
          : [];
        setAuthorizedBanks(authorized);
        
        // Store institutions for bank logos/names
        setInstitutions(institutionsData.institutions || []);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Filter by tab
    if (activeTab === 'incoming') {
      filtered = filtered.filter(t => (t.amount || t.transactionAmount?.amount || 0) > 0);
    } else if (activeTab === 'outgoing') {
      filtered = filtered.filter(t => (t.amount || t.transactionAmount?.amount || 0) < 0);
    }

    // Filter by selected account
    if (selectedAccountId !== 'all') {
      filtered = filtered.filter(t => getTransactionAccountId(t) === selectedAccountId);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.description?.toLowerCase().includes(query) ||
          t.amount?.toString().includes(query)
      );
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp || a.date).getTime();
      const dateB = new Date(b.timestamp || b.date).getTime();
      return dateB - dateA;
    });

    setFilteredTransactions(filtered);
  };

  // Get category info from enriched transaction
  const getCategoryInfo = (transaction: any): CategoryInfo => {
    return getCategoryFromTransaction(transaction);
  };

  // Get institution info by ID
  const getInstitution = (institutionId: string): Institution | undefined => {
    return institutions.find(i => i.id === institutionId);
  };

  // Get institution logo URL
  const getInstitutionLogo = (institution: Institution | undefined): string | null => {
    if (!institution) return null;
    const iconMedia = institution.media?.find(
      (m: any) => m.type === 'icon' || m.type === 'logo'
    );
    return iconMedia?.source || null;
  };

  // Group accounts by bank, supporting both institutionId and auth request id mappings
  const accountsByBank = useMemo(() => {
    type Group = { bank: AuthRequest; institution: Institution | undefined; accounts: any[] };
    const keyToGroup = new Map<string, Group>();
    const groups: Group[] = [];

    authorizedBanks.forEach((bank) => {
      const group: Group = {
        bank,
        institution: getInstitution(bank.institutionId),
        accounts: [],
      };
      groups.push(group);
      if (bank.id) {
        keyToGroup.set(bank.id, group);
      }
      if (bank.institutionId) {
        keyToGroup.set(bank.institutionId, group);
      }
    });

    accounts.forEach((account) => {
      const bankKey = account.institutionId || account.bankId;
      if (!bankKey) {
        return;
      }
      const matchedGroup = keyToGroup.get(bankKey);
      if (matchedGroup) {
        matchedGroup.accounts.push(account);
      }
    });

    return groups;
  }, [accounts, authorizedBanks, institutions]);

  const totalVisibleAccounts = useMemo(() => {
    return accountsByBank.reduce((sum, group) => sum + group.accounts.length, 0);
  }, [accountsByBank]);

  const accountMetaById = useMemo(() => {
    const meta: Record<string, { bankName: string; subtitle: string }> = {};
    accountsByBank.forEach(({ bank, institution, accounts: bankAccounts }) => {
      const bankName = institution?.name || bank.institutionId;
      bankAccounts.forEach((account) => {
        if (!account?.id) {
          return;
        }
        const subtitle = account.accountNumber
          ? `•••• ${account.accountNumber.slice(-4)}`
          : account.type || account.accountType || 'Current';
        meta[account.id] = { bankName, subtitle };
      });
    });
    return meta;
  }, [accountsByBank]);

  // Calculate totals
  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  const bankCount = accountsByBank.length;
  const accountCount = totalVisibleAccounts;
  const transactionsByAccount = useMemo(() => {
    const counts: Record<string, number> = {};
    transactions.forEach(tx => {
      const accId = getTransactionAccountId(tx);
      if (accId) {
        counts[accId] = (counts[accId] || 0) + 1;
      }
    });
    return counts;
  }, [transactions]);
  const handleAccountRowPress = (accountId?: string) => {
    if (!accountId) {
      setSelectedAccountId('all');
      return;
    }
    setSelectedAccountId(prev => (prev === accountId ? 'all' : accountId));
  };

  const selectedAccount = useMemo(() => {
    if (selectedAccountId === 'all') {
      return null;
    }
    return accounts.find(acc => acc.id === selectedAccountId) || null;
  }, [selectedAccountId, accounts]);

  const selectedAccountMeta = selectedAccountId !== 'all'
    ? accountMetaById[selectedAccountId] || null
    : null;

  const displayedTransactions = filteredTransactions.slice(0, transactionsPage * TRANSACTIONS_PAGE_SIZE);
  const canLoadMore = displayedTransactions.length < filteredTransactions.length;
  const handleLoadMoreTransactions = () => {
    if (canLoadMore) {
      setTransactionsPage((prev) => prev + 1);
    }
  };

  if (loading) {
    return <Loading message="Loading accounts..." />;
  }

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Accounts</Text>
          <TouchableOpacity
            style={styles.addBankButton}
            onPress={() => (navigation as any).getParent()?.navigate('LinkBank')}
          >
            <Icon name="plus" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Total Balance Card */}
        <Surface style={styles.balanceCard} elevation={1}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(totalBalance)}</Text>
          <Text style={styles.accountCountText}>
            {bankCount} {bankCount === 1 ? 'bank' : 'banks'} • {accountCount} {accountCount === 1 ? 'account' : 'accounts'}
          </Text>
        </Surface>

        {/* Connected Banks Section */}
        {accountsByBank.length > 0 ? (
          <View style={styles.banksSection}>
            <Text style={styles.sectionTitle}>Connected Banks</Text>
            {accountsByBank.map(({ bank, institution, accounts: bankAccounts }) => {
              const logoUrl = getInstitutionLogo(institution);
              const bankBalance = bankAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
              
              return (
                <Surface key={bank.id} style={styles.bankCard} elevation={1}>
                  {/* Bank Header */}
                  <View style={styles.bankHeader}>
                    <View style={styles.bankLogo}>
                      {logoUrl ? (
                        <Image
                          source={{ uri: logoUrl }}
                          style={styles.bankLogoImage}
                          resizeMode="contain"
                        />
                      ) : (
                        <View style={styles.bankLogoPlaceholder}>
                          <Text style={styles.bankLogoInitials}>
                            {(institution?.name || bank.institutionId).slice(0, 2).toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.bankInfo}>
                      <Text style={styles.bankName}>{institution?.name || bank.institutionId}</Text>
                      <Text style={styles.bankMeta}>
                        {bankAccounts.length} {bankAccounts.length === 1 ? 'account' : 'accounts'}
                      </Text>
                    </View>
                    <Text style={styles.bankBalance}>{formatCurrency(bankBalance)}</Text>
                  </View>
                  
                  {/* Bank Accounts */}
                  {bankAccounts.map((account, index) => {
                    const isSelected = selectedAccountId === account.id;
                    const txCount = transactionsByAccount[account.id] || 0;
                    return (
                      <TouchableOpacity
                        key={account.id || index}
                        style={[styles.accountRow, isSelected && styles.accountRowSelected]}
                        activeOpacity={0.8}
                        onPress={() => handleAccountRowPress(account.id)}
                      >
                      <View style={styles.accountIcon}>
                        <Icon
                          name={account.type === 'SAVINGS' ? 'piggy-bank' : 'wallet'}
                          size={18}
                          color={theme.colors.onSurfaceVariant}
                        />
                      </View>
                      <View style={styles.accountInfo}>
                        <Text style={styles.accountName} numberOfLines={1}>
                          {account.name || account.accountName || 'Account'}
                        </Text>
                        <Text style={styles.accountNumber}>
                          {account.accountNumber ? `•••• ${account.accountNumber.slice(-4)}` : account.type || 'Current'}
                        </Text>
                        <Text style={styles.accountTxCount}>{txCount} {txCount === 1 ? 'transaction' : 'transactions'}</Text>
                      </View>
                      <Text style={styles.accountBalance}>{formatCurrency(account.balance || 0)}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </Surface>
              );
            })}
          </View>
        ) : (
          <View style={styles.noBanksContainer}>
            <Icon name="bank-off" size={48} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.noBanksTitle}>No Banks Connected</Text>
            <Text style={styles.noBanksText}>Link a bank account to see your accounts and transactions</Text>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => (navigation as any).getParent()?.navigate('LinkBank')}
            >
              <Text style={styles.linkButtonText}>Link Your First Bank</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Transactions Section */}
        {transactions.length > 0 && (
          <View style={styles.transactionsSection}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>

            {/* Filter Tabs */}
            <View style={styles.tabContainer}>
              <SegmentedButtons
                value={activeTab}
                onValueChange={setActiveTab}
                buttons={[
                  { value: 'all', label: 'All' },
                  { value: 'incoming', label: 'Incoming' },
                  { value: 'outgoing', label: 'Outgoing' },
                ]}
                style={styles.segmentedButtons}
              />
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Searchbar
                placeholder="Search transactions..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchBar}
                inputStyle={styles.searchInput}
                iconColor={theme.colors.onSurfaceVariant}
              />
            </View>

            {/* Transactions List */}
            {displayedTransactions.length > 0 ? (
              <>
              {selectedAccount && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterText} numberOfLines={1}>
                    Showing transactions for {selectedAccountMeta?.bankName || 'Bank'} • {selectedAccountMeta?.subtitle || 'Account'}
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedAccountId('all')}>
                    <Text style={styles.clearFilterText}>Clear filter</Text>
                  </TouchableOpacity>
                </View>
              )}
              {displayedTransactions.map((item, index) => {
                const info = getCategoryInfo(item);
                const enriched = item._enriched;
                const amount = enriched?.amount ?? item.amount ?? item.transactionAmount?.amount ?? 0;
                const isExpense = amount < 0;
                const displayName = enriched?.merchant || enriched?.description || item.description || 'Transaction';
                const category = enriched?.category || 'Other';

                return (
                  <TouchableOpacity
                    key={item.id || index}
                    style={styles.transactionRow}
                    onPress={() =>
                      (navigation as any).getParent()?.navigate('TransactionDetail', {
                        transactionId: item.id,
                      })
                    }
                    activeOpacity={0.7}
                  >
                    <View style={[styles.txIcon, { backgroundColor: info.color + '20' }]}>
                      <Text style={styles.txEmoji}>{info.icon}</Text>
                    </View>

                    <View style={styles.txInfo}>
                      <Text style={styles.txDescription} numberOfLines={1}>
                        {displayName}
                      </Text>
                      <Text style={styles.txDate}>
                        {category} • {formatRelativeTime(enriched?.date || item.timestamp || item.date)}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.txAmount,
                        { color: isExpense ? '#DC2626' : '#059669' },
                      ]}
                    >
                      {isExpense ? '-' : '+'}{formatCurrency(Math.abs(amount))}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {canLoadMore && (
                <Button
                  mode="outlined"
                  onPress={handleLoadMoreTransactions}
                  style={styles.loadMoreButton}
                >
                  Show more
                </Button>
              )}
              </>
            ) : (
              <View style={styles.noTransactionsContainer}>
                <Text style={styles.noTransactionsText}>
                  {searchQuery ? 'No matching transactions' : 'No transactions found'}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  addBankButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceCard: {
    marginHorizontal: 20,
    marginVertical: 12,
    padding: 20,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  accountCountText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 12,
  },
  banksSection: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  bankCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  bankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceVariant,
  },
  bankLogo: {
    width: 44,
    height: 44,
    marginRight: 12,
  },
  bankLogoImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceVariant,
  },
  bankLogoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bankLogoInitials: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
  },
  bankInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  bankMeta: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  bankBalance: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceVariant,
  },
  accountRowSelected: {
    backgroundColor: theme.colors.primaryContainer,
    borderRadius: 12,
    paddingHorizontal: 8,
  },
  accountIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurface,
  },
  accountNumber: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 1,
  },
  accountTxCount: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  accountBalance: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  noBanksContainer: {
    alignItems: 'center',
    padding: 40,
    marginHorizontal: 20,
  },
  noBanksTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginTop: 16,
  },
  noBanksText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  transactionsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  tabContainer: {
    paddingVertical: 8,
  },
  segmentedButtons: {
    backgroundColor: theme.colors.surfaceVariant,
  },
  searchContainer: {
    paddingVertical: 8,
  },
  searchBar: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    elevation: 0,
  },
  searchInput: {
    fontSize: 15,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  txIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txEmoji: {
    fontSize: 22,
  },
  txInfo: {
    flex: 1,
  },
  txDescription: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 2,
  },
  txDate: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  noTransactionsContainer: {
    padding: 24,
    alignItems: 'center',
  },
  noTransactionsText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.primaryContainer,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  activeFilterText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.onPrimaryContainer,
    marginRight: 8,
  },
  clearFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  linkButton: {
    marginTop: 24,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  linkButtonText: {
    color: theme.colors.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  loadMoreButton: {
    marginTop: 12,
    borderRadius: 12,
    borderColor: theme.colors.outline,
  },
});
