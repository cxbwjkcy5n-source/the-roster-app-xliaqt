
import React, { useState } from 'react';
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
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function DatingCoachScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your dating coach. I'm here to help you with dating advice, conversation tips, date ideas, and relationship guidance. What would you like to talk about?",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      console.log('[DatingCoach] Sending message to AI:', userMessage.content);
      
      // TODO: Backend Integration - POST /api/coaching/chat
      // Accepts: { message: string, conversationHistory: [{role, content}] }
      // Sends to OpenAI GPT-5.2 with conversation history
      // Returns: { response: string }
      
      // Temporary mock response
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm here to help! This feature will be fully functional soon. In the meantime, feel free to explore other dating features in the app.",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('[DatingCoach] Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
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
      <Stack.Screen 
        options={{
          headerShown: false,
        }} 
      />
      
      <LinearGradient
        colors={['#C8A04F', '#b8903f']}
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
        <View style={styles.headerSpacer} />
      </LinearGradient>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
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
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
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
  headerSpacer: {
    width: 40,
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
    padding: 12,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButton: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
