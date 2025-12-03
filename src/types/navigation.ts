import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: {
    email?: string;
    displayName?: string;
    provider?: string;
  } | undefined;
  PINSetup: { email: string; isNewUser: boolean };
  PINVerify: { email: string };
};

export type MainStackParamList = {
  Home: NavigatorScreenParams<BottomTabParamList>;
  LinkBank: { consent?: string } | undefined;
  Chat: undefined;
  OnboardingQuiz: undefined;
  GuidedTour: undefined;
  TransactionDetail: { transactionId: string };
};

export type BottomTabParamList = {
  Dashboard: undefined;
  Accounts: undefined;
  Insights: undefined;
  Payments: undefined;
  Profile: undefined;
};
