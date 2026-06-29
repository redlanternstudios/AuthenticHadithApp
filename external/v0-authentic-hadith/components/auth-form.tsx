"use client"

import type React from "react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, Loader2, Mail, Lock, User } from "lucide-react"

type AuthMode = "signin" | "signup" | "forgot"

const OAUTH_ENABLED = process.env.NEXT_PUBLIC_OAUTH_ENABLED === "true"

export function AuthForm() {
  const [mode, setMode] = useState<AuthMode>("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawRedirect = searchParams.get("redirect")
  const redirectTo = rawRedirect ? decodeURIComponent(rawRedirect) : null

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    // Sign in successful — always go to home.
    // Onboarding is first-time only, triggered from the sign-up flow.
    // Any user who can sign in has already onboarded (or is a team account).
    if (data?.user) {
      document.cookie = "ah_onboarded=1; path=/; max-age=31536000; SameSite=Lax"
      document.cookie = "ah_safety_agreed=1; path=/; max-age=31536000; SameSite=Lax"
      router.push(redirectTo || "/home")
    } else {
      router.push(redirectTo || "/home")
    }
    router.refresh()
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`,
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // If email confirmation is disabled in Supabase, the user gets a session immediately
    if (data?.session) {
      // Pass the redirect through onboarding so user ends up at pricing after
      const onboardingUrl = redirectTo
        ? `/onboarding?redirect=${encodeURIComponent(redirectTo)}`
        : "/onboarding"
      router.push(onboardingUrl)
      router.refresh()
      return
    }

    // If email confirmation is enabled but the user already exists (identities is empty),
    // Supabase returns a fake success -- tell the user to sign in instead
    if (data?.user?.identities?.length === 0) {
      setError("An account with this email already exists. Please sign in instead.")
      setLoading(false)
      return
    }

    // Email confirmation is enabled -- session is null, user needs to confirm
    setMessage("Account created! Please check your email (including spam/junk folder) to confirm your account, then sign in.")
    setLoading(false)
  }

  const handleOAuthSignIn = async (provider: "google" | "apple") => {
    setLoading(true)
    setError(null)

    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
            `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        if (error.message.includes("provider is not enabled") || error.message.includes("unsupported")) {
          setError(`Sign in with ${provider === "google" ? "Google" : "Apple"} is not available yet. Please use email and password.`)
        } else {
          setError(error.message)
        }
        setLoading(false)
      }
    } catch {
      setError(`Sign in with ${provider === "google" ? "Google" : "Apple"} is not available yet. Please use email and password.`)
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage("Password reset link sent to your email.")
    }
    setLoading(false)
  }

  return (
    <div className="w-full">
      {mode !== "forgot" && (
        <div className="flex mb-8 relative">
          <button
            type="button"
            onClick={() => {
              setMode("signin")
              setError(null)
              setMessage(null)
            }}
            className={`flex-1 pb-3 text-sm font-semibold tracking-[0.1em] uppercase transition-colors ${
              mode === "signin" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup")
              setError(null)
              setMessage(null)
            }}
            className={`flex-1 pb-3 text-sm font-semibold tracking-[0.1em] uppercase transition-colors ${
              mode === "signup" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign Up
          </button>
          {/* Gold indicator line */}
          <div
            className="absolute bottom-0 h-[3px] gold-tab-indicator rounded-full transition-all duration-300"
            style={{
              width: "50%",
              left: mode === "signin" ? "0%" : "50%",
            }}
          />
        </div>
      )}

      {/* Forgot Password Header */}
      {mode === "forgot" && (
        <div className="text-center mb-6">
          <h2 className="text-lg font-semibold text-foreground tracking-wide">Reset Password</h2>
          <p className="text-sm text-muted-foreground mt-1">Enter your email to receive a reset link</p>
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={mode === "signin" ? handleSignIn : mode === "signup" ? handleSignUp : handleForgotPassword}
        className="space-y-5"
      >
        {/* Full Name - only for signup */}
        {mode === "signup" && (
          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-medium text-foreground">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="pl-10 h-12 premium-input rounded-md"
                required
              />
            </div>
          </div>
        )}

        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12 premium-input rounded-md"
              required
            />
          </div>
        </div>

        {/* Password - not for forgot */}
        {mode !== "forgot" && (
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-12 premium-input rounded-md"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Forgot Password Link */}
        {mode === "signin" && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setMode("forgot")
                setError(null)
                setMessage(null)
              }}
              className="text-sm gold-text hover:opacity-80 transition-opacity font-medium"
            >
              Forgot Password?
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Success Message */}
        {message && (
          <div className="p-3 rounded-md bg-[#1B5E43]/10 border border-[#1B5E43]/20 text-[#1B5E43] text-sm">
            {message}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 gold-button rounded-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              {mode === "signin" && "SIGN IN"}
              {mode === "signup" && "CREATE ACCOUNT"}
              {mode === "forgot" && "SEND RESET LINK"}
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      {mode !== "forgot" && OAUTH_ENABLED && (
        <div className="relative my-8">
          <div className="gold-divider" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-card px-4 text-xs text-muted-foreground tracking-wider uppercase">
              or continue with
            </span>
          </div>
        </div>
      )}

      {/* Social Login Buttons -- only shown when OAuth providers are configured */}
      {mode !== "forgot" && OAUTH_ENABLED && (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleOAuthSignIn("google")}
            disabled={loading}
            className="h-11 flex items-center justify-center gap-2 rounded-md border border-border bg-card hover:bg-muted transition-colors text-sm font-medium text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </button>
          <button
            type="button"
            onClick={() => handleOAuthSignIn("apple")}
            disabled={loading}
            className="h-11 flex items-center justify-center gap-2 rounded-md bg-black hover:bg-black/90 transition-colors text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            Apple
          </button>
        </div>
      )}

      {/* Back to Sign In for forgot mode */}
      {mode === "forgot" && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setMode("signin")
              setError(null)
              setMessage(null)
            }}
            className="text-sm gold-text hover:opacity-80 transition-opacity font-medium"
          >
            Back to Sign In
          </button>
        </div>
      )}
    </div>
  )
}
