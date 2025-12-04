import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, useTheme, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BottomTabParamList } from '../../types/navigation';

interface NavItem {
  name: keyof BottomTabParamList;
  label: string;
  icon: string;
  iconFocused: string;
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    label: 'Home',
    icon: 'view-dashboard-outline',
    iconFocused: 'view-dashboard',
  },
  {
    name: 'Accounts',
    label: 'Accounts',
    icon: 'credit-card-outline',
    iconFocused: 'credit-card',
  },
  {
    name: 'Insights',
    label: 'Insights',
    icon: 'chart-line-variant',
    iconFocused: 'chart-line',
  },
  {
    name: 'Payments',
    label: 'Payments',
    icon: 'bank-transfer-out',
    iconFocused: 'bank-transfer',
  },
  {
    name: 'Profile',
    label: 'Profile',
    icon: 'account-outline',
    iconFocused: 'account',
  },
];

interface SidebarProps {
  width?: number;
  activeName: string;
  onNavigate: (screenName: keyof BottomTabParamList) => void;
}

/**
 * Sidebar navigation component for web/desktop
 * Replaces bottom tabs with a vertical sidebar
 */
export const Sidebar: React.FC<SidebarProps> = ({ width = 280, activeName, onNavigate }) => {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          width,
          backgroundColor: theme.colors.surface,
          borderRightColor: theme.dark ? '#334155' : '#E5E7EB',
        },
      ]}
    >
      {/* Logo/Brand Section */}
      <View style={styles.header}>
        <Text
          variant="headlineMedium"
          style={{ fontWeight: '700', color: theme.colors.primary }}
        >
          Aspayr
        </Text>
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}
        >
          Financial Dashboard
        </Text>
      </View>

      <Divider style={{ marginVertical: 16 }} />

      {/* Navigation Items */}
      <ScrollView style={styles.navContainer}>
        {navItems.map((item) => {
          const isActive = activeName === item.name;
          const iconName = isActive ? item.iconFocused : item.icon;

          return (
            <TouchableOpacity
              key={item.name}
              style={[
                styles.navItem,
                isActive && {
                  backgroundColor: `${theme.colors.primary}15`,
                },
              ]}
              onPress={() => onNavigate(item.name)}
              activeOpacity={0.7}
            >
              <Icon
                name={iconName}
                size={24}
                color={isActive ? theme.colors.primary : theme.colors.onSurfaceVariant}
              />
              <Text
                variant="bodyLarge"
                style={[
                  styles.navText,
                  {
                    color: isActive ? theme.colors.primary : theme.colors.onSurface,
                    fontWeight: isActive ? '600' : '400',
                  },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Divider style={{ marginBottom: 16 }} />
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
        >
          © 2025 Aspayr
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: '100%',
    borderRightWidth: 1,
    flexDirection: 'column',
  },
  header: {
    padding: 24,
    paddingTop: 32,
  },
  navContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
    gap: 12,
  },
  navText: {
    flex: 1,
  },
  footer: {
    padding: 16,
  },
});
