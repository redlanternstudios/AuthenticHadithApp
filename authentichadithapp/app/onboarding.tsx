import React, { useState } from 'react'
import { StyleSheet, View, ScrollView, Text, Pressable, TextInput, Alert, Linking } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useTheme } from '@/lib/theme/ThemeProvider'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { getColors, SPACING, FONT_SIZES, BORDER_RADIUS } from '@/lib/styles/colors'

const TOTAL_STEPS = 3

const SCHOOLS_OF_THOUGHT = ['Hanafi', 'Maliki', "Shafi'i", 'Hanbali', 'Other / Prefer not to say']

// Counts reflect actual production rows per V1_CONTENT_AI_AUDIT.md (not
// aspirational corpus totals). Do not edit these without re-querying the
// `collections.total_hadiths` column.
const COLLECTIONS = [
  { id: 'bukhari', name: 'Sahih Bukhari', count: '7,277 hadiths' },
  { id: 'muslim', name: 'Sahih Muslim', count: '7,167 hadiths' },
  { id: 'tirmidhi', name: 'Sunan at-Tirmidhi', count: '3,241 hadiths' },
  { id: 'abudawud', name: 'Sunan Abu Dawud', count: '3,751 hadiths' },
  { id: 'nasai', name: "Sunan an-Nasa'i", count: '5,045 hadiths' },
  { id: 'ibnmajah', name: 'Sunan Ibn Majah', count: '3,524 hadiths' },
]

const LEARNING_LEVELS = ['Beginner', 'Intermediate', 'Advanced']

