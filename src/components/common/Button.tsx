import React from 'react';
import { StyleSheet } from 'react-native';
import { Button as PaperButton, useTheme } from 'react-native-paper';

interface ButtonProps {
  mode?: 'text' | 'outlined' | 'contained' | 'elevated' | 'contained-tonal';
  onPress: () => void;
  children: string;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  style?: any;
  contentStyle?: any;
}

export const Button: React.FC<ButtonProps> = ({
  mode = 'contained',
  onPress,
  children,
  disabled = false,
  loading = false,
  icon,
  style,
  contentStyle,
}) => {
  const theme = useTheme();

  return (
    <PaperButton
      mode={mode}
      onPress={onPress}
      disabled={disabled || loading}
      loading={loading}
      icon={icon}
      style={[styles.button, style]}
      contentStyle={[styles.content, contentStyle]}
      buttonColor={mode === 'contained' ? theme.colors.primary : undefined}
    >
      {children}
    </PaperButton>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
  },
  content: {
    paddingVertical: 8,
  },
});
