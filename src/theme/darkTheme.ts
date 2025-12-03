import { MD3DarkTheme } from 'react-native-paper';
import { colors } from './colors';

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primaryDark,
    secondary: colors.primary,
    background: colors.background.dark,
    surface: colors.surface.dark,
    error: colors.error,
  },
};
