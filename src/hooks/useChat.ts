import { useState, useEffect, useCallback } from 'react';
import { aiApi } from '../api';
import { userStorage } from '../utils/storage';
import {
  Message,
  ChatState,
  SendMessageParams,
  AI_AGENTS,
} from '../types/chat';

const MAX_HISTORY_LENGTH = 10;

export const useChat = () => {
  const [state, setState] = useState<ChatState>({
    messages: [],
    loading: false,
    error: null,
  });
  const [selectedAgent, setSelectedAgent] = useState<string>(
    AI_AGENTS.ROUTER
  );

  // Load chat messages from storage on mount
  useEffect(() => {
    loadChatHistory();
  }, []);

  // Load chat history from AsyncStorage
  const loadChatHistory = async () => {
    try {
      const messages = await userStorage.getChatMessages();
      if (messages && Array.isArray(messages)) {
        // Convert stored messages to Message type
        const parsedMessages: Message[] = messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setState((prev) => ({ ...prev, messages: parsedMessages }));
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  // Save chat messages to storage
  const saveChatHistory = async (messages: Message[]) => {
    try {
      await userStorage.setChatMessages(messages);
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  };

  // Send a message
  const sendMessage = async (
    question: string,
    options?: {
      account?: any;
      transactions?: any[];
      balances?: any;
    }
  ) => {
    if (!question.trim()) return;

    // Get user data to extract userId
    const userData = await userStorage.getUser();
    const userId = userData?.userUuid;

    // Create user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question.trim(),
      timestamp: new Date(),
    };

    // Add user message to state
    const updatedMessages = [...state.messages, userMessage];
    setState((prev) => ({
      ...prev,
      messages: updatedMessages,
      loading: true,
      error: null,
    }));

    try {
      // Format history for API (last 10 messages)
      const history = updatedMessages
        .slice(-MAX_HISTORY_LENGTH)
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      let reply: string;
      let agentUsed: string = selectedAgent;

      // If router agent is selected, first route to appropriate agent
      if (selectedAgent === AI_AGENTS.ROUTER) {
        const routingResponse = await aiApi.chatRoute({
          question,
          history,
        });

        agentUsed = routingResponse.routing.selected_agent;

        // Use the routed agent
        if (agentUsed === AI_AGENTS.ACCOUNT_INSIGHTS && options?.account) {
          // Inject userId at the beginning of the message for agent-001
          const questionWithUserId = userId
            ? `userId=${userId} ${question}`
            : question;

          const response = await aiApi.chatPlus({
            question: questionWithUserId,
            history,
            agentName: agentUsed,
            account: options.account,
            transactions: options.transactions,
            balances: options.balances,
          });
          reply = response.reply;
        } else {
          const response = await aiApi.chat({
            question,
            history,
            agentName: agentUsed,
          });
          reply = response.reply;
        }
      } else if (
        selectedAgent === AI_AGENTS.ACCOUNT_INSIGHTS &&
        options?.account
      ) {
        // Inject userId at the beginning of the message for agent-001
        const questionWithUserId = userId
          ? `userId=${userId} ${question}`
          : question;

        // Use chatPlus for context-aware agent
        const response = await aiApi.chatPlus({
          question: questionWithUserId,
          history,
          agentName: selectedAgent,
          account: options.account,
          transactions: options.transactions,
          balances: options.balances,
        });
        reply = response.reply;
      } else {
        // Use regular chat for other agents
        const response = await aiApi.chat({
          question,
          history,
          agentName: selectedAgent,
        });
        reply = response.reply;
      }

      // Create assistant message
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
        agentName: agentUsed,
      };

      // Add assistant message to state
      const finalMessages = [...updatedMessages, assistantMessage];
      setState((prev) => ({
        ...prev,
        messages: finalMessages,
        loading: false,
      }));

      // Save to storage
      await saveChatHistory(finalMessages);
    } catch (error: any) {
      console.error('Error sending message:', error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to send message',
      }));
    }
  };

  // Clear chat history
  const clearChat = async () => {
    setState({ messages: [], loading: false, error: null });
    await userStorage.setChatMessages([]);
  };

  // Clear error
  const clearError = () => {
    setState((prev) => ({ ...prev, error: null }));
  };

  return {
    messages: state.messages,
    loading: state.loading,
    error: state.error,
    selectedAgent,
    setSelectedAgent,
    sendMessage,
    clearChat,
    clearError,
  };
};
