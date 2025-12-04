import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { ResponsiveCard, CardSection } from './ResponsiveCard';
import { useResponsive } from '../../hooks/useResponsive';

interface BankCardProps {
  bankName: string;
  bankLogo?: string;
  accountCount?: number;
  totalBalance: number;
  currency?: string;
  onPress?: () => void;
}

/**
 * Bank overview card that displays horizontally on web and vertically on mobile
 */
export const BankCard: React.FC<BankCardProps> = ({
  bankName,
  bankLogo,
  accountCount,
  totalBalance,
  currency = 'GBP',
  onPress,
}) => {
  const theme = useTheme();
  const { isDesktop } = useResponsive();

  const formattedBalance = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(totalBalance);

  return (
    <ResponsiveCard onPress={onPress} horizontal="auto">
      <View style={[styles.container, isDesktop && styles.horizontalContainer]}>
        {/* Bank Logo/Icon Section */}
        <View style={[styles.iconSection, isDesktop && styles.iconSectionHorizontal]}>
          {bankLogo ? (
            <Image source={{ uri: bankLogo }} style={styles.logo} />
          ) : (
            <View
              style={[
                styles.iconPlaceholder,
                { backgroundColor: theme.colors.primaryContainer },
              ]}
            >
              <Text variant="titleLarge" style={{ color: theme.colors.primary }}>
                {bankName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Bank Details Section */}
        <View style={[styles.detailsSection, isDesktop && styles.detailsSectionHorizontal]}>
          <Text variant="titleMedium" style={{ fontWeight: '600' }}>
            {bankName}
          </Text>
          {accountCount !== undefined && (
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}
            >
              {accountCount} {accountCount === 1 ? 'account' : 'accounts'}
            </Text>
          )}
        </View>

        {/* Balance Section */}
        <View style={[styles.balanceSection, isDesktop && styles.balanceSectionHorizontal]}>
          <Text
            variant="headlineSmall"
            style={{
              fontWeight: '700',
              color: theme.colors.primary,
              textAlign: isDesktop ? 'right' : 'left',
            }}
          >
            {formattedBalance}
          </Text>
        </View>
      </View>
    </ResponsiveCard>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    width: '100%',
  },
  horizontalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconSection: {
    marginBottom: 12,
    alignItems: 'center',
  },
  iconSectionHorizontal: {
    marginBottom: 0,
    alignItems: 'flex-start',
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  iconPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsSection: {
    marginBottom: 12,
  },
  detailsSectionHorizontal: {
    flex: 1,
    marginBottom: 0,
  },
  balanceSection: {
    marginTop: 4,
  },
  balanceSectionHorizontal: {
    marginTop: 0,
    minWidth: 150,
  },
});
