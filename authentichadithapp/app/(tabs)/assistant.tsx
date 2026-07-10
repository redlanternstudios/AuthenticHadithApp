import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getColors, SPACING, FONT_SIZES, BORDER_RADIUS } from '@/lib/styles/colors';
import { FONT_FAMILY } from '@/constants/theme';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { useAuth } from '@/lib/auth/AuthProvider';
import { ChatMessage, sendChatMessage, AI_REQUEST_FAILED } from '@/lib/api/groq';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

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

function AssistantScreenInner() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const { isPremium } = usePremiumStatus();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [freeUsed, setFreeUsed] = useState(0);
  const [quotaLoaded, setQuotaLoaded] = useState(false);

  // FIX A: Clear conversation when user logs out or switches accounts.
  // Tab screens stay mounted across logout/login — without this, user A's
  // messages leak into user B's session.
  useEffect(() => {
    if (!user?.id) {
      setMessages([]);
      setFreeUsed(0);
    }
  }, [user?.id]);

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
    if (messages.length > 0 && scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const isAtLimit = !isPremium && freeUsed >= FREE_DAILY_LIMIT;

  // Markdown typography for AI bubbles — white text on chatAiBubble, gold accents
  // for headers per the premium theme. Built from getColors per Rule 017.
  const markdownStyles = {
    body: { fontFamily: FONT_FAMILY.body, color: colors.white, fontSize: FONT_SIZES.base, lineHeight: 20 },
    paragraph: { marginTop: 0, marginBottom: SPACING.sm },
    heading1: { color: colors.goldHighlight, fontSize: FONT_SIZES.xl, fontWeight: '700' as const, marginBottom: SPACING.xs },
    heading2: { color: colors.goldHighlight, fontSize: FONT_SIZES.lg, fontWeight: '700' as const, marginBottom: SPACING.xs },
    heading3: { color: colors.goldHighlight, fontSize: FONT_SIZES.md, fontWeight: '700' as const, marginBottom: SPACING.xs },
    strong: { fontWeight: '700' as const },
    em: { fontStyle: 'italic' as const },
    bullet_list: { marginBottom: SPACING.sm },
    ordered_list: { marginBottom: SPACING.sm },
    list_item: { marginBottom: SPACING.xs },
    code_inline: { backgroundColor: 'rgba(0,0,0,0.25)', color: colors.white, borderRadius: 4, paddingHorizontal: 4 },
    fence: { backgroundColor: 'rgba(0,0,0,0.25)', color: colors.white, borderRadius: BORDER_RADIUS.sm, padding: SPACING.sm, borderWidth: 0 },
    code_block: { backgroundColor: 'rgba(0,0,0,0.25)', color: colors.white, borderRadius: BORDER_RADIUS.sm, padding: SPACING.sm, borderWidth: 0 },
    blockquote: { backgroundColor: 'rgba(0,0,0,0.15)', borderColor: colors.goldMid, paddingHorizontal: SPACING.sm, marginBottom: SPACING.sm },
    link: { color: colors.goldHighlight, textDecorationLine: 'underline' as const },
    hr: { backgroundColor: 'rgba(255,255,255,0.3)', marginVertical: SPACING.sm },
  };

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
  const canSend = !!input.trim() && quotaLoaded && !isLoading && !isAtLimit;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top + SPACING.md }]}>
          <Text style={[styles.title, { color: colors.bronzeText }]}>{'✨'} AI Assistant</Text>
          {isPremium && (
            <View style={[styles.deepModeBadge, { backgroundColor: colors.goldMid + '20', borderColor: colors.goldMid }]}>
              <Text style={[styles.deepModeText, { color: colors.goldMid }]}>✦ Deep Mode</Text>
            </View>
          )}
          <Text style={[styles.subtitle, { color: colors.mutedText }]}>
            Ask questions about hadith. Answers are study context, not a fatwa.
          </Text>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => {
            if (messages.length > 0) {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }
          }}
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
                {message.role === 'assistant' ? (
                  // AI responses arrive as markdown (**bold**, ### headers, - lists);
                  // render them instead of showing raw syntax. User messages stay plain.
                  <Markdown style={markdownStyles}>{message.content}</Markdown>
                ) : (
                  <Text style={[styles.messageContent, { color: colors.white }]}>{message.content}</Text>
                )}
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

        <View style={[styles.lanternBubble, { backgroundColor: colors.chatAiBubble }]}>
          <View style={styles.bubbleHeader}>
            <View style={[styles.avatarContainer, { backgroundColor: 'rgba(255,255,255,0.14)' }]}>
              <Ionicons name="sparkles" size={16} color={colors.white} />
            </View>
            <Text style={[styles.bubbleTitle, { color: colors.white }]}>LanternAI</Text>
          </View>
          <Text style={[styles.bubbleText, { color: colors.white }]}>
            AI guidance only. For rulings, consult a qualified scholar.
          </Text>
          <Text style={[styles.bubbleHint, { color: colors.white + 'CC' }]}>
            Open LanternAI from the footer or the More menu whenever you need context.
          </Text>
        </View>

        <View style={[styles.quotaBanner, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <Ionicons name="sparkles-outline" size={14} color={colors.mutedText} />
          <Text style={[styles.quotaText, { color: colors.mutedText }]}>
            {isPremium
              ? 'Deep mode enabled'
              : isAtLimit
                ? 'Daily guidance limit reached for today.'
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
            accessibilityLabel="Send message"
            accessibilityRole="button"
          >
            <Ionicons name="send" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
  },
  title: {
    fontFamily: FONT_FAMILY.heading,
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.base,
    lineHeight: 22,
  },
  deepModeBadge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: SPACING.xs,
  },
  deepModeText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONT_FAMILY.bodySemiBold,
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
    justifyContent: 'flex-start',
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontFamily: FONT_FAMILY.heading,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.base,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
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
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  messageContent: {
    fontFamily: FONT_FAMILY.body,
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
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.sm,
    lineHeight: 18,
  },
  disclaimer: {
    fontFamily: FONT_FAMILY.body,
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
  lanternBubble: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
  },
  bubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  bubbleTitle: {
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  bubbleText: {
    fontSize: FONT_SIZES.xs,
    lineHeight: 18,
  },
  bubbleHint: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZES.xs,
    fontStyle: 'italic',
  },
});

export default function AssistantScreen() {
  return (
    <ErrorBoundary>
      <AssistantScreenInner />
    </ErrorBoundary>
  );
}
