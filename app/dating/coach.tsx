
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import { authenticatedPost, authenticatedGet } from '@/utils/api';
import { useRoster } from '@/contexts/RosterContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const DEFAULT_GREETING = "Hi! I'm your dating coach. I'm here to help you with dating advice, conversation tips, date ideas, and relationship guidance. What would you like to talk about?";
const PERSONALIZED_GREETING = "Hey! I'm your personal dating coach. I can see your roster and dating history, so I can give you personalized advice. What's on your mind?";

export default function DatingCoachScreen() {
  const router = useRouter();
  const { roster, bench } = useRoster();
  const [analytics, setAnalytics] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const historyLoadedRef = useRef(false);

  // Load chat history and analytics on mount
  useEffect(() => {
    console.log('[DatingCoach] Loading history and analytics on mount');

    const loadInitialData = async () => {
      try {
        const [historyData, analyticsData] = await Promise.all([
          authenticatedGet('/api/coaching/history').catch((err) => {
            console.error('[DatingCoach] Failed to load history:', err);
            return null;
          }),
          authenticatedGet('/api/analytics').catch((err) => {
            console.error('[DatingCoach] Failed to load analytics:', err);
            return null;
          }),
        ]);

        if (analyticsData) {
          console.log('[DatingCoach] Analytics loaded');
          setAnalytics(analyticsData);
        }

        if (historyData?.messages && historyData.messages.length > 0) {
          console.log('[DatingCoach] Chat history loaded, message count:', historyData.messages.length);
          const loaded: Message[] = historyData.messages.map((m: HistoryMessage, i: number) => ({
            id: `history-${i}`,
            role: m.role,
            content: m.content,
            timestamp: new Date(m.timestamp),
          }));
          setMessages(loaded);
        } else {
          console.log('[DatingCoach] No history found, showing default greeting');
          setMessages([
            {
              id: '1',
              role: 'assistant',
              content: DEFAULT_GREETING,
              timestamp: new Date(),
            },
          ]);
        }
        historyLoadedRef.current = true;
      } finally {
        setHistoryLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (!historyLoadedRef.current) return;
    if (roster.length > 0 || bench.length > 0) {
      console.log('[DatingCoach] Roster data loaded - updating greeting to personalized version');
      setMessages((prev) => {
        if (prev.length === 1 && prev[0].id === '1') {
          return [{ ...prev[0], content: PERSONALIZED_GREETING }];
        }
        return prev;
      });
    }
  }, [roster, bench]);

  const saveHistory = async (updatedMessages: Message[]) => {
    const historyMessages: HistoryMessage[] = updatedMessages.map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp.toISOString(),
    }));
    try {
      console.log('[DatingCoach] Saving chat history, message count:', historyMessages.length);
      await authenticatedPost('/api/coaching/history', { messages: historyMessages });
      console.log('[DatingCoach] Chat history saved successfully');
    } catch (err) {
      console.error('[DatingCoach] Failed to save chat history:', err);
    }
  };

  const handleClearChat = () => {
    console.log('[DatingCoach] User tapped Clear Chat button');
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear the chat history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            console.log('[DatingCoach] Clearing chat history');
            const greeting: Message = {
              id: '1',
              role: 'assistant',
              content: DEFAULT_GREETING,
              timestamp: new Date(),
            };
            setMessages([greeting]);
            try {
              await authenticatedPost('/api/coaching/history', { messages: [] });
              console.log('[DatingCoach] Chat history cleared on server');
            } catch (err) {
              console.error('[DatingCoach] Failed to clear chat history on server:', err);
            }
          },
        },
      ]
    );
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputText.trim();
    setInputText('');
    setIsLoading(true);

    try {
      console.log('[DatingCoach] Sending message to AI:', messageToSend);

      const rosterSummary = roster.map(p => `${p.name} (age ${p.age || 'unknown'}, interest: ${p.interestLevel || 'medium'}, location: ${p.location || 'unknown'})`).join(', ') || 'none';
      const benchSummary = bench.map(p => `${p.name} (reason: ${p.benchReason || 'unspecified'})`).join(', ') || 'none';
      const commonRedFlags = analytics?.commonRedFlags?.slice(0, 3).map((f: any) => f.flag).join(', ') || 'none';
      const commonGreenFlags = analytics?.commonGreenFlags?.slice(0, 3).map((f: any) => f.flag).join(', ') || 'none';
      const avgRating = analytics?.averageRating ? Number(analytics.averageRating).toFixed(1) : 'N/A';
      const wouldGoAgain = analytics?.wouldGoAgainPercentage ? Number(analytics.wouldGoAgainPercentage).toFixed(0) + '%' : 'N/A';

      const systemContext = `USER'S DATING DATA:
Roster (${roster.length} people): ${rosterSummary}
Bench (${bench.length} people): ${benchSummary}
Total dates: ${analytics?.totalDates || 0}, Completed: ${analytics?.completedDates || 0}, Upcoming: ${analytics?.upcomingDates || 0}
Average rating: ${avgRating}/5
Would go again: ${wouldGoAgain}
Common red flags: ${commonRedFlags}
Common green flags: ${commonGreenFlags}`;

      console.log('[DatingCoach] System context built, roster size:', roster.length);

      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      conversationHistory.push({
        role: 'user',
        content: messageToSend,
      });

      const response = await authenticatedPost('/api/coaching/chat', {
        message: messageToSend,
        history: conversationHistory,
        context: systemContext,
      });

      console.log('[DatingCoach] Received AI response');

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.reply || response.response || 'Sorry, I could not generate a response.',
        timestamp: new Date(),
      };

      setMessages(prev => {
        const updated = [...prev, assistantMessage];
        saveHistory(updated);
        return updated;
      });
    } catch (error) {
      console.error('[DatingCoach] Error sending message:', error);
      Alert.alert('Error', 'Failed to get response from dating coach. Please try again.');
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    "How do I start a conversation?",
    "What are good first date ideas?",
    "How do I know if they're interested?",
    "Tips for a second date",
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient
        colors={[colors.rosterGreen, '#1F6B3A']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            console.log('[DatingCoach] User tapped back button');
            router.back();
          }}
        >
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow-back"
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <IconSymbol
            ios_icon_name="person.fill"
            android_material_icon_name="person"
            size={24}
            color="#fff"
          />
          <Text style={styles.headerTitle}>Dating Coach</Text>
        </View>
        <TouchableOpacity style={styles.clearButton} onPress={handleClearChat}>
          <IconSymbol
            ios_icon_name="trash"
            android_material_icon_name="delete"
            size={20}
            color="rgba(255,255,255,0.85)"
          />
        </TouchableOpacity>
      </LinearGradient>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          {historyLoading ? (
            <View style={styles.historyLoadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.historyLoadingText}>Loading chat history...</Text>
            </View>
          ) : null}
          <ScrollView
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
          >
            {messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageBubble,
                  message.role === 'user' ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.role === 'user' ? styles.userText : styles.assistantText,
                  ]}
                >
                  {message.content}
                </Text>
                <Text
                  style={[
                    styles.messageTime,
                    message.role === 'user' ? styles.userTime : styles.assistantTime,
                  ]}
                >
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            ))}

            {isLoading && (
              <View style={[styles.messageBubble, styles.assistantBubble]}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )}

            {messages.length === 1 && (
              <View style={styles.quickPromptsContainer}>
                <Text style={styles.quickPromptsTitle}>Quick questions:</Text>
                {quickPrompts.map((prompt, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.quickPromptButton}
                    onPress={() => {
                      console.log('[DatingCoach] User selected quick prompt:', prompt);
                      setInputText(prompt);
                    }}
                  >
                    <Text style={styles.quickPromptText}>{prompt}</Text>
                    <IconSymbol
                      ios_icon_name="chevron.right"
                      android_material_icon_name="chevron-right"
                      size={16}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask your dating coach..."
              placeholderTextColor={colors.textSecondary}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={() => {
                console.log('[DatingCoach] User pressed send key on keyboard');
                handleSend();
              }}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={() => {
                console.log('[DatingCoach] User tapped send button');
                handleSend();
              }}
              disabled={!inputText.trim() || isLoading}
            >
              <IconSymbol
                ios_icon_name="arrow.up.circle.fill"
                android_material_icon_name="send"
                size={32}
                color={inputText.trim() ? colors.primary : colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  clearButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.card,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: colors.white,
  },
  assistantText: {
    color: colors.text,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  userTime: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  assistantTime: {
    color: colors.textSecondary,
  },
  quickPromptsContainer: {
    marginTop: 16,
  },
  quickPromptsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  quickPromptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickPromptText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButton: {
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  historyLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    zIndex: 10,
  },
  historyLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
});
