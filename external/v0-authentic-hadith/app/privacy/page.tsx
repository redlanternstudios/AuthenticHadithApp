"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft, Shield } from "lucide-react"
import { IslamicPattern } from "@/components/islamic-pattern"

const LAST_UPDATED = "February 17, 2026"

export default function PrivacyPolicyPage() {
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
          <h1 className="text-lg font-semibold text-foreground">Privacy Policy</h1>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-card border-b border-border">
        <IslamicPattern />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#1B5E43] to-[#2D7A5B] flex items-center justify-center">
            <Shield className="w-8 h-8 text-[#E8C77D]" />
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold gold-text gold-text-heading mb-3 text-balance">
            Privacy Policy
          </h2>
          <p className="text-base text-foreground/70 leading-relaxed max-w-md mx-auto font-sans">
            Your privacy matters to us. Here is how we handle your data.
          </p>
          <p className="text-xs text-muted-foreground mt-3">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        <Section title="1. Information We Collect">
          <p>When you create an account on Authentic Hadith, we collect:</p>
          <ul className="list-disc pl-5 space-y-1.5 mt-2">
            <li><strong>Account information:</strong> Your email address and display name, provided during sign-up or via third-party authentication (Google, Apple).</li>
            <li><strong>Usage data:</strong> Reading history, saved hadiths, notes, quiz results, and learning progress -- stored to personalize your experience.</li>
            <li><strong>Device information:</strong> Device type, operating system, and app version for troubleshooting and analytics.</li>
            <li><strong>AI conversations:</strong> Messages you send to the AI assistant are processed to generate responses but are not permanently stored or used to train AI models.</li>
          </ul>
        </Section>

        <Section title="2. How We Use Your Information">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Provide, maintain, and improve the Authentic Hadith app and its features.</li>
            <li>Personalize your experience (daily hadith, reading progress, streaks, achievements).</li>
            <li>Process subscriptions and payments via Stripe (web) or Apple In-App Purchases (iOS).</li>
            <li>Send transactional emails (password resets, subscription confirmations) -- never marketing emails unless you opt in.</li>
            <li>Aggregate anonymous usage statistics to improve the app.</li>
          </ul>
        </Section>

        <Section title="3. Third-Party Services">
          <p>We use the following third-party services:</p>
          <ul className="list-disc pl-5 space-y-1.5 mt-2">
            <li><strong>Supabase:</strong> Authentication and database hosting.</li>
            <li><strong>Stripe:</strong> Web payment processing. We never see or store your full card number.</li>
            <li><strong>Apple / RevenueCat:</strong> iOS subscription management. Payments are handled entirely by Apple.</li>
            <li><strong>Groq:</strong> AI inference for the hadith assistant. Conversation content is not retained after the session ends.</li>
            <li><strong>Vercel:</strong> App hosting and serverless functions.</li>
          </ul>
          <p className="mt-2">Each third-party service has its own privacy policy. We encourage you to review them.</p>
        </Section>

        <Section title="4. Data Storage and Security">
          <p>
            Your data is stored in secure, encrypted databases hosted by Supabase (AWS infrastructure).
            We use Row-Level Security (RLS) policies so users can only access their own data.
            All communication between your device and our servers is encrypted via TLS/HTTPS.
          </p>
        </Section>

        <Section title="5. Your Rights">
          <p>You have the right to:</p>
          <ul className="list-disc pl-5 space-y-1.5 mt-2">
            <li><strong>Access</strong> your personal data at any time through your account settings.</li>
            <li><strong>Export</strong> your saved hadiths, notes, and reading progress.</li>
            <li><strong>Delete</strong> your account and all associated data by contacting us at <a href="mailto:support@authentichadith.app" className="gold-text hover:underline">support@authentichadith.app</a>.</li>
            <li><strong>Withdraw consent</strong> for data processing at any time by deleting your account.</li>
          </ul>
        </Section>

        <Section title="6. Children's Privacy">
          <p>
            Authentic Hadith does not knowingly collect personal information from children under 13.
            If you believe a child has provided us with personal data, please contact us and we will delete it promptly.
          </p>
        </Section>

        <Section title="7. Cookies and Tracking">
          <p>
            We use essential cookies for authentication and session management only.
            We do not use advertising cookies or third-party tracking pixels.
            No data is sold to advertisers or data brokers.
          </p>
        </Section>

        <Section title="8. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated
            &ldquo;Last updated&rdquo; date. Continued use of the app after changes constitutes acceptance of the revised policy.
          </p>
        </Section>

        <Section title="9. Contact Us">
          <p>
            If you have questions about this Privacy Policy or your data, contact us at:{" "}
            <a href="mailto:support@authentichadith.app" className="gold-text hover:underline">
              support@authentichadith.app
            </a>
          </p>
        </Section>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl premium-card p-6 sm:p-8">
      <h3 className="text-lg font-semibold text-foreground mb-3">{title}</h3>
      <div className="text-sm text-foreground/80 leading-relaxed space-y-2">{children}</div>
    </section>
  )
}