const LANGUAGES = [
  { code: 'en' as const, label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
  { code: 'ar' as const, label: 'Arabic', nativeLabel: 'العربية', flag: '🇦🇪' },
]

interface OnboardingData {
  name: string
  schoolOfThought: string
  collections: string[]
  learningLevel: string
  safetyAgreed: boolean
  termsAgreed: boolean
}

export default function OnboardingScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const { isDark } = useTheme()
  const colors = getColors(isDark)
  const { language, setLanguage, isRTL } = useLanguage()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<OnboardingData>({
    name: '',
    schoolOfThought: '',
    collections: [],
    learningLevel: 'Intermediate',
    safetyAgreed: false,
    termsAgreed: false,
  })

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }))
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return data.name.trim().length >= 2
      case 2:
        return true
      case 3:
        return data.safetyAgreed && data.termsAgreed
      default:
        return false
    }
  }

  const handleComplete = async () => {
    if (!user) {
      await AsyncStorage.setItem('onboarded', 'true')
      router.replace('/paywall')
      return
    }

    setLoading(true)
    try {
      // Live `profiles` schema: `name` (NOT full_name), `user_id` NOT NULL and is the
      // key the app reads by. FIX-064 — full_name/missing user_id broke onboarding save.
      await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          user_id: user.id,
          name: data.name,
          school_of_thought: data.schoolOfThought || null,
        }, { onConflict: 'user_id' })

      await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          learning_level: data.learningLevel.toLowerCase(),
          collections_of_interest: data.collections,
          onboarded: true,
          safety_agreed_at: new Date().toISOString(),
        })

      await AsyncStorage.setItem('onboarded', 'true')
      router.replace('/paywall')
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Derived labels based on selected language
  const isArabic = language === 'ar'
  const stepLabels = {
    step: isArabic ? `الخطوة ${currentStep} من ${TOTAL_STEPS}` : `Step ${currentStep} of ${TOTAL_STEPS}`,
    step1Title: isArabic ? 'مرحباً! لنقم بإعداد ملفك الشخصي' : "Welcome! Let's set up your profile",
    step1Subtitle: isArabic
      ? 'أخبرنا قليلاً عن نفسك لتخصيص تجربتك'
      : 'Tell us a bit about yourself to personalize your experience',
    namePlaceholder: isArabic ? 'أدخل اسمك' : 'Enter your name',
    nameLabel: isArabic ? 'اسمك *' : 'Your Name *',
    schoolLabel: isArabic ? 'المذهب الفقهي' : 'School of Thought (Madhab)',
    langLabel: isArabic ? 'اختر لغتك' : 'Choose your language',
    langHint: isArabic ? 'يمكنك تغيير هذا لاحقاً في الإعدادات' : 'You can change this later in Settings',
    next: isArabic ? 'التالي' : 'Next',
    back: isArabic ? 'رجوع' : 'Back',
    skip: isArabic ? 'تخطّ في الوقت الحالي' : 'Skip for now',
    complete: isArabic ? 'إتمام' : 'Complete',
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, isRTL && styles.contentRTL]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* Progress Dots */}
      <View style={styles.progressRow}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View key={i} style={styles.progressDotRow}>
            <View
              style={[
                styles.progressDot,
                { backgroundColor: colors.border },
                i + 1 < currentStep && { backgroundColor: colors.emeraldMid },
                i + 1 === currentStep && { backgroundColor: colors.goldMid },
              ]}
            >
              {i + 1 < currentStep && <Text style={[styles.progressCheck, { color: colors.white }]}>✓</Text>}
            </View>
            {i < TOTAL_STEPS - 1 && (
              <View style={[styles.progressLine, { backgroundColor: colors.border }, i + 1 < currentStep && { backgroundColor: colors.emeraldMid }]} />
            )}
          </View>
        ))}
      </View>
      <Text style={[styles.stepLabel, { color: colors.mutedText }, isRTL && styles.textRTL]}>{stepLabels.step}</Text>

      {/* Step 1: Language + Profile */}
      {currentStep === 1 && (
        <View style={styles.stepContent}>
          <Text style={[styles.stepTitle, { color: colors.bronzeText }, isRTL && styles.textRTL]}>{stepLabels.step1Title}</Text>
          <Text style={[styles.stepSubtitle, { color: colors.mutedText }, isRTL && styles.textRTL]}>{stepLabels.step1Subtitle}</Text>

          {/* Language Selection */}
          <Text style={[styles.label, { color: colors.bronzeText }, isRTL && styles.textRTL]}>{stepLabels.langLabel}</Text>
          <Text style={[styles.langHint, { color: colors.mutedText }, isRTL && styles.textRTL]}>{stepLabels.langHint}</Text>
          <View style={[styles.langRow, isRTL && styles.langRowRTL]}>
            {LANGUAGES.map((lang) => {
              const isSelected = language === lang.code
              return (
                <Pressable
                  key={lang.code}
                  style={[
                    styles.langOption,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    isSelected && { borderColor: colors.goldMid, backgroundColor: colors.goldMid + '15' },
                  ]}
                  onPress={() => setLanguage(lang.code)}
                >
                  <Text style={styles.langFlag}>{lang.flag}</Text>
                  <Text style={[styles.langLabel, { color: colors.bronzeText }, isSelected && { fontWeight: '700', color: colors.goldShadow }]}>
                    {lang.nativeLabel}
                  </Text>
                  {isSelected && <Text style={[styles.langCheck, { color: colors.goldMid }]}>✓</Text>}
                </Pressable>
              )
            })}
          </View>

          {/* Name */}
          <Text style={[styles.label, { color: colors.bronzeText }, isRTL && styles.textRTL]}>{stepLabels.nameLabel}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.bronzeText }, isRTL && styles.inputRTL]}
            placeholder={stepLabels.namePlaceholder}
            placeholderTextColor={colors.mutedText}
            value={data.name}
            onChangeText={(text) => updateData({ name: text })}
            maxLength={50}
            textAlign={isRTL ? 'right' : 'left'}
          />

          {/* School of Thought */}
          <Text style={[styles.label, { color: colors.bronzeText }, isRTL && styles.textRTL]}>{stepLabels.schoolLabel}</Text>
          <View style={styles.optionsList}>
            {SCHOOLS_OF_THOUGHT.map((school) => (
              <Pressable
                key={school}
                style={[
                  styles.optionItem,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  isRTL && styles.optionItemRTL,
                  data.schoolOfThought === school && { borderColor: colors.goldMid, backgroundColor: colors.goldMid + '10' },
                ]}
                onPress={() => updateData({ schoolOfThought: school })}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: colors.bronzeText },
                    data.schoolOfThought === school && styles.optionTextActive,
                  ]}
                >
                  {school}
                </Text>
                {data.schoolOfThought === school && (
                  <Text style={[styles.optionCheck, { color: colors.goldMid }]}>✓</Text>
                )}
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Step 2: Preferences */}
      {currentStep === 2 && (
        <View style={styles.stepContent}>
          <Text style={[styles.stepTitle, { color: colors.bronzeText }, isRTL && styles.textRTL]}>
            {isArabic ? 'خصّص تجربتك' : 'Customize your experience'}
          </Text>
          <Text style={[styles.stepSubtitle, { color: colors.mutedText }, isRTL && styles.textRTL]}>
            {isArabic
              ? 'اضبط تفضيلاتك لتخصيص رحلة تعلّمك'
              : 'Set your preferences to personalize your learning journey'}
          </Text>

          <Text style={[styles.label, { color: colors.bronzeText }, isRTL && styles.textRTL]}>
            {isArabic ? 'المجموعات المفضلة' : 'Collections of Interest'}
          </Text>
          <View style={styles.collectionsGrid}>
            {COLLECTIONS.map((c) => {
              const isSelected = data.collections.includes(c.id)
              return (
                <Pressable
                  key={c.id}
                  style={[
                    styles.collectionItem,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    isRTL && styles.collectionItemRTL,
                    isSelected && { borderColor: colors.goldMid, backgroundColor: colors.goldMid + '10' },
                  ]}
                  onPress={() => {
                    const updated = isSelected
                      ? data.collections.filter((x) => x !== c.id)
                      : [...data.collections, c.id]
                    updateData({ collections: updated })
                  }}
                >
                  <View style={[styles.checkbox, { borderColor: colors.border }, isSelected && { backgroundColor: colors.goldMid, borderColor: colors.goldMid }]}>
                    {isSelected && <Text style={[styles.checkboxCheck, { color: colors.white }]}>✓</Text>}
                  </View>
                  <View>
                    <Text style={[styles.collectionName, { color: colors.bronzeText }]}>{c.name}</Text>
                    <Text style={[styles.collectionCount, { color: colors.mutedText }]}>{c.count}</Text>
                  </View>
                </Pressable>
              )
            })}
          </View>

          <Text style={[styles.label, { color: colors.bronzeText }, isRTL && styles.textRTL]}>
            {isArabic ? 'مستوى التعلّم' : 'Learning Level'}
          </Text>
          <View style={[styles.levelToggle, { backgroundColor: colors.border + '50' }]}>
            {LEARNING_LEVELS.map((level) => (
              <Pressable
                key={level}
                style={[
                  styles.levelOption,
                  data.learningLevel === level && { backgroundColor: colors.goldMid },
                ]}
                onPress={() => updateData({ learningLevel: level })}
              >
                <Text
                  style={[
                    styles.levelText,
                    { color: colors.mutedText },
                    data.learningLevel === level && { color: colors.white },
                  ]}
                >
                  {level}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Step 3: Safety */}
      {currentStep === 3 && (
        <View style={styles.stepContent}>
          <View style={styles.shieldIcon}>
            <Text style={styles.shieldEmoji}>🛡️</Text>
          </View>
          <Text style={[styles.stepTitle, { color: colors.bronzeText }, isRTL && styles.textRTL]}>
            {isArabic ? 'إرشادات السلامة والمجتمع' : 'Safety & Community Guidelines'}
          </Text>
          <Text style={[styles.stepSubtitle, { color: colors.mutedText }, isRTL && styles.textRTL]}>
            {isArabic
              ? 'يحافظ تطبيق الأحاديث الصحيحة على أعلى معايير الدراسات الإسلامية واحترام المجتمع.'
              : 'Authentic Hadith maintains the highest standards of Islamic scholarship and community respect.'}
          </Text>

          <Card style={styles.safetyPoint}>
            <Text style={[styles.safetyTitle, { color: colors.bronzeText }, isRTL && styles.textRTL]}>
              {isArabic
                ? 'المساعد الذكي يُفلتر الاستفسارات غير المناسبة'
                : 'AI assistant filters inappropriate queries'}
            </Text>
            <Text style={[styles.safetyDesc, { color: colors.mutedText }, isRTL && styles.textRTL]}>
              {isArabic
                ? 'مساعدنا الذكي موجَّه للتركيز على الأحاديث الصحيحة والإحالة إلى العلماء المؤهلين للأحكام الشرعية.'
                : 'Our AI assistant is guided to focus on authentic hadith and to defer to qualified scholars for religious rulings.'}
            </Text>
          </Card>

          <Card style={styles.safetyPoint}>
            <Text style={[styles.safetyTitle, { color: colors.bronzeText }, isRTL && styles.textRTL]}>
              {isArabic ? 'مصادر علمية فقط' : 'Scholarly sources only'}
            </Text>
            <Text style={[styles.safetyDesc, { color: colors.mutedText }, isRTL && styles.textRTL]}>
              {isArabic
                ? 'جميع الأحاديث مصدرها مجموعات موثّقة من قبل علماء إسلاميين معترف بهم.'
                : 'All hadiths are sourced from authenticated collections by recognized Islamic scholars.'}
            </Text>
          </Card>

          <Pressable
            style={[styles.agreementRow, isRTL && styles.agreementRowRTL]}
            onPress={() => updateData({ safetyAgreed: !data.safetyAgreed })}
          >
            <View style={[styles.checkbox, { borderColor: colors.border }, data.safetyAgreed && { backgroundColor: colors.goldMid, borderColor: colors.goldMid }]}>
              {data.safetyAgreed && <Text style={[styles.checkboxCheck, { color: colors.white }]}>✓</Text>}
            </View>
            <Text style={[styles.agreementText, { color: colors.bronzeText }, isRTL && styles.textRTL]}>
              {isArabic
                ? 'أفهم وأوافق على إرشادات السلامة'
                : 'I understand and agree to the safety guidelines'}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.agreementRow, isRTL && styles.agreementRowRTL]}
            onPress={() => updateData({ termsAgreed: !data.termsAgreed })}
          >
            <View style={[styles.checkbox, { borderColor: colors.border }, data.termsAgreed && { backgroundColor: colors.goldMid, borderColor: colors.goldMid }]}>
              {data.termsAgreed && <Text style={[styles.checkboxCheck, { color: colors.white }]}>✓</Text>}
            </View>
            <Text style={[styles.agreementText, { color: colors.bronzeText }, isRTL && styles.textRTL]}>
              {isArabic ? 'أوافق على ' : 'I agree to the '}
              <Text
                style={[styles.linkText, { color: colors.goldMid }]}
                onPress={() => Linking.openURL('https://byredllc.com/terms')}
              >
                {isArabic ? 'شروط الخدمة' : 'Terms of Service'}
              </Text>
              {isArabic ? ' و' : ' and '}
              <Text
                style={[styles.linkText, { color: colors.goldMid }]}
                onPress={() => Linking.openURL('https://byredllc.com/privacy')}
              >
                {isArabic ? 'سياسة الخصوصية' : 'Privacy Policy'}
              </Text>
            </Text>
          </Pressable>
        </View>
      )}

      {/* Navigation */}
      <View style={[styles.navRow, { borderTopColor: colors.border }, isRTL && styles.navRowRTL]}>
        {currentStep === 1 ? (
          <View style={{ width: 80 }} />
        ) : (
          <Button
            title={stepLabels.back}
            variant="outline"
            size="medium"
            onPress={() => setCurrentStep((s) => s - 1)}
          />
        )}

        {currentStep < TOTAL_STEPS ? (
          <Button
            title={stepLabels.next}
            variant="primary"
            size="medium"
            onPress={() => setCurrentStep((s) => s + 1)}
            disabled={!canProceed()}
          />
        ) : (
          <Button
            title={stepLabels.complete}
            variant="primary"
            size="medium"
            onPress={handleComplete}
            disabled={!canProceed()}
            isLoading={loading}
          />
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.md, paddingTop: SPACING.xxl, paddingBottom: SPACING.xxl },
  contentRTL: { direction: 'rtl' },
  textRTL: { textAlign: 'right', writingDirection: 'rtl' },
  progressRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm },
  progressDotRow: { flexDirection: 'row', alignItems: 'center' },
  progressDot: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  progressCheck: { fontSize: 14, fontWeight: '700' },
  progressLine: { width: 40, height: 2 },
  stepLabel: { fontSize: FONT_SIZES.sm, textAlign: 'center', marginBottom: SPACING.xl },
  stepContent: { marginBottom: SPACING.xl },
  stepTitle: { fontSize: FONT_SIZES.xxl, fontWeight: '700', textAlign: 'center', marginBottom: SPACING.sm },
  stepSubtitle: { fontSize: FONT_SIZES.base, textAlign: 'center', marginBottom: SPACING.xl, lineHeight: 22 },
  label: { fontSize: FONT_SIZES.base, fontWeight: '600', marginBottom: SPACING.xs, marginTop: SPACING.lg },
  langHint: { fontSize: FONT_SIZES.sm, marginBottom: SPACING.sm },
  langRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  langRowRTL: { flexDirection: 'row-reverse' },
  langOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
  },
  langFlag: { fontSize: 20 },
  langLabel: { fontSize: FONT_SIZES.base, fontWeight: '500' },
  langCheck: { fontWeight: '700', marginLeft: SPACING.xs },
  input: {
    height: 48, borderRadius: BORDER_RADIUS.md,
    borderWidth: 1, paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZES.base,
  },
  inputRTL: { textAlign: 'right' },
  optionsList: { gap: SPACING.xs },
  optionItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: SPACING.md, borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  optionItemRTL: { flexDirection: 'row-reverse' },
  optionText: { fontSize: FONT_SIZES.base },
  optionTextActive: { fontWeight: '600' },
  optionCheck: { fontWeight: '700' },
  collectionsGrid: { gap: SPACING.sm },
  collectionItem: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    padding: SPACING.md, borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  collectionItemRTL: { flexDirection: 'row-reverse' },
  checkbox: {
    width: 20, height: 20, borderRadius: 4, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxCheck: { fontSize: 12, fontWeight: '700' },
  collectionName: { fontSize: FONT_SIZES.base, fontWeight: '500' },
  collectionCount: { fontSize: FONT_SIZES.xs },
  levelToggle: {
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS.lg, padding: 4,
  },
  levelOption: {
    flex: 1, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md, alignItems: 'center',
  },
  levelText: { fontSize: FONT_SIZES.base, fontWeight: '500' },
  shieldIcon: { alignItems: 'center', marginBottom: SPACING.md },
  shieldEmoji: { fontSize: 48 },
  safetyPoint: { marginBottom: SPACING.sm },
  safetyTitle: { fontSize: FONT_SIZES.base, fontWeight: '600', marginBottom: SPACING.xs },
  safetyDesc: { fontSize: FONT_SIZES.sm, lineHeight: 20 },
  agreementRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md,
    paddingVertical: SPACING.md,
  },
  agreementRowRTL: { flexDirection: 'row-reverse' },
  agreementText: { flex: 1, fontSize: FONT_SIZES.base, lineHeight: 22 },
  linkText: { textDecorationLine: 'underline' },
  navRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: SPACING.lg, borderTopWidth: 1,
  },
  navRowRTL: { flexDirection: 'row-reverse' },
  skipText: { fontSize: FONT_SIZES.base },
})
