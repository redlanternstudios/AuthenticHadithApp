import React, { useState } from 'react'
import { StyleSheet, View, ScrollView, Text, Pressable } from 'react-native'
import { Stack } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Card } from '@/components/ui/Card'
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@/lib/styles/colors'

const FALLBACK_CATEGORIES = [
  {
    name: 'Morning & Evening',
    icon: '🌅',
    color: '#F59E0B',
    practices: [
      { title: 'Say morning adhkar after Fajr', reference: 'Sunan Abu Dawud 5068' },
      { title: 'Read Ayat al-Kursi after each prayer', reference: "Sunan an-Nasa'i 9928" },
      { title: 'Say evening adhkar before Maghrib', reference: 'Sahih al-Bukhari 6306' },
    ],
  },
  {
    name: 'Prayer',
    icon: '🕌',
    color: '#1B5E43',
    practices: [
      { title: 'Pray 12 Sunnah rak\'ahs daily', reference: 'Sahih Muslim 728' },
      { title: 'Pray Duha (forenoon) prayer', reference: 'Sahih Muslim 748' },
      { title: 'Pray Witr before sleeping', reference: 'Sahih al-Bukhari 998' },
    ],
  },
  {
    name: 'Food & Drink',
    icon: '🍽️',
    color: '#C5A059',
    practices: [
      { title: 'Say Bismillah before eating', reference: 'Sahih al-Bukhari 5376' },
      { title: 'Eat with your right hand', reference: 'Sahih Muslim 2020' },
      { title: 'Drink water in three sips', reference: 'Sahih Muslim 2028' },
    ],
  },
  {
    name: 'Character',
    icon: '❤️',
    color: '#EF4444',
    practices: [
      { title: 'Smile at others', reference: 'Jami at-Tirmidhi 1956' },
      { title: 'Speak good or remain silent', reference: 'Sahih al-Bukhari 6018' },
      { title: 'Remove harm from the path', reference: 'Sahih Muslim 1914' },
    ],
  },
  {
    name: 'Dhikr & Dua',
    icon: '📿',
    color: '#8B5CF6',
    practices: [
      { title: 'Say SubhanAllah 33 times after prayer', reference: 'Sahih Muslim 595' },
      { title: 'Make istighfar 100 times daily', reference: 'Sahih Muslim 2702' },
      { title: 'Send salawat upon the Prophet ﷺ', reference: 'Sahih Muslim 408' },
    ],
  },
  {
    name: 'Hygiene',
    icon: '🪥',
    color: '#06B6D4',
    practices: [
      { title: 'Use the miswak', reference: 'Sahih al-Bukhari 887' },
      { title: 'Clip nails regularly', reference: 'Sahih Muslim 258' },
      { title: 'Keep the body clean', reference: 'Sahih Muslim 223' },
    ],
  },
  {
    name: 'Charity & Kindness',
    icon: '🤲',
    color: '#10B981',
    practices: [
      { title: 'Give charity, even if small', reference: 'Sahih al-Bukhari 1417' },
      { title: 'Visit the sick', reference: 'Sahih al-Bukhari 5649' },
      { title: 'Feed the hungry', reference: 'Sahih al-Bukhari 12' },
    ],
  },
  {
    name: 'Sleep',
    icon: '🌙',
    color: '#6366F1',
    practices: [
      { title: 'Sleep on your right side', reference: 'Sahih al-Bukhari 6311' },
      { title: 'Recite Surah al-Mulk before sleep', reference: 'Jami at-Tirmidhi 2891' },
      { title: 'Make wudu before sleeping', reference: 'Sahih al-Bukhari 247' },
    ],
  },
]

export default function SunnahScreen() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const { data: dbCategories, isLoading } = useQuery({
    queryKey: ['sunnah-categories'],
    queryFn: async () => {
      const { data: categories } = await supabase
        .from('sunnah_categories')
        .select('*')
        .order('sort_order')

      if (!categories || categories.length === 0) return null

      const { data: practices } = await supabase
        .from('sunnah_practices')
        .select('*')
        .order('sort_order')

      const grouped = categories.map((cat) => ({
        ...cat,
        name: cat.title,
        icon: cat.icon || '📿',
        practices: (practices || []).filter((p) => p.category_id === cat.id),
      }))

      return grouped
    },
  })

  const categories = dbCategories || FALLBACK_CATEGORIES

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Sunnah Practices', headerShown: true }} />

      <Text style={styles.title}>Sunnah Practices</Text>
      <Text style={styles.subtitle}>
        Daily practices from the life of the Prophet ﷺ
      </Text>

      {categories.map((category) => {
        const isExpanded = expandedCategory === category.name
        return (
          <View key={category.name} style={styles.categoryContainer}>
            <Pressable
              style={styles.categoryHeader}
              onPress={() => setExpandedCategory(isExpanded ? null : category.name)}
            >
              <View style={[styles.categoryIcon, { backgroundColor: (category.color || COLORS.emeraldMid) + '20' }]}>
                <Text style={styles.categoryIconText}>{category.icon}</Text>
              </View>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryCount}>
                  {category.practices?.length || 0} practices
                </Text>
              </View>
              <Text style={[styles.chevron, isExpanded && styles.chevronExpanded]}>
                ›
              </Text>
            </Pressable>

            {isExpanded && (
              <View style={styles.practicesList}>
                {(category.practices || []).map((practice: any, i: number) => (
                  <View key={i} style={styles.practiceItem}>
                    <View style={styles.practiceDot} />
                    <View style={styles.practiceContent}>
                      <Text style={styles.practiceTitle}>{practice.title}</Text>
                      <Text style={styles.practiceRef}>{practice.hadith_ref || practice.reference}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  title: { fontSize: FONT_SIZES.xxxl, fontWeight: '700', color: COLORS.bronzeText, paddingTop: SPACING.md },
  subtitle: { fontSize: FONT_SIZES.base, color: COLORS.mutedText, marginBottom: SPACING.lg },
  categoryContainer: {
    backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.md,
  },
  categoryIcon: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
  },
  categoryIconText: { fontSize: 20 },
  categoryInfo: { flex: 1 },
  categoryName: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.bronzeText },
  categoryCount: { fontSize: FONT_SIZES.sm, color: COLORS.mutedText },
  chevron: { fontSize: 24, color: COLORS.mutedText, transform: [{ rotate: '0deg' }] },
  chevronExpanded: { transform: [{ rotate: '90deg' }] },
  practicesList: {
    paddingHorizontal: SPACING.md, paddingBottom: SPACING.md,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  practiceItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  practiceDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.goldMid, marginTop: 7,
  },
  practiceContent: { flex: 1 },
  practiceTitle: { fontSize: FONT_SIZES.base, color: COLORS.bronzeText, lineHeight: 20 },
  practiceRef: { fontSize: FONT_SIZES.xs, color: COLORS.mutedText, marginTop: 2 },
})
