import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BottomTabParamList } from '../types/navigation';
import { useTheme } from 'react-native-paper';

// Import screens
import { DashboardScreen } from '../screens/main/DashboardScreen';
import { AccountsScreen } from '../screens/main/AccountsScreen';
import { InsightsScreen } from '../screens/main/InsightsScreen';
import { PaymentsScreen } from '../screens/main/PaymentsScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';

// Placeholder for remaining screens
const PlaceholderScreen = ({ route }: any) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{route.name} Screen</Text>
      <Text style={styles.subtext}>Coming soon...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtext: {
    fontSize: 16,
    marginTop: 8,
    opacity: 0.6,
  },
});

const Tab = createBottomTabNavigator<BottomTabParamList>();

export const BottomTabNavigator = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
              break;
            case 'Accounts':
              iconName = focused ? 'credit-card' : 'credit-card-outline';
              break;
            case 'Insights':
              iconName = focused ? 'chart-line' : 'chart-line-variant';
              break;
            case 'Payments':
              iconName = focused ? 'bank-transfer' : 'bank-transfer-out';
              break;
            case 'Profile':
              iconName = focused ? 'account' : 'account-outline';
              break;
            default:
              iconName = 'help-circle-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.dark ? '#334155' : '#E5E7EB',
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="Accounts"
        component={AccountsScreen}
      />
      <Tab.Screen
        name="Insights"
        component={InsightsScreen}
      />
      <Tab.Screen
        name="Payments"
        component={PaymentsScreen}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
      />
    </Tab.Navigator>
  );
};
