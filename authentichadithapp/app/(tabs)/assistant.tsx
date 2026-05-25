import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getColors, SPACING, FONT_SIZES, BORDER_RADIUS } from '@/lib/styles/colors';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { ChatMessage, sendChatMessage, AI_REQUEST_FAILED } from '@/lib/api/groq';
import { Ionicons } from '@expo/vector-icons';

const MAX_INPUT_LENGTH = 500;
const FREE_DAILY_LIMIT = 3;
const QUOTA_STORAGE_KEY = 'ai_assistant_quota';

const SUGGESTED_PROMPTS = [
  { icon: '\u{1F4D6}', text: 'Explain the hadith about intentions' },
  { icon: '\u{1F932}', text: 'Find hadiths about prayer' },
  { icon: '\u{1F517}', text: 'What makes a hadith authentic?' },
  { icon: '⚖️', text: 'Who is Prophet Mohammed ﷺ?' },
];

const generateMessageId = () => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

export default function AssistantScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const { isPremium } = usePremiumStatus();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [freeUsed, setFreeUsed] = useState(0);
  const [quotaLoaded, setQuotaLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(QUOTA_STORAGE_KEY);
        if (stored) {
          const { date, count } = JSON.parse(stored);
          if (date === getTodayKey()) {
            setFreeUsed(count);
          }
        }
      } catch {
        // Storage read failed — start fresh
      } finally {
        setQuotaLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const isAtLimit = !isPremium && freeUsed >= FREE_DAILY_LIMIT;

  const persistQuota = async (newCount: number) => {
    setFreeUsed(newCount);
    try {
      await AsyncStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify({
        date: getTodayKey(),
        count: newCount,
      }));
    } catch {
      // Storage write failed — quota still tracked in state for this session
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    if (isAtLimit) return;

    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await sendChatMessage([...messages, userMessage]);

      const aiMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);
      if (!isPremium) {
        await persistQuota(freeUsed + 1);
      }
    } catch (err) {
      if (__DEV__) console.error('[assistant] sendChatMessage failed', err);
      setError(AI_REQUEST_FAILED);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => sendMessage(input);

  const handleSuggestedPrompt = (text: string) => {
    setInput(text);
    sendMessage(text);
  };

  const handleRetry = () => {
    setError(null);
    if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
      const lastUserMessage = messages[messages.length - 1];
      setInput(lastUserMessage.content);
      setMessages(prev => prev.slice(0, -1));
    }
  };

  const remaining = Math.max(FREE_DAILY_LIMIT - freeUsed, 0);
  const canSend = input.trim() && !isLoading && !isAtLimit;

  return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.bronzeText }]}>{'✨'} AI Assistant</Text>
          <Text style={[styles.subtitle, { color: colors.mutedText }]}>
            Ask questions about hadith. Answers are AI-generated context, not a fatwa.
          </Text>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>{'\u{1F4AC}'}</Text>
              <Text style={[styles.emptyText, { color: colors.bronzeText }]}>Start a conversation</Text>
              <Text style={[styles.emptySubtext, { color: colors.mutedText }]}>
                Ask anything about Islamic teachings, hadith interpretations, or specific narrators
              </Text>

              <View style={styles.suggestedGrid}>
                {SUGGESTED_PROMPTS.map((prompt, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.suggestedCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => handleSuggestedPrompt(prompt.text)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.suggestedIcon}>{prompt.icon}</Text>
                    <Text style={[styles.suggestedText, { color: colors.bronzeText }]}>{prompt.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.disclaimer, { color: colors.mutedText }]}>
                AI guidance only. For religious rulings, consult a qualified scholar.
              </Text>
            </View>
          ) : (
            messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageBubble,
                  message.role === 'user'
                    ? [styles.userBubble, { backgroundColor: colors.chatUserBubble }]
                    : [styles.aiBubble, { backgroundColor: colors.chatAiBubble }]
                ]}
              >
                <View style={styles.messageHeader}>
                  <View style={styles.avatarContainer}>
                    <Ionicons
                      name={message.role === 'user' ? 'person' : 'sparkles'}
                      size={16}
                      color={colors.white}
                    />
                  </View>
                  <Text style={[styles.messageRole, { color: colors.white }]}>
                    {message.role === 'user' ? 'You' : 'AI Assistant'}
                  </Text>
                </View>
                <Text style={[styles.messageContent, { color: colors.white }]}>{message.content}</Text>
              </View>
            ))
          )}

          {error && (
            <View style={[styles.errorContainer, { backgroundColor: colors.error }]}>
              <Text style={[styles.errorText, { color: colors.white }]}>{error}</Text>
              <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.white }]} onPress={handleRetry}>
                <Text style={[styles.retryText, { color: colors.error }]}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.chatAiBubble} />
              <Text style={[styles.loadingText, { color: colors.mutedText }]}>Thinking...</Text>
            </View>
          )}
        </ScrollView>

        <View style={[styles.fatwaFooter, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={14} color={colors.mutedText} />
          <Text style={[styles.fatwaText, { color: colors.mutedText }]}>
            AI guidance only. For rulings, consult a qualified scholar.
          </Text>
        </View>

        <View style={[styles.quotaBanner, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <Ionicons name="sparkles-outline" size={14} color={colors.mutedText} />
          <Text style={[styles.quotaText, { color: colors.mutedText }]}>
            {isPremium
              ? 'Unlimited explanations (Premium)'
              : isAtLimit
                ? 'Daily limit reached. Upgrade for unlimited access.'
                : `Free explanations today: ${remaining} / ${FREE_DAILY_LIMIT}`}
          </Text>
        </View>

        <View style={[styles.inputContainer, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.bronzeText, borderColor: colors.border }]}
            placeholder={isAtLimit ? 'Daily limit reached' : 'Ask about Islamic teachings...'}
            placeholderTextColor={colors.mutedText}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={MAX_INPUT_LENGTH}
            editable={!isLoading && !isAtLimit}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: colors.chatAiBubble },
              !canSend && [styles.sendButtonDisabled, { backgroundColor: colors.mutedText }]
            ]}
            onPress={handleSend}
            disabled={!canSend}
          >
            <Ionicons name="send" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: SPACING.md,
    paddingTop: SPACING.xl,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.base,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.base,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  messageBubble: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    maxWidth: '85%',
  },
  userBubble: {
    alignSelf: 'flex-end',
  },
  aiBubble: {
    alignSelf: 'flex-start',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  avatarContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs,
  },
  messageRole: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  messageContent: {
    fontSize: FONT_SIZES.base,
    lineHeight: 20,
  },
  errorContainer: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
    alignItems: 'center',
  },
  errorText: {
    fontSize: FONT_SIZES.base,
    marginBottom: SPACING.sm,
  },
  retryButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  retryText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  loadingText: {
    fontSize: FONT_SIZES.base,
    marginLeft: SPACING.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SPACING.md,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    fontSize: FONT_SIZES.base,
    maxHeight: 100,
    marginRight: SPACING.sm,
    borderWidth: 1,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  suggestedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.sm,
    width: '100%',
  },
  suggestedCard: {
    width: '47%',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'flex-start',
    gap: SPACING.xs,
  },
  suggestedIcon: {
    fontSize: 22,
  },
  suggestedText: {
    fontSize: FONT_SIZES.sm,
    lineHeight: 18,
  },
  disclaimer: {
    fontSize: FONT_SIZES.sm,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  quotaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  quotaText: {
    fontSize: FONT_SIZES.xs,
  },
  fatwaFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  fatwaText: {
    fontSize: FONT_SIZES.xs,
    fontStyle: 'italic',
    textAlign: 'center',
    flexShrink: 1,
  },
});
