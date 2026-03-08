import React, { useState } from 'react'
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native'
import { useLocalSearchParams, Stack, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useHadith } from '@/hooks/use-hadith'
import { useAuth } from '@/hooks/use-auth'
import { useTheme } from '@/lib/theme/ThemeProvider'
import { getColors, SPACING, FONT_SIZES, BORDER_RADIUS } from '@/lib/styles/colors'
import { shareHadith } from '@/components/share/ShareSheet'
import { SaveHadithModal } from '@/components/my-hadith/SaveHadithModal'
import { sendChatMessage } from '@/lib/api/groq'

export default function HadithDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const { isDark } = useTheme()
  const colors = getColors(isDark)
  const router = useRouter()

  const { hadith, isLoading, isBookmarked, toggleBookmark, isTogglingBookmark } = useHadith(id, user?.id)

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

  const collectionName = hadith.collection?.name || hadith.collection_slug || 'Unknown Collection'

  return (
    <>
      <Stack.Screen
        options={{
          title: `Hadith ${hadith.hadith_number}`,
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.emeraldMid,
          headerShadowVisible: false,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => toggleBookmark()}
              disabled={isTogglingBookmark || !user}
              style={styles.headerBtn}
            >
              <Ionicons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={24}
                color={isBookmarked ? colors.emeraldMid : colors.mutedText}
              />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Collection + Hadith Number Header */}
        <View style={[styles.metaRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.collectionName, { color: colors.emeraldMid }]}>{collectionName}</Text>
          <Text style={[styles.hadithNumber, { color: colors.mutedText }]}>
            Hadith #{hadith.hadith_number}
          </Text>
        </View>

        {/* Grade Badge */}
        {hadith.grade && (
          <View
            style={[
              styles.gradeBadge,
              {
                backgroundColor:
                  hadith.grade === 'sahih'
                    ? colors.sahih + '15'
                    : hadith.grade === 'hasan'
                      ? colors.hasan + '15'
                      : colors.daif + '15',
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

        {/* Narrator */}
        {hadith.narrator && (
          <Text style={[styles.narrator, { color: colors.mutedText }]}>
            Narrated by {hadith.narrator}
          </Text>
        )}

        {/* Arabic Text — full, no numberOfLines */}
        {hadith.arabic_text ? (
          <View style={[styles.section, { borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.mutedText }]}>Arabic</Text>
            <Text style={[styles.arabicText, { color: colors.bronzeText }]}>
              {hadith.arabic_text}
            </Text>
          </View>
        ) : null}

        {/* English Text — full, no numberOfLines */}
        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.mutedText }]}>Translation</Text>
          <Text style={[styles.englishText, { color: colors.bronzeText }]}>
            {hadith.english_text}
          </Text>
        </View>

        {/* Summarize Button */}
        <TouchableOpacity
          style={[styles.summarizeBtn, { backgroundColor: colors.goldMid + '20', borderColor: colors.goldMid }]}
          onPress={handleSummarize}
          disabled={isSummarizing}
          activeOpacity={0.75}
        >
          {isSummarizing ? (
            <ActivityIndicator size="small" color={colors.goldMid} />
          ) : (
            <Ionicons name="sparkles-outline" size={18} color={colors.goldMid} />
          )}
          <Text style={[styles.summarizeBtnText, { color: colors.goldMid }]}>
            {isSummarizing ? 'Summarizing…' : 'Summarize this Hadith'}
          </Text>
        </TouchableOpacity>

        {/* Summary Result */}
        {summary ? (
          <View style={[styles.summaryBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.summaryLabel, { color: colors.emeraldMid }]}>Summary</Text>
            <Text style={[styles.summaryText, { color: colors.bronzeText }]}>{summary}</Text>
          </View>
        ) : null}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={() => setShowSaveModal(true)}
          >
            <Ionicons name="folder-outline" size={18} color={colors.emeraldMid} />
            <Text style={[styles.actionBtnText, { color: colors.emeraldMid }]}>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={() => shareHadith(hadith)}
          >
            <Ionicons name="share-outline" size={18} color={colors.emeraldMid} />
            <Text style={[styles.actionBtnText, { color: colors.emeraldMid }]}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={() => router.push(`/collection/${hadith.collection_slug}`)}
          >
            <Ionicons name="library-outline" size={18} color={colors.emeraldMid} />
            <Text style={[styles.actionBtnText, { color: colors.emeraldMid }]}>Collection</Text>
          </TouchableOpacity>
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
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
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
    marginRight: SPACING.sm,
    padding: SPACING.sm,
  },
  metaRow: {
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  collectionName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    marginBottom: 2,
  },
  hadithNumber: {
    fontSize: FONT_SIZES.sm,
  },
  gradeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    marginBottom: SPACING.md,
  },
  gradeText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  narrator: {
    fontSize: FONT_SIZES.sm,
    fontStyle: 'italic',
    marginBottom: SPACING.md,
  },
  section: {
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
  },
  sectionLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  arabicText: {
    fontSize: FONT_SIZES.xl,
    lineHeight: 38,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  englishText: {
    fontSize: FONT_SIZES.md,
    lineHeight: 26,
  },
  summarizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  summarizeBtnText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
  summaryBox: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  summaryText: {
    fontSize: FONT_SIZES.base,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  actionBtnText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
})
