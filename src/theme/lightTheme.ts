import { MD3LightTheme } from 'react-native-paper';
import { colors } from './colors';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primaryLight,
    secondary: colors.primary,
    background: colors.background.light,
    surface: colors.surface.light,
    error: colors.error,
  },
};
