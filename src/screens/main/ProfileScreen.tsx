import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Text, useTheme, Switch, Divider } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BottomTabParamList } from '../../types/navigation';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { userStorage, secureStorage } from '../../utils/storage';

type Props = NativeStackScreenProps<BottomTabParamList, 'Profile'>;

export const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const [user, setUser] = useState<any>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const userData = await userStorage.getUser();
    setUser(userData);

    const themePreference = await userStorage.getTheme();
    setDarkMode(themePreference === 'dark');

    const biometric = await userStorage.isBiometricEnabled();
    setBiometricEnabled(biometric);
  };

  const toggleDarkMode = async () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    await userStorage.setTheme(newValue ? 'dark' : 'light');
    // Note: Full theme switch would require app-level state management
  };

  const toggleBiometric = async () => {
    const newValue = !biometricEnabled;
    setBiometricEnabled(newValue);
    await userStorage.setBiometricEnabled(newValue);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await userStorage.removeUser();
            await secureStorage.removeCredentials();
            // Navigation will be handled by AppNavigator checking auth status
          },
        },
      ]
    );
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
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Profile Header */}
      <Card style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: theme.colors.primaryContainer },
            ]}
          >
            <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
              {(user?.userDetails?.displayName || user?.username || 'U')
                .charAt(0)
                .toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.colors.onSurface }]}>
              {user?.userDetails?.displayName || 'User'}
            </Text>
            <Text
              style={[styles.profileEmail, { color: theme.colors.onSurfaceVariant }]}
            >
              {user?.username || user?.userDetails?.email || 'email@example.com'}
            </Text>
          </View>
        </View>
      </Card>

      {/* Settings Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Preferences
        </Text>

        <Card style={styles.settingsCard}>
          <SettingItem
            icon="theme-light-dark"
            label="Dark Mode"
            value={darkMode}
            onValueChange={toggleDarkMode}
            theme={theme}
          />
          <Divider />
          <SettingItem
            icon="fingerprint"
            label="Biometric Authentication"
            value={biometricEnabled}
            onValueChange={toggleBiometric}
            theme={theme}
          />
        </Card>
      </View>

      {/* Security Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Security
        </Text>

        <Card style={styles.menuCard}>
          <MenuItem
            icon="lock-reset"
            label="Change PIN"
            onPress={handleChangePin}
            theme={theme}
          />
          <Divider />
          <MenuItem
            icon="shield-check"
            label="Security Settings"
            onPress={() => Alert.alert('Coming Soon', 'Security settings will be available soon')}
            theme={theme}
          />
        </Card>
      </View>

      {/* App Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          About
        </Text>

        <Card style={styles.menuCard}>
          <MenuItem
            icon="information"
            label="App Version"
            value="0.0.1"
            theme={theme}
            hideArrow
          />
          <Divider />
          <MenuItem
            icon="help-circle"
            label="Help & Support"
            onPress={() => Alert.alert('Help', 'Support resources coming soon')}
            theme={theme}
          />
          <Divider />
          <MenuItem
            icon="file-document"
            label="Privacy Policy"
            onPress={() => Alert.alert('Privacy', 'Privacy policy coming soon')}
            theme={theme}
          />
        </Card>
      </View>

      {/* Logout Button */}
      <Button
        mode="outlined"
        onPress={handleLogout}
        style={[styles.logoutButton, { borderColor: theme.colors.error }]}
      >
        <Text style={{ color: theme.colors.error }}>Logout</Text>
      </Button>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.colors.onSurfaceVariant }]}>
          Aspayr Mobile v0.0.1
        </Text>
        <Text style={[styles.footerText, { color: theme.colors.onSurfaceVariant }]}>
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
