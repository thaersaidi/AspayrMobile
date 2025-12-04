import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ResponsiveCard } from './ResponsiveCard';
import { useResponsive } from '../../hooks/useResponsive';

interface AccountCardProps {
  accountName: string;
  accountType?: string;
  accountNumber?: string;
  balance: number;
  currency?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress?: () => void;
}

/**
 * Account card that displays horizontally on web and vertically on mobile
 */
export const AccountCard: React.FC<AccountCardProps> = ({
  accountName,
  accountType,
  accountNumber,
  balance,
  currency = 'GBP',
  icon = 'bank',
  onPress,
}) => {
  const theme = useTheme();
  const { isDesktop } = useResponsive();

  const formattedBalance = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(balance);

  // Mask account number (show last 4 digits)
  const maskedAccountNumber = accountNumber
    ? `****${accountNumber.slice(-4)}`
    : undefined;

  return (
    <ResponsiveCard onPress={onPress} horizontal="auto">
      <View style={[styles.container, isDesktop && styles.horizontalContainer]}>
        {/* Icon Section */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${theme.colors.primary}15` },
          ]}
        >
          <MaterialCommunityIcons
            name={icon}
            size={28}
            color={theme.colors.primary}
          />
        </View>

        {/* Account Details */}
        <View style={[styles.detailsContainer, isDesktop && styles.detailsContainerHorizontal]}>
          <Text variant="titleMedium" style={{ fontWeight: '600' }}>
            {accountName}
          </Text>
          <View style={styles.metaRow}>
            {accountType && (
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {accountType}
              </Text>
            )}
            {maskedAccountNumber && (
              <>
                {accountType && (
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant, marginHorizontal: 8 }}
                  >
                    •
                  </Text>
                )}
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {maskedAccountNumber}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Balance */}
        <View style={[styles.balanceContainer, isDesktop && styles.balanceContainerHorizontal]}>
          <Text
            variant="titleLarge"
            style={{
              fontWeight: '700',
              color: balance >= 0 ? theme.colors.primary : theme.colors.error,
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
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailsContainer: {
    marginBottom: 12,
  },
  detailsContainerHorizontal: {
    flex: 1,
    marginBottom: 0,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  balanceContainer: {
    marginTop: 4,
  },
  balanceContainerHorizontal: {
    marginTop: 0,
    minWidth: 150,
    alignItems: 'flex-end',
  },
});
