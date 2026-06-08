import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  RefreshControl,
  Pressable,
  Dimensions,
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
import { getColors, SPACING, FONT_SIZES } from '@/lib/styles/colors';
import { getLevelInfo } from '@/lib/gamification/level-calculator';
import { TodayFeaturedSection } from '@/components/home/TodayFeaturedSection';
import { Hadith } from '@/types/hadith';
import { QueryErrorBanner } from '@/components/common/QueryErrorBanner';
import { VISIBLE_COLLECTION_COUNT, VISIBLE_HADITH_TOTAL, HIDDEN_COLLECTION_FILTER } from '@/lib/hadith/visibleCollections';

const QUICK_ACTIONS = [
  { icon: '☀️', label: 'Today', route: '/(tabs)/today' },
  { icon: '🧠', label: 'Quiz', route: '/quiz' },
  { icon: '📖', label: 'Stories', route: '/stories' },
  { icon: '🕌', label: 'Sunnah', route: '/sunnah' },
  { icon: '📊', label: 'Progress', route: '/progress' },
  { icon: '🏆', label: 'Badges', route: '/achievements' },
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

  if (isLoading) return <LoadingSpinner />;

  // Tablet: 3-column quick actions, wider max content
  const quickActionWidth = IS_TABLET ? '23%' : '31%';
  const contentMaxWidth = IS_TABLET ? 680 : undefined;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + SPACING.md,
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

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: colors.goldMid }]}>
          {user
            ? `Assalamu Alaikum${stats?.xp ? `, ${levelInfo.title}` : ''}`
            : 'Assalamu Alaikum'}
        </Text>
        <Text style={[styles.title, { color: colors.bronzeText }]}>Authentic Hadith</Text>
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>
          {VISIBLE_HADITH_TOTAL.toLocaleString()} hadiths from {VISIBLE_COLLECTION_COUNT} major collections
        </Text>
      </View>

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

      {/* Today's featured slot — surfaces date-driven sunnah + reflection on Home.
          The full Today screen remains reachable via the CTA and from More → Today. */}
      <TodayFeaturedSection />

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
          >
            <Text style={styles.quickActionIcon}>{action.icon}</Text>
            <Text style={[styles.quickActionLabel, { color: colors.bronzeText }]}>
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Hadith of the Moment */}
      <View style={styles.sectionRow}>
        <Text style={[styles.sectionTitle, { color: colors.bronzeText }]}>
          Hadith of the Moment
        </Text>
        <Pressable onPress={handleRefresh}>
          <Text style={[styles.refreshLink, { color: colors.emeraldMid }]}>Refresh</Text>
        </Pressable>
      </View>

      {hadith && (
        <HadithCard
          hadith={hadith}
          onPress={() => router.push(`/hadith/${hadith.id}`)}
          showSummarize
        />
      )}

      <View style={styles.actions}>
        <Button title="Browse Collections" onPress={() => router.push('/(tabs)/collections')} variant="outline" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  greeting: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    lineHeight: 18,
  },
  levelCard: {
    marginBottom: SPACING.md,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  refreshLink: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  quickAction: {
    borderRadius: 16,
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
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
});
