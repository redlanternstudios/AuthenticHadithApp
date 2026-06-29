"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft, Mail, MessageCircle, Clock, Shield } from "lucide-react"
import { IslamicPattern } from "@/components/islamic-pattern"

export default function ContactPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-11 h-11 rounded-full bg-background border border-border flex items-center justify-center hover:border-[#C5A059] transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Contact Us</h1>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-card border-b border-border">
        <IslamicPattern />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#1B5E43] to-[#2D7A5B] flex items-center justify-center">
            <Mail className="w-8 h-8 text-[#E8C77D]" />
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold gold-text gold-text-heading mb-3 text-balance">
            Get in Touch
          </h2>
          <p className="text-base text-foreground/70 leading-relaxed max-w-md mx-auto font-sans">
            Have a question, suggestion, or need help? We would love to hear from you.
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Primary Contact */}
        <div className="rounded-xl gold-border premium-card p-6 sm:p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#C5A059]/10 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-[#C5A059]" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground font-sans">Email Us</h3>
              <p className="text-sm text-muted-foreground">Our primary support channel</p>
            </div>
          </div>
          <a
            href="mailto:support@authentichadith.app"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#1B5E43] to-[#2D7A5B] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            <Mail className="w-4 h-4" />
            support@authentichadith.app
          </a>
        </div>

        {/* Support Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="w-10 h-10 rounded-lg bg-[#1b5e43]/10 dark:bg-[#4a9973]/15 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-[#1b5e43] dark:text-[#6bb895]" />
            </div>
            <h4 className="font-semibold text-foreground text-sm mb-1 font-sans">Response Time</h4>
            <p className="text-xs text-muted-foreground leading-relaxed font-sans">
              We typically respond within 24-48 hours on business days.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="w-10 h-10 rounded-lg bg-[#1b5e43]/10 dark:bg-[#4a9973]/15 flex items-center justify-center mb-3">
              <MessageCircle className="w-5 h-5 text-[#1b5e43] dark:text-[#6bb895]" />
            </div>
            <h4 className="font-semibold text-foreground text-sm mb-1 font-sans">What We Help With</h4>
            <p className="text-xs text-muted-foreground leading-relaxed font-sans">
              Account issues, billing questions, bug reports, feature requests, and general feedback.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="w-10 h-10 rounded-lg bg-[#1b5e43]/10 dark:bg-[#4a9973]/15 flex items-center justify-center mb-3">
              <Shield className="w-5 h-5 text-[#1b5e43] dark:text-[#6bb895]" />
            </div>
            <h4 className="font-semibold text-foreground text-sm mb-1 font-sans">Privacy</h4>
            <p className="text-xs text-muted-foreground leading-relaxed font-sans">
              Your information is handled securely. We never share your data with third parties.
            </p>
          </div>
        </div>

        {/* Helpful Tips */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold text-foreground mb-4 font-sans">When contacting us, please include:</h3>
          <div className="space-y-3">
            {[
              "Your account email address",
              "A clear description of your issue or question",
              "Steps to reproduce (for bug reports)",
              "Screenshots if applicable",
              "Your device and app version",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#C5A059] mt-2 shrink-0" />
                <p className="text-sm text-foreground/90 leading-relaxed font-sans">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Company Info */}
        <div className="mt-8 pt-8 border-t border-border text-center">
          <p className="text-sm font-semibold text-foreground font-sans">byRed</p>
          <p className="text-xs text-muted-foreground mt-1 font-sans">
            Makers of Authentic Hadith
          </p>
        </div>
      </main>
    </div>
  )
}
