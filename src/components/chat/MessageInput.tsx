import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Type a message...',
}) => {
  const theme = useTheme();
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          multiline
          maxLength={1000}
          editable={!disabled}
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!message.trim() || disabled) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!message.trim() || disabled}
        >
          <Icon
            name="send"
            size={24}
            color={
              !message.trim() || disabled
                ? theme.colors.onSurfaceDisabled
                : '#FFFFFF'
            }
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: theme.colors.background,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
    },
    input: {
      flex: 1,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 24,
      paddingHorizontal: 16,
      paddingVertical: Platform.OS === 'ios' ? 12 : 8,
      fontSize: 16,
      maxHeight: 100,
      color: theme.colors.onSurface,
    },
    sendButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendButtonDisabled: {
      backgroundColor: theme.colors.surfaceVariant,
    },
  });
