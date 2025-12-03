import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { TextInput, useTheme } from 'react-native-paper';

interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  disabled?: boolean;
  error?: boolean;
  errorText?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  style?: any;
  multiline?: boolean;
  numberOfLines?: number;
}

export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  disabled = false,
  error = false,
  errorText,
  left,
  right,
  style,
  multiline = false,
  numberOfLines = 1,
}) => {
  const theme = useTheme();
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  const toggleSecureEntry = () => {
    setIsSecure(!isSecure);
  };

  return (
    <TextInput
      label={label}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      secureTextEntry={isSecure}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      disabled={disabled}
      error={error}
      mode="outlined"
      style={[styles.input, style]}
      outlineStyle={styles.outline}
      left={left}
      right={
        secureTextEntry ? (
          <TextInput.Icon
            icon={isSecure ? 'eye' : 'eye-off'}
            onPress={toggleSecureEntry}
          />
        ) : (
          right
        )
      }
      multiline={multiline}
      numberOfLines={numberOfLines}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    marginBottom: 4,
  },
  outline: {
    borderRadius: 12,
  },
});
