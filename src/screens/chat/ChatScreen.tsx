import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  useTheme,
  Appbar,
  Menu,
  Divider,
  Snackbar,
} from 'react-native-paper';
import { StackScreenProps } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { MainStackParamList } from '../../types/navigation';
import { useChat } from '../../hooks/useChat';
import { ChatMessage } from '../../components/chat/ChatMessage';
import { MessageInput } from '../../components/chat/MessageInput';
import { TypingIndicator } from '../../components/chat/TypingIndicator';
import { AI_AGENTS, AGENT_LABELS } from '../../types/chat';
import { userStorage } from '../../utils/storage';

type Props = StackScreenProps<MainStackParamList, 'Chat'>;

export const ChatScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [account, setAccount] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  const {
    messages,
    loading,
    error,
    selectedAgent,
    setSelectedAgent,
    sendMessage,
    clearChat,
    clearError,
  } = useChat();

  const styles = createStyles(theme);

  // Load account and transactions for context-aware chat
  useEffect(() => {
    loadAccountData();
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const loadAccountData = async () => {
    try {
      const user = await userStorage.getUser();
      if (user) {
        // Load first linked account and its transactions if available
        // This is a simplified version - you can enhance this to select accounts
        const accountsData = await userStorage.get<any[]>('aspayr_accounts');
        if (accountsData && Array.isArray(accountsData) && accountsData.length > 0) {
          const firstAccount = accountsData[0];
          setAccount(firstAccount);

          // Load transactions for this account
          const transactionsData = await userStorage.get<any[]>(
            `aspayr_transactions_${firstAccount.id}`
          );
          if (transactionsData && Array.isArray(transactionsData)) {
            setTransactions(transactionsData.slice(0, 25)); // Last 25 transactions
          }
        }
      }
    } catch (error) {
      console.error('Error loading account data:', error);
    }
  };

  const handleSend = (message: string) => {
    // Pass account context if using account insights agent
    const options =
      selectedAgent === AI_AGENTS.ACCOUNT_INSIGHTS && account
        ? { account, transactions }
        : undefined;

    sendMessage(message, options);
  };

  const handleClearChat = () => {
    clearChat();
    setMenuVisible(false);
  };

  const renderMessage = ({ item }: { item: any }) => (
    <ChatMessage message={item} />
  );

  const renderHeader = () => {
    if (messages.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Icon
            name="robot-outline"
            size={64}
            color={theme.colors.onSurfaceVariant}
          />
          <Text style={styles.emptyTitle}>AI Assistant</Text>
          <Text style={styles.emptySubtitle}>
            Ask me anything about your finances, accounts, or spending
          </Text>
          <View style={styles.suggestionsContainer}>
            <TouchableOpacity
              style={styles.suggestionChip}
              onPress={() => handleSend('What is my current balance?')}
            >
              <Text style={styles.suggestionText}>
                What is my current balance?
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.suggestionChip}
              onPress={() => handleSend('Show me my recent spending')}
            >
              <Text style={styles.suggestionText}>
                Show me my recent spending
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.suggestionChip}
              onPress={() => handleSend('Help me create a budget')}
            >
              <Text style={styles.suggestionText}>
                Help me create a budget
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <Appbar.Header elevated>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="AI Chat" />
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Appbar.Action
                icon="dots-vertical"
                onPress={() => setMenuVisible(true)}
              />
            }
          >
            <Menu.Item
              leadingIcon="robot"
              title="Select Agent"
              disabled
              titleStyle={styles.menuHeader}
            />
            <Divider />
            {Object.entries(AI_AGENTS).map(([key, value]) => (
              <Menu.Item
                key={value}
                onPress={() => {
                  setSelectedAgent(value);
                  setMenuVisible(false);
                }}
                title={AGENT_LABELS[value]}
                leadingIcon={
                  selectedAgent === value ? 'check-circle' : 'circle-outline'
                }
              />
            ))}
            <Divider />
            <Menu.Item
              leadingIcon="delete-outline"
              onPress={handleClearChat}
              title="Clear Chat"
            />
          </Menu>
        </Appbar.Header>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={loading ? <TypingIndicator /> : null}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />

        <MessageInput
          onSend={handleSend}
          disabled={loading}
          placeholder="Type your message..."
        />

        <Snackbar
          visible={!!error}
          onDismiss={clearError}
          duration={4000}
          action={{
            label: 'Dismiss',
            onPress: clearError,
          }}
        >
          {error || ''}
        </Snackbar>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    messagesList: {
      paddingVertical: 8,
      flexGrow: 1,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 48,
    },
    emptyTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
      marginTop: 16,
    },
    emptySubtitle: {
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      marginTop: 8,
      marginBottom: 24,
    },
    suggestionsContainer: {
      gap: 8,
      width: '100%',
    },
    suggestionChip: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    suggestionText: {
      fontSize: 14,
      color: theme.colors.onSurface,
      textAlign: 'center',
    },
    menuHeader: {
      fontWeight: 'bold',
      color: theme.colors.onSurfaceVariant,
    },
  });
