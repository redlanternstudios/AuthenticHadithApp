import React from 'react'
import { FlatList, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useCollections } from '@/hooks/use-hadiths'
import { Ionicons } from '@expo/vector-icons'
import { getColors } from '@/lib/styles/colors'
import { FONT_FAMILY } from '@/constants/theme'
import { filterVisibleCollections, VISIBLE_COLLECTION_COUNT, VISIBLE_HADITH_TOTAL } from '@/lib/hadith/visibleCollections'
import { TopBar } from '@/components/layout/TopBar'
import { IslamicPatternBackground } from '@/components/ui/IslamicPatternBackground'
import { useTheme } from '@/lib/theme/ThemeProvider'

const COLLECTION_ACCENTS: Record<string, { label: string; summary: string; accent: string; icon: keyof typeof Ionicons.glyphMap }> = {
  'sahih-bukhari': {
    label: 'The first of the Sahihayn',
    summary: 'Canonical chapters from Imam al Bukhari with verified references and organized book titles.',
    accent: '#e8c77d',
    icon: 'library',
  },
  'sahih-muslim': {
    label: 'The second of the Sahihayn',
    summary: 'Imam Muslim collection entries grouped by book for direct reading and study.',
    accent: '#4a9973',
    icon: 'book',
  },
}

export default function CollectionsScreen() {
  const router = useRouter()
  const { data: collections, isLoading } = useCollections()
  const { isDark } = useTheme()
  const colors = getColors(isDark)
  const visibleCollections = filterVisibleCollections(collections ?? []).sort((first, second) => {
    const order = ['sahih-bukhari', 'sahih-muslim']
    return order.indexOf(first.slug ?? '') - order.indexOf(second.slug ?? '')
  })

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.emeraldMid} />
      </View>
    )
  }

  return (
    <IslamicPatternBackground style={[styles.screen, { backgroundColor: colors.background }]} isDark={isDark}>
      <TopBar title="Collections" showBack />
      <FlatList
        data={visibleCollections}
        keyExtractor={(item) => item.id}
        style={styles.listSurface}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.kicker, { color: colors.goldMid }]}>THE SAHIHAYN</Text>
            <Text style={[styles.heroTitle, { color: colors.bronzeText }]}>
              Bukhari and Muslim only
            </Text>
            <Text style={[styles.heroCopy, { color: colors.mutedText }]}>
              Browse the authenticated corpus by collection, then move into books, topics, and hadith detail.
            </Text>
            <View style={styles.statRow}>
              <View style={[styles.statBox, { borderColor: colors.borderSubtle }]}>
                <Text style={[styles.statValue, { color: colors.goldHighlight }]}>
                  {VISIBLE_HADITH_TOTAL.toLocaleString()}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedText }]}>hadiths</Text>
              </View>
              <View style={[styles.statBox, { borderColor: colors.borderSubtle }]}>
                <Text style={[styles.statValue, { color: colors.goldHighlight }]}>
                  {VISIBLE_COLLECTION_COUNT}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedText }]}>collections</Text>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push(`/collection/${item.slug}`)}
            accessibilityLabel={`Open ${item.name_en} collection`}
            accessibilityRole="button"
          >
            <View style={styles.cardContent}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: (COLLECTION_ACCENTS[item.slug ?? '']?.accent ?? colors.emeraldMid) + '22' },
                ]}
              >
                <Ionicons
                  name={COLLECTION_ACCENTS[item.slug ?? '']?.icon ?? 'book'}
                  size={28}
                  color={COLLECTION_ACCENTS[item.slug ?? '']?.accent ?? colors.emeraldMid}
                />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.collectionName, { color: colors.bronzeText, fontFamily: FONT_FAMILY.headingMedium }]}>
                  {item.name_en}
                </Text>
                <Text style={[styles.label, { color: COLLECTION_ACCENTS[item.slug ?? '']?.accent ?? colors.goldMid }]}>
                  {COLLECTION_ACCENTS[item.slug ?? '']?.label ?? item.name_ar}
                </Text>
                {item.description_en && (
                  <Text style={[styles.description, { color: colors.mutedText }]} numberOfLines={2}>
                    {COLLECTION_ACCENTS[item.slug ?? '']?.summary ?? item.description_en}
                  </Text>
                )}
                <View style={[styles.countPill, { borderColor: colors.borderSubtle }]}>
                  <Text style={[styles.count, { color: colors.bronzeText }]}>
                    {item.total_hadiths?.toLocaleString() || 0} hadiths
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.goldMid} />
            </View>
          </TouchableOpacity>
        )}
      />
    </IslamicPatternBackground>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listSurface: {
    flex: 1,
  },
  list: {
    padding: 20,
    paddingBottom: 120,
    flexGrow: 1,
  },
  hero: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    marginBottom: 18,
  },
  kicker: {
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.6,
    marginBottom: 8,
  },
  heroTitle: {
    fontFamily: FONT_FAMILY.heading,
    fontSize: 30,
    lineHeight: 36,
    marginBottom: 10,
  },
  heroCopy: {
    fontFamily: FONT_FAMILY.body,
    fontSize: 15,
    lineHeight: 22,
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  statBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  statValue: {
    fontFamily: FONT_FAMILY.heading,
    fontSize: 24,
  },
  statLabel: {
    fontFamily: FONT_FAMILY.body,
    fontSize: 11,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  card: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 58,
    height: 58,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  collectionName: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 6,
  },
  label: {
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    fontFamily: FONT_FAMILY.body,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  countPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  count: {
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontSize: 12,
    fontWeight: '700',
  },
})
