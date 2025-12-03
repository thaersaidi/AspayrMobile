import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Text, useTheme, Switch, Divider } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BottomTabParamList } from '../../types/navigation';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { userStorage, secureStorage } from '../../utils/storage';
import { useThemeContext } from '../../contexts/ThemeContext';

type Props = NativeStackScreenProps<BottomTabParamList, 'Profile'>;

export const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const paperTheme = useTheme();
  const { theme, toggleTheme } = useThemeContext();
  const [user, setUser] = useState<any>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const userData = await userStorage.getUser();
    setUser(userData);

    const biometric = await userStorage.isBiometricEnabled();
    setBiometricEnabled(biometric);
  };

  const toggleBiometric = async () => {
    const newValue = !biometricEnabled;
    setBiometricEnabled(newValue);
    await userStorage.setBiometricEnabled(newValue);
  };

  const handleLogout = async () => {
    console.log('[ProfileScreen] Logout button pressed!');

    try {
      console.log('[Logout] Starting logout process...');

      // Clear session verification flag first (triggers auth check)
      await userStorage.setSessionVerified(false);

      // Clear all user data
      await userStorage.removeUser();

      // Clear all credentials (PIN, tokens, etc.)
      await secureStorage.removeCredentials();
      await secureStorage.removeCredentials('aspayr_pin');
      await secureStorage.removeAccessToken();

      console.log('[Logout] Logout complete. Redirecting to login...');

      // For web, reload the page to trigger auth check
      if (Platform.OS === 'web') {
        setTimeout(() => {
          window.location.reload();
        }, 100);
      } else {
        // For native, the AppNavigator interval will detect the logout
        // within 1 second and redirect automatically
      }
    } catch (error) {
      console.error('[Logout] Error during logout:', error);
    }
  };

  const handleChangePin = () => {
    Alert.alert(
      'Change PIN',
      'PIN change feature coming soon!',
      [{ text: 'OK' }]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: paperTheme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Profile Header */}
      <Card style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: paperTheme.colors.primaryContainer },
            ]}
          >
            <Text style={[styles.avatarText, { color: paperTheme.colors.primary }]}>
              {(user?.userDetails?.displayName || user?.username || 'U')
                .charAt(0)
                .toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: paperTheme.colors.onSurface }]}>
              {user?.userDetails?.displayName || 'User'}
            </Text>
            <Text
              style={[styles.profileEmail, { color: paperTheme.colors.onSurfaceVariant }]}
            >
              {user?.username || user?.userDetails?.email || 'email@example.com'}
            </Text>
          </View>
        </View>
      </Card>

      {/* Settings Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: paperTheme.colors.onSurface }]}>
          Preferences
        </Text>

        <Card style={styles.settingsCard}>
          <SettingItem
            icon="theme-light-dark"
            label="Dark Mode"
            value={theme === 'dark'}
            onValueChange={toggleTheme}
            theme={paperTheme}
          />
          <Divider />
          <SettingItem
            icon="fingerprint"
            label="Biometric Authentication"
            value={biometricEnabled}
            onValueChange={toggleBiometric}
            theme={paperTheme}
          />
        </Card>
      </View>

      {/* Security Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: paperTheme.colors.onSurface }]}>
          Security
        </Text>

        <Card style={styles.menuCard}>
          <MenuItem
            icon="lock-reset"
            label="Change PIN"
            onPress={handleChangePin}
            theme={paperTheme}
          />
          <Divider />
          <MenuItem
            icon="shield-check"
            label="Security Settings"
            onPress={() => Alert.alert('Coming Soon', 'Security settings will be available soon')}
            theme={paperTheme}
          />
        </Card>
      </View>

      {/* App Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: paperTheme.colors.onSurface }]}>
          About
        </Text>

        <Card style={styles.menuCard}>
          <MenuItem
            icon="information"
            label="App Version"
            value="0.0.1"
            theme={paperTheme}
            hideArrow
          />
          <Divider />
          <MenuItem
            icon="help-circle"
            label="Help & Support"
            onPress={() => Alert.alert('Help', 'Support resources coming soon')}
            theme={paperTheme}
          />
          <Divider />
          <MenuItem
            icon="file-document"
            label="Privacy Policy"
            onPress={() => Alert.alert('Privacy', 'Privacy policy coming soon')}
            theme={paperTheme}
          />
        </Card>
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={[styles.logoutButton, { borderColor: paperTheme.colors.error }]}
        onPress={handleLogout}
      >
        <Text style={[styles.logoutButtonText, { color: paperTheme.colors.error }]}>
          Logout
        </Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: paperTheme.colors.onSurfaceVariant }]}>
          Aspayr Mobile v0.0.1
        </Text>
        <Text style={[styles.footerText, { color: paperTheme.colors.onSurfaceVariant }]}>
          Banking + AI Financial Assistant
        </Text>
      </View>
    </ScrollView>
  );
};

const SettingItem: React.FC<{
  icon: string;
  label: string;
  value: boolean;
  onValueChange: () => void;
  theme: any;
}> = ({ icon, label, value, onValueChange, theme }) => (
  <View style={styles.settingItem}>
    <Icon name={icon} size={24} color={theme.colors.onSurface} style={styles.itemIcon} />
    <Text style={[styles.itemLabel, { color: theme.colors.onSurface }]}>{label}</Text>
    <Switch value={value} onValueChange={onValueChange} />
  </View>
);

const MenuItem: React.FC<{
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  theme: any;
  hideArrow?: boolean;
}> = ({ icon, label, value, onPress, theme, hideArrow }) => (
  <TouchableOpacity
    style={styles.menuItem}
    onPress={onPress}
    disabled={!onPress}
  >
    <Icon name={icon} size={24} color={theme.colors.onSurface} style={styles.itemIcon} />
    <Text style={[styles.itemLabel, { color: theme.colors.onSurface }]}>{label}</Text>
    {value && (
      <Text style={[styles.itemValue, { color: theme.colors.onSurfaceVariant }]}>
        {value}
      </Text>
    )}
    {!hideArrow && onPress && (
      <Icon name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  profileCard: {
    marginBottom: 24,
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },
  settingsCard: {
    padding: 0,
  },
  menuCard: {
    padding: 0,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  itemIcon: {
    marginRight: 16,
  },
  itemLabel: {
    flex: 1,
    fontSize: 16,
  },
  itemValue: {
    fontSize: 14,
    marginRight: 8,
  },
  logoutButton: {
    marginVertical: 24,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 12,
    marginBottom: 4,
  },
});
