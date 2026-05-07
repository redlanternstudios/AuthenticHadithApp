import React, { useState } from 'react'
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Pressable,
} from 'react-native'
import { useLocalSearchParams, Stack, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useHadith } from '@/hooks/use-hadith'
import { useAuth } from '@/hooks/use-auth'
import { useTheme } from '@/lib/theme/ThemeProvider'
import { getColors, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, LAYOUT } from '@/lib/styles/colors'
import { useDeviceLayout } from '@/lib/hooks/use-device-layout'
import { shareHadith } from '@/components/share/ShareSheet'
import { SaveHadithModal } from '@/components/my-hadith/SaveHadithModal'
import { sendChatMessage } from '@/lib/api/groq'

export default function HadithDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const { isDark } = useTheme()
  const colors = getColors(isDark)
  const { contentBottom, pagePadding, maxContentWidth } = useDeviceLayout()
  const router = useRouter()

  const { hadith, isLoading, isBookmarked, toggleBookmark, isTogglingBookmark } = useHadith(
    id,
    user?.id,
  )

  const [showSaveModal, setShowSaveModal] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [isSummarizing, setIsSummarizing] = useState(false)

  const handleSummarize = async () => {
    if (!hadith) return
    setIsSummarizing(true)
    setSummary(null)
    try {
      const response = await sendChatMessage([
        {
          id: Date.now().toString(),
          role: 'user',
          content: `Please provide a brief, clear summary of this hadith in 2-3 sentences. Focus on the key teaching or lesson:\n\n${hadith.english_text}`,
          timestamp: new Date().toISOString(),
        },
      ])
      setSummary(response)
    } catch {
      Alert.alert('Error', 'Could not generate summary. Please try again.')
    } finally {
      setIsSummarizing(false)
    }
  }

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.emeraldMid} />
      </View>
    )
  }

  if (!hadith) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.mutedText }]}>Hadith not found</Text>
      </View>
    )
  }

  const collectionName =
    hadith.collection?.name || hadith.collection_slug || 'Unknown Collection'

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.emeraldMid,
          headerShadowVisible: false,
          // Transparent header blends with page background on iOS
          headerTransparent: false,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => toggleBookmark()}
              disabled={isTogglingBookmark || !user}
              style={styles.headerBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={isBookmarked ? colors.emeraldMid : colors.mutedText}
              />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: contentBottom,
            paddingHorizontal: pagePadding,
            alignSelf: 'center',
            width: '100%',
            maxWidth: maxContentWidth,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Collection + Number */}
        <View style={[styles.metaRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.collectionName, { color: colors.emeraldMid }]}>
            {collectionName}
          </Text>
          <Text style={[styles.hadithNumber, { color: colors.mutedText }]}>
            Hadith #{hadith.hadith_number}
          </Text>
        </View>

        {/* Grade badge + narrator */}
        <View style={styles.badgeRow}>
          {hadith.grade && (
            <View
              style={[
                styles.gradeBadge,
                {
                  backgroundColor:
                    hadith.grade === 'sahih'
                      ? colors.sahih + '18'
                      : hadith.grade === 'hasan'
                      ? colors.hasan + '18'
                      : colors.daif + '18',
                },
              ]}
            >
              <Text
                style={[
                  styles.gradeText,
                  {
                    color:
                      hadith.grade === 'sahih'
                        ? colors.sahih
                        : hadith.grade === 'hasan'
                        ? colors.hasan
                        : colors.daif,
                  },
                ]}
              >
                {hadith.grade.charAt(0).toUpperCase() + hadith.grade.slice(1)}
              </Text>
            </View>
          )}
          {hadith.narrator && (
            <Text style={[styles.narrator, { color: colors.mutedText }]}>
              {hadith.narrator}
            </Text>
          )}
        </View>

        {/* Arabic text */}
        {hadith.arabic_text ? (
          <View style={[styles.textSection, { borderBottomColor: colors.borderSubtle }]}>
            <Text style={[styles.sectionLabel, { color: colors.mutedText }]}>Arabic</Text>
            <Text style={[styles.arabicText, { color: colors.bronzeText }]}>
              {hadith.arabic_text}
            </Text>
          </View>
        ) : null}

        {/* English */}
        <View style={[styles.textSection, { borderBottomColor: colors.borderSubtle }]}>
          <Text style={[styles.sectionLabel, { color: colors.mutedText }]}>Translation</Text>
          <Text style={[styles.englishText, { color: colors.bronzeText }]}>
            {hadith.english_text}
          </Text>
        </View>

        {/* AI summarise button */}
        <Pressable
          style={({ pressed }) => [
            styles.summarizeBtn,
            {
              backgroundColor: colors.goldMid + '18',
              borderColor: colors.goldMid + '60',
              opacity: pressed || isSummarizing ? 0.75 : 1,
            },
          ]}
          onPress={handleSummarize}
          disabled={isSummarizing}
        >
          {isSummarizing ? (
            <ActivityIndicator size="small" color={colors.goldMid} />
          ) : (
            <Ionicons name="sparkles-outline" size={17} color={colors.goldMid} />
          )}
          <Text style={[styles.summarizeBtnText, { color: colors.goldMid }]}>
            {isSummarizing ? 'Summarising…' : 'AI Summary'}
          </Text>
        </Pressable>

        {/* Summary result */}
        {summary ? (
          <View
            style={[
              styles.summaryBox,
              { backgroundColor: colors.card, borderColor: colors.border },
              isDark ? SHADOWS.cardDark : SHADOWS.subtle,
            ]}
          >
            <Text style={[styles.sectionLabel, { color: colors.emeraldMid }]}>Summary</Text>
            <Text style={[styles.summaryText, { color: colors.bronzeText }]}>{summary}</Text>
          </View>
        ) : null}

        {/* Action buttons */}
        <View style={styles.actions}>
          {[
            {
              icon: 'folder-outline' as const,
              label: 'Save',
              onPress: () => setShowSaveModal(true),
            },
            {
              icon: 'share-outline' as const,
              label: 'Share',
              onPress: () => shareHadith(hadith),
            },
            {
              icon: 'library-outline' as const,
              label: 'Collection',
              onPress: () => router.push(`/collection/${hadith.collection_slug}`),
            },
          ].map(btn => (
            <Pressable
              key={btn.label}
              style={({ pressed }) => [
                styles.actionBtn,
                { borderColor: colors.border, backgroundColor: colors.card },
                pressed && { opacity: 0.7 },
              ]}
              onPress={btn.onPress}
            >
              <Ionicons name={btn.icon} size={18} color={colors.emeraldMid} />
              <Text style={[styles.actionBtnText, { color: colors.emeraldMid }]}>
                {btn.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <SaveHadithModal
        visible={showSaveModal}
        hadithId={id}
        onClose={() => setShowSaveModal(false)}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: SPACING.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: FONT_SIZES.md,
  },
  headerBtn: {
    marginRight: 4,
    padding: SPACING.sm,
  },
  metaRow: {
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  collectionName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  hadithNumber: {
    fontSize: FONT_SIZES.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
    flexWrap: 'wrap',
  },
  gradeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  gradeText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  narrator: {
    fontSize: FONT_SIZES.sm,
    fontStyle: 'italic',
    flex: 1,
  },
  textSection: {
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  arabicText: {
    fontSize: FONT_SIZES.xl,
    lineHeight: 40,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  englishText: {
    fontSize: FONT_SIZES.md,
    lineHeight: 28,
  },
  summarizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: 13,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    minHeight: LAYOUT.touchTarget,
  },
  summarizeBtnText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
  summaryBox: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  summaryText: {
    fontSize: FONT_SIZES.base,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: 12,
    minHeight: LAYOUT.touchTarget,
  },
  actionBtnText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
})
