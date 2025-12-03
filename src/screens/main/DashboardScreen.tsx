import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Text, useTheme, FAB, Surface } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BottomTabParamList } from '../../types/navigation';
import { Loading } from '../../components/common/Loading';
import { userStorage } from '../../utils/storage';
import { storageApi } from '../../api';
import { formatCurrency } from '../../utils/formatters';

type Props = NativeStackScreenProps<BottomTabParamList, 'Dashboard'>;

export const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
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
        const accountsData = await storageApi.getAccounts(userData.userUuid);
        setAccounts(accountsData || []);

        // Calculate total balance (simplified)
        const total = accountsData?.reduce((sum: number, acc: any) => {
          return sum + (acc.balance || 0);
        }, 0) || 0;
        setTotalBalance(total);
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
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>
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
        {accounts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Accounts</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Accounts')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>

            {accounts.slice(0, 3).map((account, index) => (
              <Surface
                key={index}
                style={styles.accountCard}
                elevation={0}
              >
                <TouchableOpacity
                  style={styles.accountCardInner}
                  onPress={() => navigation.navigate('Accounts')}
                >
                  <View style={styles.accountIconContainer}>
                    <Text style={styles.accountEmoji}>🏦</Text>
                  </View>
                  <View style={styles.accountDetails}>
                    <Text style={styles.accountName}>
                      {account.institutionName || 'Bank Account'}
                    </Text>
                    <Text style={styles.accountType}>
                      {account.accountType || account.type || 'Account'}
                    </Text>
                  </View>
                  <Text style={styles.accountBalance}>
                    {formatCurrency(account.balance || 0, account.currency || 'EUR')}
                  </Text>
                </TouchableOpacity>
              </Surface>
            ))}
          </View>
        )}

        {/* Empty State */}
        {accounts.length === 0 && (
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  greeting: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  profileButton: {
    padding: 4,
  },
  // Onboarding Banner
  onboardingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3E8FF',
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
    color: '#1F2937',
    marginBottom: 2,
  },
  bannerSubtext: {
    fontSize: 13,
    color: '#6B7280',
  },
  bannerButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  bannerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Balance Card
  balanceCard: {
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#8B5CF6',
    marginBottom: 8,
  },
  accountCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  // Quick Actions
  quickActions: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
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
    backgroundColor: '#F3F4F6',
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
    color: '#6B7280',
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
    color: '#8B5CF6',
  },
  // Account Card
  accountCard: {
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
    color: '#1F2937',
    marginBottom: 2,
  },
  accountType: {
    fontSize: 13,
    color: '#6B7280',
  },
  accountBalance: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  // Empty State
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
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
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#8B5CF6',
    borderRadius: 28,
  },
});
