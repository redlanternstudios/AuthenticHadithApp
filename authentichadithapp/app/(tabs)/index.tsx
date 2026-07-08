import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  RefreshControl,
  Pressable,
  TouchableOpacity,
  Dimensions,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { HadithCard } from '@/components/hadith/HadithCard';
import { StreakCounter } from '@/components/gamification/StreakCounter';
import { LevelProgressBar } from '@/components/gamification/LevelProgressBar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TopBar } from '@/components/layout/TopBar';
import { getColors, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '@/lib/styles/colors';
import { FONT_FAMILY } from '@/constants/theme';
import { getLevelInfo } from '@/lib/gamification/level-calculator';
import { TodayFeaturedSection } from '@/components/home/TodayFeaturedSection';
import { Hadith } from '@/types/hadith';
import { QueryErrorBanner } from '@/components/common/QueryErrorBanner';
import { VISIBLE_COLLECTION_COUNT, VISIBLE_HADITH_TOTAL, HIDDEN_COLLECTION_FILTER } from '@/lib/hadith/visibleCollections';

const QUICK_ACTIONS = [
  { icon: '☀️', label: 'Today', route: '/(tabs)/today' },
  { icon: '📚', label: 'Library', route: '/(tabs)/collections' },
  { icon: '✨', label: 'Ask', route: '/(tabs)/assistant' },
  { icon: '🕌', label: 'Sunnah', route: '/sunnah' },
  { icon: '📖', label: 'Stories', route: '/stories' },
  { icon: '📊', label: 'Progress', route: '/progress' },
];

const STUDY_STEPS = [
  {
    number: '01',
    title: 'Read',
    desc: 'Open a narration from Bukhari or Muslim.',
    route: '/(tabs)/collections',
  },
  {
    number: '02',
    title: 'Reflect',
    desc: 'Connect the hadith to your day.',
    route: '/(tabs)/today',
  },
  {
    number: '03',
    title: 'Ask',
    desc: 'Use the assistant for grounded context.',
    route: '/(tabs)/assistant',
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_TABLET = SCREEN_WIDTH >= 768;

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: hadith, isLoading, isError, refetch } = useQuery({
    queryKey: ['random-hadith', refreshKey],
    queryFn: async () => {
      // UX hardening (FIX-038): only pick hadiths that actually have English text.
      // Content-trust (CT-05): sahih-only — the headline "Hadith of the Moment" on
      // Home must not surface a hasan or daif hadith, matching the Daily Hadith
      // filter on Today so both "of the day"/"of the moment" surfaces hold to the
      // authenticity bar the app's name implies.
      // Exclude release-hidden collections from BOTH the count and the fetch so
      // the headline "Hadith of the Moment" never surfaces a hidden-collection
      // hadith and the random offset stays in range.
      let countQuery = supabase
        .from('hadiths')
        .select('*', { count: 'exact', head: true })
        .eq('grade', 'sahih')
        .not('english_text', 'is', null)
        .neq('english_text', '');
      if (HIDDEN_COLLECTION_FILTER) {
        countQuery = countQuery.not('collection_slug', 'in', HIDDEN_COLLECTION_FILTER);
      }
      const { count } = await countQuery;
      const total = count || 100;
      const offset = Math.floor(Math.random() * total);
      let rowQuery = supabase
        .from('hadiths')
        .select('*')
        .eq('grade', 'sahih')
        .not('english_text', 'is', null)
        .neq('english_text', '');
      if (HIDDEN_COLLECTION_FILTER) {
        rowQuery = rowQuery.not('collection_slug', 'in', HIDDEN_COLLECTION_FILTER);
      }
      const { data, error } = await rowQuery
        .limit(1)
        .order('id', { ascending: false })
        .range(offset, offset)
        .maybeSingle();
      if (error) throw error;
      return data as Hadith;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const { data: streak } = useQuery({
    queryKey: ['user-streak', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const handleRefresh = () => setRefreshKey(prev => prev + 1);
  const levelInfo = getLevelInfo(stats?.xp || 0);

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Explore 14,444 authentic hadith from Al-Sahihayn with AI-powered insights. Download Authentic Hadith: https://authentichadith.app',
        url: 'https://authentichadith.app',
      });
    } catch {
      // Share sheet dismissed or failed — no-op
    }
  };

  if (isLoading) return <LoadingSpinner />;

  // Tablet: 3-column quick actions, wider max content
  const quickActionWidth = IS_TABLET ? '23%' : '31%';
  const contentMaxWidth = IS_TABLET ? 680 : undefined;

  return (
    <View style={[styles.screenWrapper, { backgroundColor: colors.background }]}>
      {/* A#6: Top bar — matches web mobile-top-bar.tsx:89-131 */}
      <TopBar title="Authentic Hadith" />

    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: SPACING.md,
          paddingBottom: insets.bottom + SPACING.xxl,
          alignSelf: 'center',
          width: '100%',
          maxWidth: contentMaxWidth,
        },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={handleRefresh}
          tintColor={colors.emeraldMid}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {isError && <QueryErrorBanner onRetry={refetch} />}

      <View
        style={[
          styles.heroPanel,
          {
            backgroundColor: colors.emeraldShadow,
            borderColor: colors.goldMid,
          },
          isDark ? SHADOWS.cardDark : SHADOWS.card,
        ]}
      >
        <Text style={[styles.heroGreeting, { color: colors.goldHighlight }]}>
          {user
            ? `Assalamu Alaikum${stats?.xp ? `, ${levelInfo.title}` : ''}`
            : 'Assalamu Alaikum'}
        </Text>
        <Text style={[styles.heroTitle, { color: colors.marbleBase }]}>
          Go deeper into Bukhari and Muslim
        </Text>
        <Text style={[styles.heroCopy, { color: colors.borderSubtle }]}>
          Read the Sahihayn, reflect on one narration, ask for context, then save what you want to return to.
        </Text>

        <View style={styles.heroStatsRow}>
          <View style={[styles.heroStat, { backgroundColor: colors.white + '12', borderColor: colors.goldHighlight + '33' }]}>
            <Text style={[styles.heroStatValue, { color: colors.goldHighlight }]}>
              {VISIBLE_HADITH_TOTAL.toLocaleString()}
            </Text>
            <Text style={[styles.heroStatLabel, { color: colors.borderSubtle }]}>hadiths</Text>
          </View>
          <View style={[styles.heroStat, { backgroundColor: colors.white + '0F', borderColor: colors.goldHighlight + '33' }]}>
            <Text style={[styles.heroStatValue, { color: colors.goldHighlight }]}>
              {VISIBLE_COLLECTION_COUNT}
            </Text>
            <Text style={[styles.heroStatLabel, { color: colors.borderSubtle }]}>collections</Text>
          </View>
        </View>

        <View style={styles.heroActions}>
          <Pressable
            style={({ pressed }) => [
              styles.heroPrimaryButton,
              { backgroundColor: colors.marbleBase, opacity: pressed ? 0.82 : 1 },
            ]}
            onPress={() => router.push('/(tabs)/collections')}
            accessibilityRole="button"
            accessibilityLabel="Browse the Sahihayn library"
          >
            <Text style={[styles.heroPrimaryText, { color: colors.emeraldShadow }]}>Browse Sahihayn</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.heroSecondaryButton,
              { borderColor: colors.goldHighlight, opacity: pressed ? 0.72 : 1 },
            ]}
            onPress={() => router.push('/(tabs)/assistant')}
            accessibilityRole="button"
            accessibilityLabel="Ask the hadith assistant"
          >
            <Text style={[styles.heroSecondaryText, { color: colors.goldHighlight }]}>Ask Context</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.studyBand, { backgroundColor: colors.marbleBase, borderColor: colors.goldMid + '28' }]}>
        <View style={styles.studyHeader}>
          <Text style={[styles.sectionLabel, { color: colors.goldShadow }]}>STUDY LOOP</Text>
          <Text style={[styles.studyTitle, { color: colors.bronzeText }]}>Choose a path into the text</Text>
        </View>
        <View style={styles.studyGrid}>
          {STUDY_STEPS.map((step) => (
            <Pressable
              key={step.number}
              style={({ pressed }) => [
                styles.studyCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderTopColor: colors.emeraldMid,
                  opacity: pressed ? 0.78 : 1,
                },
              ]}
              onPress={() => router.push(step.route as any)}
              accessibilityRole="button"
              accessibilityLabel={`${step.title}: ${step.desc}`}
            >
              <Text style={[styles.studyNumber, { color: colors.goldMid }]}>{step.number}</Text>
              <Text style={[styles.studyCardTitle, { color: colors.bronzeText }]}>{step.title}</Text>
              <Text style={[styles.studyCardDesc, { color: colors.mutedText }]}>{step.desc}</Text>
            </Pressable>
          ))}
        </View>
        <View style={[styles.pageBreakRule, { backgroundColor: colors.goldMid + '38' }]} />
      </View>

      {/* A#7 hero: premium daily card leads the feed — matches web app/home/page.tsx:9
          TodayFeaturedSection renders the gold-bordered Sunnah + Reflection cards */}
      <View style={styles.dailyBand}>
        <TodayFeaturedSection />
      </View>

      {/* A#7: AI Assistant entry — surfaced prominently after the daily card */}
      <Pressable
        style={({ pressed }) => [
          styles.aiAssistantEntry,
          {
            backgroundColor: colors.card,
            borderColor: colors.goldMid,
            opacity: pressed ? 0.82 : 1,
          },
        ]}
        onPress={() => router.push('/(tabs)/assistant')}
        accessibilityRole="button"
        accessibilityLabel="Open AI Assistant"
      >
        <Text style={styles.aiAssistantIcon}>✨</Text>
        <View style={styles.aiAssistantText}>
          <Text style={[styles.aiAssistantTitle, { color: colors.bronzeText }]}>AI Assistant</Text>
          <Text style={[styles.aiAssistantSub, { color: colors.mutedText }]}>Ask anything about hadith</Text>
        </View>
        <Text style={[styles.aiAssistantChevron, { color: colors.goldMid }]}>›</Text>
      </Pressable>

      {/* Quick Actions */}
      <Text style={[styles.sectionLabel, { color: colors.mutedText }]}>EXPLORE</Text>
      <View style={styles.quickActionsGrid}>
        {QUICK_ACTIONS.map(action => (
          <Pressable
            key={action.label}
            style={({ pressed }) => [
              styles.quickAction,
              {
                width: quickActionWidth,
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
            onPress={() => router.push(action.route as any)}
            accessibilityRole="button"
            accessibilityLabel={`Go to ${action.label}`}
          >
            <Text style={styles.quickActionIcon}>{action.icon}</Text>
            <Text style={[styles.quickActionLabel, { color: colors.bronzeText }]}>
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Share the Knowledge CTA */}
      <TouchableOpacity
        style={[styles.shareRow, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={handleShare}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel="Share Authentic Hadith app"
      >
        <Text style={styles.shareIcon}>🤝</Text>
        <View style={styles.shareTextGroup}>
          <Text style={[styles.shareTitle, { color: colors.bronzeText }]}>Share Authentic Hadith</Text>
          <Text style={[styles.shareSubtitle, { color: colors.mutedText }]}>Invite friends to explore the Sahihayn</Text>
        </View>
        <Text style={[styles.shareChevron, { color: colors.goldMid }]}>›</Text>
      </TouchableOpacity>

      {/* Level + Streak (logged-in users) */}
      {user && stats && (
        <Card variant="elevated" style={styles.levelCard}>
          <LevelProgressBar levelInfo={levelInfo} />
        </Card>
      )}
      {user && streak && (
        <StreakCounter
          currentStreak={streak.current_streak || 0}
          longestStreak={streak.longest_streak || 0}
        />
      )}

      {/* Hadith of the Moment — hide entire section on error to avoid orphaned header */}
      {!isError && (
        <>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: colors.bronzeText }]}>
              Hadith of the Moment
            </Text>
            <Pressable
              onPress={handleRefresh}
              accessibilityRole="button"
              accessibilityLabel="Refresh hadith"
            >
              <Text style={[styles.refreshLink, { color: colors.goldMid }]}>Refresh</Text>
            </Pressable>
          </View>

          {hadith && (
            <HadithCard
              hadith={hadith}
              onPress={() => router.push(`/hadith/${hadith.id}`)}
              showSummarize
            />
          )}
        </>
      )}

      <View style={styles.actions}>
        <Button title="Browse Collections" onPress={() => router.push('/(tabs)/collections')} variant="outline" />
      </View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Outer wrapper contains TopBar + ScrollView (flex column)
  screenWrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 0,
  },
  heroPanel: {
    borderRadius: BORDER_RADIUS.card,
    borderWidth: 1,
    padding: SPACING.lg,
    marginHorizontal: 20,
    marginBottom: SPACING.lg,
  },
  heroGreeting: {
    fontFamily: FONT_FAMILY.bodyMedium,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  heroTitle: {
    fontFamily: FONT_FAMILY.heading,
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    lineHeight: 34,
    marginBottom: SPACING.sm,
  },
  heroCopy: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.base,
    lineHeight: 21,
    marginBottom: SPACING.md,
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  heroStat: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  heroStatValue: {
    fontFamily: FONT_FAMILY.heading,
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
  },
  heroStatLabel: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  heroActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  heroPrimaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  heroSecondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  heroPrimaryText: {
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    textAlign: 'center',
  },
  heroSecondaryText: {
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    textAlign: 'center',
  },
  studyHeader: {
    marginBottom: SPACING.sm,
  },
  studyBand: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingTop: SPACING.md,
    paddingBottom: 112,
    marginBottom: SPACING.lg,
  },
  studyTitle: {
    fontFamily: FONT_FAMILY.headingMedium,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  studyGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  studyCard: {
    flex: 1,
    minHeight: 112,
    borderRadius: BORDER_RADIUS.card,
    borderWidth: 1,
    padding: SPACING.sm,
    justifyContent: 'space-between',
  },
  pageBreakRule: {
    alignSelf: 'center',
    width: 56,
    height: 2,
    borderRadius: 1,
    marginTop: SPACING.lg,
  },
  dailyBand: {
    paddingHorizontal: 20,
    marginBottom: SPACING.lg,
  },
  studyNumber: {
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  studyCardTitle: {
    fontFamily: FONT_FAMILY.headingMedium,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  studyCardDesc: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.xs,
    lineHeight: 16,
  },
  levelCard: {
    marginHorizontal: 20,
    marginBottom: SPACING.md,
  },
  sectionLabel: {
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
    marginHorizontal: 20,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginHorizontal: 20,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILY.heading,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  refreshLink: {
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    paddingHorizontal: 20,
    marginBottom: SPACING.lg,
  },
  quickAction: {
    borderRadius: BORDER_RADIUS.card,
    paddingVertical: 14,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
  },
  quickActionIcon: {
    fontSize: 26,
  },
  quickActionLabel: {
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.card,
    borderWidth: 1,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  shareIcon: {
    fontSize: 24,
  },
  shareTextGroup: {
    flex: 1,
    gap: 2,
  },
  shareTitle: {
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  shareSubtitle: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.sm,
  },
  shareChevron: {
    fontSize: 24,
    fontWeight: '300',
    lineHeight: 28,
  },
  // A#7: AI assistant prominent entry card
  aiAssistantEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.card,
    padding: 16,
    borderWidth: 1,
    marginHorizontal: 20,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  aiAssistantIcon: {
    fontSize: 24,
  },
  aiAssistantText: {
    flex: 1,
    gap: 2,
  },
  aiAssistantTitle: {
    fontFamily: FONT_FAMILY.headingMedium,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  aiAssistantSub: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.sm,
  },
  aiAssistantChevron: {
    fontSize: 24,
    fontWeight: '300',
    lineHeight: 28,
  },
});
