export type Language = "english" | "arabic" | "both"

export const translations = {
  // Navigation & Common
  settings: { en: "Settings", ar: "الإعدادات" },
  home: { en: "Home", ar: "الرئيسية" },
  search: { en: "Search", ar: "بحث" },
  learn: { en: "Learn", ar: "تعلم" },
  saved: { en: "Saved", ar: "المحفوظة" },
  back: { en: "Back", ar: "رجوع" },
  continue: { en: "Continue", ar: "متابعة" },
  skip: { en: "Skip", ar: "تخطي" },
  save: { en: "Save", ar: "حفظ" },
  cancel: { en: "Cancel", ar: "إلغاء" },
  delete: { en: "Delete", ar: "حذف" },
  edit: { en: "Edit", ar: "تعديل" },
  done: { en: "Done", ar: "تم" },
  loading: { en: "Loading...", ar: "جار التحميل..." },
  
  // Settings Page
  appearance: { en: "Appearance", ar: "المظهر" },
  appearanceDesc: { en: "Dark mode and display settings", ar: "الوضع الليلي وإعدادات العرض" },
  language: { en: "Language", ar: "اللغة" },
  languageDesc: { en: "Change app language", ar: "تغيير لغة التطبيق" },
  languageChooseDesc: { en: "Choose how hadith text is displayed throughout the app.", ar: "اختر كيفية عرض نص الحديث في التطبيق." },
  notifications: { en: "Notifications", ar: "الإشعارات" },
  notificationsDesc: { en: "Manage your notifications", ar: "إدارة الإشعارات" },
  privacy: { en: "Privacy & Security", ar: "الخصوصية والأمان" },
  privacyDesc: { en: "Control your data", ar: "التحكم في بياناتك" },
  help: { en: "Help & Support", ar: "المساعدة والدعم" },
  helpDesc: { en: "Get help and contact us", ar: "الحصول على المساعدة والتواصل معنا" },
  subscription: { en: "Subscription", ar: "الاشتراك" },
  subscriptionDesc: { en: "Manage your plan", ar: "إدارة خطتك" },
  deleteAccount: { en: "Delete Account", ar: "حذف الحساب" },
  deleteAccountDesc: { en: "Permanently delete your account", ar: "حذف حسابك نهائياً" },
  
  // Language Options
  english: { en: "English", ar: "الإنجليزية" },
  englishPrimary: { en: "Primary", ar: "أساسي" },
  arabic: { en: "العربية", ar: "العربية" },
  arabicFirst: { en: "Arabic First", ar: "العربية أولاً" },
  both: { en: "Both", ar: "كلاهما" },
  sideBySide: { en: "Side by Side", ar: "جنباً إلى جنب" },
  languageNote: { en: "All hadiths include authentic Arabic text with verified English translations from scholarly sources.", ar: "جميع الأحاديث تتضمن النص العربي الأصيل مع ترجمات إنجليزية موثقة من مصادر علمية." },
  
  // Theme
  darkMode: { en: "Dark Mode", ar: "الوضع الليلي" },
  lightMode: { en: "Light Mode", ar: "الوضع النهاري" },
  systemTheme: { en: "System", ar: "النظام" },
  closeMenu: { en: "Close menu", ar: "إغلاق القائمة" },
  
  // Home Page
  welcome: { en: "Welcome", ar: "مرحباً" },
  dailyHadith: { en: "Daily Hadith", ar: "حديث اليوم" },
  continueReading: { en: "Continue Reading", ar: "متابعة القراءة" },
  explore: { en: "Explore", ar: "استكشاف" },
  collections: { en: "Collections", ar: "المجموعات" },
  viewAll: { en: "View All", ar: "عرض الكل" },
  
  // Hadith
  hadith: { en: "Hadith", ar: "حديث" },
  narrator: { en: "Narrator", ar: "الراوي" },
  source: { en: "Source", ar: "المصدر" },
  grade: { en: "Grade", ar: "الدرجة" },
  sahih: { en: "Sahih (Authentic)", ar: "صحيح" },
  hasan: { en: "Hasan (Good)", ar: "حسن" },
  daif: { en: "Da'if (Weak)", ar: "ضعيف" },
  shareHadith: { en: "Share Hadith", ar: "مشاركة الحديث" },
  saveHadith: { en: "Save Hadith", ar: "حفظ الحديث" },
  showArabic: { en: "Arabic", ar: "العربية" },
  showEnglish: { en: "English", ar: "الإنجليزية" },
  showBoth: { en: "Both", ar: "كلاهما" },
  translation: { en: "Translation", ar: "الترجمة" },
  
  // Collections
  sahihBukhari: { en: "Sahih Bukhari", ar: "صحيح البخاري" },
  sahihMuslim: { en: "Sahih Muslim", ar: "صحيح مسلم" },
  sunanTirmidhi: { en: "Sunan at-Tirmidhi", ar: "سنن الترمذي" },
  sunanAbuDawud: { en: "Sunan Abu Dawud", ar: "سنن أبي داود" },
  sunanNasai: { en: "Sunan an-Nasa'i", ar: "سنن النسائي" },
  sunanIbnMajah: { en: "Sunan Ibn Majah", ar: "سنن ابن ماجه" },
  
  // Search
  searchPlaceholder: { en: "Search hadiths...", ar: "ابحث في الأحاديث..." },
  searchResults: { en: "Search Results", ar: "نتائج البحث" },
  noResults: { en: "No results found", ar: "لم يتم العثور على نتائج" },
  
  // Learn
  learningPaths: { en: "Learning Paths", ar: "مسارات التعلم" },
  startLearning: { en: "Start Learning", ar: "ابدأ التعلم" },
  progress: { en: "Progress", ar: "التقدم" },
  complete: { en: "Complete", ar: "مكتمل" },
  
  // Auth
  signIn: { en: "Sign In", ar: "تسجيل الدخول" },
  signUp: { en: "Sign Up", ar: "إنشاء حساب" },
  signOut: { en: "Sign Out", ar: "تسجيل الخروج" },
  email: { en: "Email", ar: "البريد الإلكتروني" },
  password: { en: "Password", ar: "كلمة المرور" },
  forgotPassword: { en: "Forgot Password?", ar: "نسيت كلمة المرور؟" },
  
  // Profile
  profile: { en: "Profile", ar: "الملف الشخصي" },
  editProfile: { en: "Edit Profile", ar: "تعديل الملف الشخصي" },
  name: { en: "Name", ar: "الاسم" },
  
  // Subscription
  free: { en: "Free", ar: "مجاني" },
  premium: { en: "Premium", ar: "بريميوم" },
  lifetime: { en: "Lifetime", ar: "مدى الحياة" },
  upgradeToPremium: { en: "Upgrade to Premium", ar: "الترقية إلى بريميوم" },
  manageBilling: { en: "Manage Billing", ar: "إدارة الفواتير" },
  
  // Assistant
  assistant: { en: "AI Assistant", ar: "المساعد الذكي" },
  askQuestion: { en: "Ask a question...", ar: "اطرح سؤالاً..." },
  
  // Onboarding
  welcomeToApp: { en: "Welcome to Authentic Hadith", ar: "مرحباً بك في الحديث الصحيح" },
  selectLanguage: { en: "Select Your Language", ar: "اختر لغتك" },
  selectLanguageDesc: { en: "Choose your preferred language for the app interface and hadith display.", ar: "اختر لغتك المفضلة لواجهة التطبيق وعرض الأحاديث." },
  changeAnytime: { en: "You can change this anytime in Settings", ar: "يمكنك تغيير هذا في أي وقت من الإعدادات" },
  
  // Errors
  error: { en: "Error", ar: "خطأ" },
  somethingWentWrong: { en: "Something went wrong", ar: "حدث خطأ ما" },
  tryAgain: { en: "Try Again", ar: "حاول مجدداً" },
  
  // Bottom Navigation
  study: { en: "Study", ar: "الدراسة" },
  today: { en: "Today", ar: "اليوم" },
  chat: { en: "Chat", ar: "المحادثة" },
  myHadith: { en: "My Hadith", ar: "أحاديثي" },
  more: { en: "More", ar: "المزيد" },
  menu: { en: "Menu", ar: "القائمة" },
  
  // Mobile Drawer Groups
  daily: { en: "Daily", ar: "يومي" },
  personal: { en: "Personal", ar: "شخصي" },
  tools: { en: "Tools", ar: "أدوات" },
  account: { en: "Account", ar: "الحساب" },
  
  // Mobile Drawer Items
  topics: { en: "Topics", ar: "المواضيع" },
  sunnah: { en: "Sunnah", ar: "السنة" },
  stories: { en: "Stories", ar: "القصص" },
  reflections: { en: "Reflections", ar: "تأملات" },
  achievements: { en: "Achievements", ar: "الإنجازات" },
  quiz: { en: "Quiz", ar: "اختبار" },
  about: { en: "About", ar: "حول" },
  
  // Sidebar specific
  authenticHadith: { en: "Authentic Hadith", ar: "الحديث الصحيح" },
  verifiedSources: { en: "Learn from verified sources", ar: "تعلم من مصادر موثقة" },
  collapse: { en: "Collapse", ar: "طي" },
  expand: { en: "Expand", ar: "توسيع" },
  user: { en: "User", ar: "مستخدم" },
} as const

export type TranslationKey = keyof typeof translations

export function getTranslation(key: TranslationKey, language: Language): string {
  const translation = translations[key]
  if (!translation) return key
  
  // For "both" mode, we show English (user sees both in hadith content, but UI stays in English)
  // For "arabic" mode, show Arabic
  // For "english" mode, show English
  if (language === "arabic") {
    return translation.ar
  }
  return translation.en
}

// Helper to get text direction
export function getTextDirection(language: Language): "rtl" | "ltr" {
  return language === "arabic" ? "rtl" : "ltr"
}

// Helper to get font class for Arabic
export function getArabicFontClass(language: Language): string {
  return language === "arabic" ? "font-arabic" : ""
}
