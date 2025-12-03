import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { Message } from '../../types/chat';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const theme = useTheme();
  const isUser = message.role === 'user';

  const styles = createStyles(theme, isUser);

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <Text style={styles.content}>{message.content}</Text>
        <View style={styles.footer}>
          {message.agentName && !isUser && (
            <Text style={styles.agentName}>{message.agentName}</Text>
          )}
          <Text style={styles.timestamp}>
            {formatTime(message.timestamp)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const createStyles = (theme: any, isUser: boolean) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginVertical: 4,
      marginHorizontal: 16,
    },
    bubble: {
      maxWidth: '80%',
      backgroundColor: isUser
        ? theme.colors.primary
        : theme.colors.surfaceVariant,
      borderRadius: 16,
      padding: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    content: {
      fontSize: 16,
      lineHeight: 22,
      color: isUser ? '#FFFFFF' : theme.colors.onSurface,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: isUser ? 'flex-end' : 'space-between',
      marginTop: 4,
      gap: 8,
    },
    agentName: {
      fontSize: 10,
      color: theme.colors.onSurfaceVariant,
      fontWeight: '500',
    },
    timestamp: {
      fontSize: 10,
      color: isUser
        ? 'rgba(255, 255, 255, 0.7)'
        : theme.colors.onSurfaceVariant,
    },
  });
