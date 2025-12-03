import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Text, useTheme, FAB, Surface } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BottomTabParamList } from '../../types/navigation';
import { Loading } from '../../components/common/Loading';
import { userStorage } from '../../utils/storage';
import { storageApi, bankingApi } from '../../api';
import { AuthRequest, Institution } from '../../types/banking';
import { formatCurrency } from '../../utils/formatters';

type Props = NativeStackScreenProps<BottomTabParamList, 'Dashboard'>;

export const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [authorizedBanks, setAuthorizedBanks] = useState<AuthRequest[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [banksOverview, setBanksOverview] = useState<
    {
      id: string;
      institutionId: string;
      name: string;
      accountCount: number;
      balance: number;
      logoUrl: string | null;
    }
  >([]);
  const [showOnboardingBanner, setShowOnboardingBanner] = useState(false);

  useEffect(() => {
    loadDashboardData();
    checkOnboardingStatus();
    
    // Re-check onboarding status when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      checkOnboardingStatus();
    });
    
    return unsubscribe;
  }, [navigation]);

  const checkOnboardingStatus = async () => {
    const completed = await userStorage.isOnboardingCompleted();
    setShowOnboardingBanner(!completed);
  };

  const loadDashboardData = async () => {
    try {
      const userData = await userStorage.getUser();
      setUser(userData);

      if (userData?.userUuid) {
        const [accountsData, authRequestsData, institutionsData] = await Promise.all([
          storageApi.getAccounts(userData.userUuid),
          bankingApi.getAuthRequests(userData.userUuid).catch(() => ({ data: [] })),
          bankingApi.getInstitutions().catch(() => ({ institutions: [] })),
        ]);

        const authRequests = authRequestsData?.data || authRequestsData || [];
        const authorizedBanks = Array.isArray(authRequests)
          ? authRequests.filter((req: any) => req.status === 'AUTHORIZED')
          : [];
        const authorizedBankIds = new Set(
          authorizedBanks.map((bank: any) => bank.institutionId).filter(Boolean)
        );

        setAuthorizedBanks(authorizedBanks);
        const institutionsList = institutionsData?.institutions || [];
        setInstitutions(institutionsList);

        const visibleAccounts = (accountsData || []).filter((account: any) => {
          const bankId = account.institutionId || account.bankId;
          return bankId ? authorizedBankIds.has(bankId) : false;
        });
        setAccounts(visibleAccounts);

        // Calculate total balance (simplified)
        const total = visibleAccounts.reduce((sum: number, acc: any) => {
          return sum + (acc.balance || 0);
        }, 0);
        setTotalBalance(total);

        const groupedByBank = new Map<string, { balance: number; accountCount: number }>();
        visibleAccounts.forEach((account: any) => {
          const bankId = account.institutionId || account.bankId;
          if (!bankId) return;
          const entry = groupedByBank.get(bankId) || { balance: 0, accountCount: 0 };
          entry.balance += account.balance || 0;
          entry.accountCount += 1;
          groupedByBank.set(bankId, entry);
        });

        const overview = authorizedBanks.map((bank: AuthRequest) => {
          const bankId = bank.institutionId;
          const aggregates = bankId ? groupedByBank.get(bankId) : undefined;
          const institution = institutionsList.find((inst: Institution) => inst.id === bankId);
          const logoUrl = (() => {
            if (!institution?.media) return null;
            const mediaItem = institution.media.find(
              (media) => media.type === 'icon' || media.type === 'logo'
            );
            return mediaItem?.source || null;
          })();
          return {
            id: bank.id,
            institutionId: bankId,
            name: institution?.name || bank.institutionId || 'Bank',
            accountCount: aggregates?.accountCount || 0,
            balance: aggregates?.balance || 0,
            logoUrl,
          };
        });
        setBanksOverview(overview);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  if (loading) {
    return <Loading message="Loading your dashboard..." />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
              {user?.userDetails?.displayName || user?.username || 'User'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Icon name="account-circle" size={40} color="#8B5CF6" />
          </TouchableOpacity>
        </View>

        {/* Onboarding Banner */}
        {showOnboardingBanner && (
          <Surface style={styles.onboardingBanner} elevation={0}>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerEmoji}>✨</Text>
              <View style={styles.bannerTextContainer}>
                <Text style={styles.bannerTitle}>Personalize Your Experience</Text>
                <Text style={styles.bannerSubtext}>Complete our quick quiz</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.bannerButton}
              onPress={() => (navigation as any).getParent()?.navigate('OnboardingQuiz')}
            >
              <Text style={styles.bannerButtonText}>Start</Text>
            </TouchableOpacity>
          </Surface>
        )}

        {/* Total Balance Card */}
        <Surface style={styles.balanceCard} elevation={1}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(totalBalance)}</Text>
          <Text style={styles.accountCount}>
            {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'} linked
          </Text>
        </Surface>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <QuickActionButton
              emoji="🏦"
              label="Link Bank"
              onPress={() => (navigation as any).getParent()?.navigate('LinkBank')}
            />
            <QuickActionButton
              emoji="💬"
              label="AI Chat"
              onPress={() => (navigation as any).getParent()?.navigate('Chat')}
            />
            <QuickActionButton
              emoji="📋"
              label="Quiz"
              onPress={() => (navigation as any).getParent()?.navigate('OnboardingQuiz')}
            />
            <QuickActionButton
              emoji="🗺️"
              label="Tour"
              onPress={() => (navigation as any).getParent()?.navigate('GuidedTour')}
            />
          </View>
        </View>

        {/* Recent Accounts */}
        {banksOverview.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Connected Banks</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Accounts')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>

            {banksOverview.slice(0, 3).map((bank) => (
              <Surface
                key={bank.id}
                style={styles.accountCard}
                elevation={0}
              >
                <TouchableOpacity
                  style={styles.accountCardInner}
                  onPress={() => navigation.navigate('Accounts')}
                >
                  <View style={styles.accountIconContainer}>
                    {bank.logoUrl ? (
                      <Image
                        source={{ uri: bank.logoUrl }}
                        style={styles.bankLogoImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <Text style={styles.accountEmoji}>🏦</Text>
                    )}
                  </View>
                  <View style={styles.accountDetails}>
                    <Text style={styles.accountName}>
                      {bank.name}
                    </Text>
                    <Text style={styles.accountType}>
                      {bank.accountCount} {bank.accountCount === 1 ? 'account' : 'accounts'}
                    </Text>
                  </View>
                  <Text style={styles.accountBalance}>
                    {formatCurrency(bank.balance || 0)}
                  </Text>
                </TouchableOpacity>
              </Surface>
            ))}
          </View>
        )}

        {/* Empty State */}
        {banksOverview.length === 0 && (
          <Surface style={styles.emptyCard} elevation={0}>
            <View style={styles.emptyIconContainer}>
              <Text style={styles.emptyEmoji}>🏦</Text>
            </View>
            <Text style={styles.emptyTitle}>No Accounts Yet</Text>
            <Text style={styles.emptyText}>
              Link your bank accounts to get started with smart financial management
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => (navigation as any).getParent()?.navigate('LinkBank')}
            >
              <Text style={styles.emptyButtonText}>Link Your First Bank</Text>
            </TouchableOpacity>
          </Surface>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={styles.fab}
        color="#FFFFFF"
        onPress={() => (navigation as any).getParent()?.navigate('LinkBank')}
      />
    </View>
  );
};

const QuickActionButton: React.FC<{
  emoji: string;
  label: string;
  onPress: () => void;
}> = ({ emoji, label, onPress }) => (
  <TouchableOpacity style={styles.actionButton} onPress={onPress}>
    <View style={styles.actionIconContainer}>
      <Text style={styles.actionEmoji}>{emoji}</Text>
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  greeting: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  profileButton: {
    padding: 4,
  },
  // Onboarding Banner
  onboardingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.primaryContainer,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bannerEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 2,
  },
  bannerSubtext: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
  },
  bannerButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  bannerButtonText: {
    color: theme.colors.onPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  // Balance Card
  balanceCard: {
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
  },
  balanceLabel: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  accountCount: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  // Quick Actions
  quickActions: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionEmoji: {
    fontSize: 24,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  // Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  // Account Card
  accountCard: {
    marginBottom: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
  },
  accountCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  accountIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bankLogoImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
  },
  accountEmoji: {
    fontSize: 22,
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 2,
  },
  accountType: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
  },
  accountBalance: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  // Empty State
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyEmoji: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
  },
  emptyButtonText: {
    color: theme.colors.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: theme.colors.primary,
    borderRadius: 28,
  },
});
