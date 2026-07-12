"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Loader2, ArrowLeft, ArrowRight } from "lucide-react"
import { ProgressIndicator } from "@/components/onboarding/progress-indicator"
import { StepLanguage } from "@/components/onboarding/step-language"
import { StepProfile } from "@/components/onboarding/step-profile"
import { StepPreferences } from "@/components/onboarding/step-preferences"
import { StepSafety } from "@/components/onboarding/step-safety"
import { StepPlan } from "@/components/onboarding/step-plan"
import { SuccessAnimation } from "@/components/onboarding/success-animation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const TOTAL_STEPS = 5

interface OnboardingData {
  // Step 1
  name: string
  avatarUrl: string | null
  avatarFile: File | null
  schoolOfThought: string
  // Step 2
  language: string
  collections: string[]
  learningLevel: string
  // Step 3
  safetyAgreed: boolean
  termsAgreed: boolean
  // Step 4
  selectedPlanId: string | null
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen marble-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C5A059]" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  )
}

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const postOnboardingRedirect = searchParams.get("redirect")
  const supabase = getSupabaseBrowserClient()

  // Guard: if the user is already onboarded, send them home.
  // Prevents back-swipe in the iOS WebView from re-triggering onboarding.
  useEffect(() => {
    async function checkAlreadyOnboarded() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return // Not logged in — let them go through onboarding (sign-up flow)
      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("onboarded")
        .eq("user_id", user.id)
        .single()
      if (prefs?.onboarded) {
        router.replace(postOnboardingRedirect ? decodeURIComponent(postOnboardingRedirect) : "/home")
      }
    }
    checkAlreadyOnboarded()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("left")

  const [data, setData] = useState<OnboardingData>({
    name: "",
    avatarUrl: null,
    avatarFile: null,
    schoolOfThought: "",
    language: "english",
    collections: [],
    learningLevel: "Intermediate",
    safetyAgreed: false,
    termsAgreed: false,
    selectedPlanId: null,
  })

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }))
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!data.language // Language selection (always true since default exists)
      case 2:
        return data.name.trim().length >= 2 && /^[a-zA-Z\s\-']+$/.test(data.name)
      case 3:
        return true // Preferences - all optional
      case 4:
        return data.safetyAgreed && data.termsAgreed
      case 5:
        return true // Free plan (null) or a paid plan
      default:
        return false
    }
  }

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setSlideDirection("left")
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setSlideDirection("right")
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSkip = () => {
    // Skip to safety step -- safety agreement is required before entering the app
    setSlideDirection("left")
    setCurrentStep(4)
  }

  const handleComplete = async () => {
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Not authenticated")
      }

      // Upload avatar if provided
      let avatarPublicUrl: string | null = null
      if (data.avatarFile) {
        const fileExt = data.avatarFile.name.split(".").pop()
        const filePath = `${user.id}/avatar.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, data.avatarFile, { upsert: true })

        if (!uploadError) {
          const {
            data: { publicUrl },
          } = supabase.storage.from("avatars").getPublicUrl(filePath)
          avatarPublicUrl = publicUrl
        }
      }

      // Insert or update profile
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (existingProfile) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            name: data.name,
            avatar_url: avatarPublicUrl,
            school_of_thought: data.schoolOfThought || null,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)

        if (profileError) {
          console.error("[onboarding] profile update failed:", profileError)
        }
      } else {
        const { error: profileError } = await supabase.from("profiles").insert({
          user_id: user.id,
          name: data.name,
          avatar_url: avatarPublicUrl,
          school_of_thought: data.schoolOfThought || null,
        })

        if (profileError) {
          console.error("[onboarding] profile insert failed:", profileError)
        }
      }

      // Insert or update preferences
      const { data: existingPrefs } = await supabase
        .from("user_preferences")
        .select("id")
        .eq("user_id", user.id)
        .single()

      const prefsPayload = {
        user_id: user.id,
        language: data.language,
        collections_of_interest: data.collections,
        learning_level: data.learningLevel.toLowerCase(),
        safety_agreed_at: new Date().toISOString(),
        onboarded: true,
      }

      const { error: prefsError } = existingPrefs
        ? await supabase
            .from("user_preferences")
            .update(prefsPayload)
            .eq("user_id", user.id)
        : await supabase.from("user_preferences").insert(prefsPayload)

      // Fail loudly: this write carries `onboarded: true`, which the route guard
      // reads to decide whether to show onboarding. If it silently fails we'd
      // route the user to success now, then bounce them back into onboarding on
      // next launch — the reported completion loop (BUG 02). Don't mark complete
      // unless the flag actually persisted; surface the error and let them retry.
      if (prefsError) {
        throw new Error(`Could not save your preferences: ${prefsError.message}`)
      }

      // Set onboarded + safety agreed cookies
      document.cookie = "ah_onboarded=1; path=/; max-age=31536000; SameSite=Lax"
      document.cookie = "ah_safety_agreed=1; path=/; max-age=31536000; SameSite=Lax"

      // If the user was redirected from pricing (e.g. after sign-up), send them back there
      if (postOnboardingRedirect) {
        const destination = postOnboardingRedirect.startsWith("%") 
          ? decodeURIComponent(postOnboardingRedirect) 
          : postOnboardingRedirect
        window.location.href = destination
        return
      }

      // If user selected a paid plan during onboarding, handle checkout
      if (data.selectedPlanId) {
        const { isNativeApp, showNativePaywall } = await import("@/lib/native-bridge")
        if (isNativeApp()) {
          // In native app, show RevenueCat paywall
          const success = await showNativePaywall()
          if (success) {
            setShowSuccess(true)
            return
          }
          // If cancelled, still show success and go to home
        } else {
          // On web, redirect to pricing page with selected plan to show Stripe checkout
          window.location.href = `/pricing?plan=${data.selectedPlanId}`
          return
        }
      }

      // Show success animation (free plan or checkout failed gracefully)
      setShowSuccess(true)
    } catch (error) {
      console.error("Onboarding error:", error)
      alert("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  const handleSuccessComplete = () => {
    router.push(postOnboardingRedirect ? decodeURIComponent(postOnboardingRedirect) : "/home")
  }

  return (
    <div className="min-h-screen marble-bg flex flex-col items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 geometric-shimmer pointer-events-none">
        <svg className="w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="onboardingPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <path
                d="M10 0L20 10L10 20L0 10Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.3"
                className="text-[#C5A059]"
              />
              <circle
                cx="10"
                cy="10"
                r="2"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.2"
                className="text-[#1B5E43]"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#onboardingPattern)" />
        </svg>
      </div>

      {/* Success Animation Overlay */}
      {showSuccess && <SuccessAnimation onComplete={handleSuccessComplete} />}

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-[640px] flex flex-col">
        {/* Logo */}
        <div className="flex justify-center mb-6 mt-4">
          <div className="relative w-20 h-20">
            <Image
              src="/images/gemini-generated-image-xw5svjxw5svjxw5s.jpeg"
              alt="Authentic Hadith Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-6">
          <ProgressIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />
        </div>

        {/* Content Card */}
        <div className="gold-border rounded-xl p-6 sm:p-8 premium-card overflow-hidden">
          {/* Step Content with Slide Animation */}
          <div
            key={currentStep}
            className={cn(
              "transition-all duration-300",
              slideDirection === "left" ? "animate-slide-left" : "animate-slide-right",
            )}
          >
            {currentStep === 1 && (
              <StepLanguage
                language={data.language}
                onUpdate={(language) => updateData({ language })}
              />
            )}
            {currentStep === 2 && (
              <StepProfile
                data={{
                  name: data.name,
                  avatarUrl: data.avatarUrl,
                  avatarFile: data.avatarFile,
                  schoolOfThought: data.schoolOfThought,
                }}
                onUpdate={updateData}
              />
            )}
            {currentStep === 3 && (
              <StepPreferences
                data={{
                  language: data.language,
                  collections: data.collections,
                  learningLevel: data.learningLevel,
                }}
                onUpdate={updateData}
              />
            )}
            {currentStep === 4 && (
              <StepSafety
                data={{
                  safetyAgreed: data.safetyAgreed,
                  termsAgreed: data.termsAgreed,
                }}
                onUpdate={updateData}
              />
            )}
            {currentStep === 5 && (
              <StepPlan
                selectedPlanId={data.selectedPlanId}
                onSelect={(planId) => updateData({ selectedPlanId: planId })}
              />
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            {/* Skip Link (Step 1 or 2 only) */}
            {currentStep <= 2 ? (
              <button
                type="button"
                onClick={handleSkip}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-[#C5A059] transition-colors text-sm font-medium"
              >
                Skip to essentials
              </button>
            ) : (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#C5A059] text-[#C5A059] hover:bg-muted transition-colors text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}

            {/* Next / Complete Button */}
            {currentStep < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed()}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all",
                  canProceed() ? "gold-button" : "bg-[#e5e7eb] text-muted-foreground cursor-not-allowed",
                )}
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleComplete}
                disabled={!canProceed() || loading}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all",
                  canProceed() && !loading ? "gold-button" : "bg-[#e5e7eb] text-muted-foreground cursor-not-allowed",
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Completing...
                  </>
                ) : (
                  "Complete"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
