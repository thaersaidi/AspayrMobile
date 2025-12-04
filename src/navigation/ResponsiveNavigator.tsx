import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BottomTabParamList } from '../types/navigation';
import { useTheme } from 'react-native-paper';
import { useResponsive } from '../hooks/useResponsive';
import { Sidebar } from '../components/navigation/Sidebar';

// Import screens
import { DashboardScreen } from '../screens/main/DashboardScreen';
import { AccountsScreen } from '../screens/main/AccountsScreen';
import { InsightsScreen } from '../screens/main/InsightsScreen';
import { PaymentsScreen } from '../screens/main/PaymentsScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';

const Tab = createBottomTabNavigator<BottomTabParamList>();

// Wrapper component to capture navigation and pass it up
const NavigationCapture: React.FC<{ onNavigationReady: (nav: any) => void }> = ({ onNavigationReady }) => {
  const navigation = useNavigation();
  
  React.useEffect(() => {
    onNavigationReady(navigation);
  }, [navigation, onNavigationReady]);
  
  return null;
};

/**
 * Responsive navigator that shows:
 * - Sidebar navigation on web/desktop
 * - Bottom tabs on mobile
 */
export const ResponsiveNavigator = () => {
  const theme = useTheme();
  const { isDesktop, isWeb } = useResponsive();
  const [activeScreen, setActiveScreen] = React.useState<keyof BottomTabParamList>('Dashboard');
  const [tabNavigation, setTabNavigation] = React.useState<any>(null);

  // Use sidebar layout for desktop web
  const useSidebarLayout = isWeb && isDesktop;

  const handleNavigationReady = React.useCallback((nav: any) => {
    setTabNavigation(nav);
  }, []);

  const handleSidebarNavigate = React.useCallback((screenName: keyof BottomTabParamList) => {
    console.log('Navigating to:', screenName);
    setActiveScreen(screenName);
    if (tabNavigation) {
      console.log('Tab navigation exists, calling navigate');
      tabNavigation.navigate(screenName);
    } else {
      console.error('Tab navigation is null');
    }
  }, [tabNavigation]);

  if (useSidebarLayout) {
    return (
      <View style={styles.desktopContainer}>
        <Sidebar 
          activeName={activeScreen}
          onNavigate={handleSidebarNavigate}
        />
        <View style={styles.contentArea}>
          <Tab.Navigator
            screenOptions={{
              headerShown: true,
              headerStyle: {
                backgroundColor: theme.colors.surface,
              },
              headerTintColor: theme.colors.onSurface,
              tabBarStyle: { display: 'none' }, // Hide bottom tabs on desktop
            }}
          >
            <Tab.Screen
              name="Dashboard"
              options={{ title: 'Home' }}
              listeners={{
                focus: () => setActiveScreen('Dashboard'),
              }}
            >
              {(props) => (
                <>
                  <NavigationCapture onNavigationReady={handleNavigationReady} />
                  <DashboardScreen {...props} />
                </>
              )}
            </Tab.Screen>
            <Tab.Screen 
              name="Accounts" 
              component={AccountsScreen}
              listeners={{
                focus: () => setActiveScreen('Accounts'),
              }}
            />
            <Tab.Screen 
              name="Insights" 
              component={InsightsScreen}
              listeners={{
                focus: () => setActiveScreen('Insights'),
              }}
            />
            <Tab.Screen 
              name="Payments" 
              component={PaymentsScreen}
              listeners={{
                focus: () => setActiveScreen('Payments'),
              }}
            />
            <Tab.Screen 
              name="Profile" 
              component={ProfileScreen}
              listeners={{
                focus: () => setActiveScreen('Profile'),
              }}
            />
          </Tab.Navigator>
        </View>
      </View>
    );
  }

  // Use bottom tabs for mobile
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
      <Tab.Screen name="Accounts" component={AccountsScreen} />
      <Tab.Screen name="Insights" component={InsightsScreen} />
      <Tab.Screen name="Payments" component={PaymentsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  contentArea: {
    flex: 1,
  },
});
