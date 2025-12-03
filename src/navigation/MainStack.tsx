import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { MainStackParamList } from '../types/navigation';
import { BottomTabNavigator } from './BottomTabNavigator';
import { OnboardingQuizScreen, GuidedTourScreen } from '../screens/onboarding';
import { LinkBankScreen } from '../screens/banking';
import { ChatScreen } from '../screens/chat';

// Placeholder for modal screens that are not yet implemented
const PlaceholderModal = ({ route }: any) => {
  const navigation = useNavigation();

  return (
    <View style={placeholderStyles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={placeholderStyles.closeButton}>
        <Text style={placeholderStyles.closeText}>✕ Close</Text>
      </TouchableOpacity>
      <Text style={placeholderStyles.text}>{route.name} Screen</Text>
      <Text style={placeholderStyles.subtext}>Coming soon...</Text>
    </View>
  );
};

const placeholderStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtext: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 10,
  },
  closeText: {
    fontSize: 16,
    color: '#8B5CF6',
  },
});

const Stack = createStackNavigator<MainStackParamList>();

export const MainStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={BottomTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Group screenOptions={{ presentation: 'modal' }}>
        <Stack.Screen
          name="LinkBank"
          component={LinkBankScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="OnboardingQuiz"
          component={OnboardingQuizScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="GuidedTour"
          component={GuidedTourScreen}
          options={{ headerShown: false }}
        />
      </Stack.Group>
      <Stack.Screen
        name="TransactionDetail"
        component={PlaceholderModal}
        options={{ title: 'Transaction Details' }}
      />
    </Stack.Navigator>
  );
};
