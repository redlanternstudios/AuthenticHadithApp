import React from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native'
import { Stack } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/lib/theme/ThemeProvider'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import { getColors, SPACING, FONT_SIZES, BORDER_RADIUS } from '@/lib/styles/colors'
import { SettingsSection } from '@/components/settings/SettingsSection'

const LANGUAGES = [
  {
    code: 'en' as const,
    label: 'English',
    nativeLabel: 'English',
    flag: '🇬🇧',
    direction: 'LTR',
  },
  {
    code: 'ar' as const,
    label: 'Arabic',
    nativeLabel: 'العربية',
    flag: '🇦🇪',
    direction: 'RTL',
  },
]

/**
 * Language settings screen
 * Allows users to switch between English and Arabic
 * Integrates with LanguageProvider — preference persists across sessions
 */
export default function LanguageScreen() {
  const { isDark } = useTheme()
  const { language, setLanguage, isRTL } = useLanguage()
  const colors = getColors(isDark)

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: isRTL ? 'اللغة' : 'Language',
          headerShown: true,
          headerBackTitle: isRTL ? 'الإعدادات' : 'Settings',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.emeraldMid,
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, isRTL && styles.headerRTL]}>
          <Text style={[styles.headerTitle, { color: colors.bronzeText }, isRTL && styles.textRTL]}>
            {isRTL ? 'لغة التطبيق' : 'App Language'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedText }, isRTL && styles.textRTL]}>
            {isRTL
              ? 'اختر لغتك المفضلة. سيُعرض التطبيق باللغة المختارة.'
              : 'Select your preferred language. The app will display in the selected language.'}
          </Text>
        </View>

        {/* Language Options */}
        <SettingsSection title={isRTL ? 'لغة العرض' : 'Display Language'}>
          {LANGUAGES.map((lang, index) => {
            const isSelected = language === lang.code
            return (
              <Pressable
                key={lang.code}
                style={[
                  styles.langItem,
                  isRTL && styles.langItemRTL,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  isSelected && { borderColor: colors.emeraldMid, backgroundColor: colors.emeraldMid + '0D' },
                  index === 0 && styles.langItemFirst,
                  index === LANGUAGES.length - 1 && styles.langItemLast,
                ]}
                onPress={() => setLanguage(lang.code)}
              >
                <Text style={styles.langFlag}>{lang.flag}</Text>
                <View style={[styles.langTextGroup, isRTL && styles.langTextGroupRTL]}>
                  <Text style={[styles.langNative, { color: colors.bronzeText }]}>
                    {lang.nativeLabel}
                  </Text>
                  <Text style={[styles.langEnglish, { color: colors.mutedText }]}>
                    {lang.label} · {lang.direction}
                  </Text>
                </View>
                <View style={[styles.langCheck, isRTL && styles.langCheckRTL]}>
                  {isSelected ? (
                    <Ionicons name="checkmark-circle" size={22} color={colors.emeraldMid} />
                  ) : (
                    <View style={[styles.unchecked, { borderColor: colors.border }]} />
                  )}
                </View>
              </Pressable>
            )
          })}
        </SettingsSection>

        {/* RTL note */}
        <View style={[styles.infoBox, isRTL && styles.infoBoxRTL]}>
          <Ionicons name="information-circle-outline" size={16} color={colors.mutedText} style={styles.infoIcon} />
          <Text style={[styles.infoText, { color: colors.mutedText }, isRTL && styles.textRTL]}>
            {isRTL
              ? 'يسري تخطيط RTL الكامل بعد إعادة تشغيل التطبيق.'
              : 'Full RTL layout takes effect after restarting the app.'}
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  headerRTL: {
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.base,
    lineHeight: 22,
  },
  textRTL: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderWidth: 1,
    gap: SPACING.md,
  },
  langItemRTL: {
    flexDirection: 'row-reverse',
  },
  langItemFirst: {
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
  },
  langItemLast: {
    borderBottomLeftRadius: BORDER_RADIUS.lg,
    borderBottomRightRadius: BORDER_RADIUS.lg,
  },
  langFlag: {
    fontSize: 28,
  },
  langTextGroup: {
    flex: 1,
  },
  langTextGroupRTL: {
    alignItems: 'flex-end',
  },
  langNative: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginBottom: 2,
  },
  langEnglish: {
    fontSize: FONT_SIZES.sm,
  },
  langCheck: {
    marginLeft: 'auto',
  },
  langCheckRTL: {
    marginLeft: 0,
    marginRight: 'auto',
  },
  unchecked: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xs,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  infoBoxRTL: {
    flexDirection: 'row-reverse',
  },
  infoIcon: {
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
  },
})
