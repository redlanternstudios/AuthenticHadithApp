"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft, FileText } from "lucide-react"
import { IslamicPattern } from "@/components/islamic-pattern"

const LAST_UPDATED = "February 17, 2026"

export default function TermsOfServicePage() {
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
          <h1 className="text-lg font-semibold text-foreground">Terms of Service</h1>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-card border-b border-border">
        <IslamicPattern />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#1B5E43] to-[#2D7A5B] flex items-center justify-center">
            <FileText className="w-8 h-8 text-[#E8C77D]" />
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold gold-text gold-text-heading mb-3 text-balance">
            Terms of Service
          </h2>
          <p className="text-base text-foreground/70 leading-relaxed max-w-md mx-auto font-sans">
            Please read these terms carefully before using Authentic Hadith.
          </p>
          <p className="text-xs text-muted-foreground mt-3">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        <Section title="1. Acceptance of Terms">
          <p>
            By accessing or using the Authentic Hadith application ("the App"), you agree to be bound by these
            Terms of Service. If you do not agree, please do not use the App.
          </p>
        </Section>

        <Section title="2. Description of Service">
          <p>
            Authentic Hadith is an educational application that provides access to authenticated hadith collections,
            AI-powered explanations, learning paths, quizzes, and related Islamic educational content. The App is
            available as a web application and an iOS application.
          </p>
        </Section>

        <Section title="3. User Accounts">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>You must provide accurate and complete information when creating an account.</li>
            <li>You are responsible for maintaining the security of your account credentials.</li>
            <li>You must be at least 13 years of age to create an account.</li>
            <li>One person may not maintain more than one account.</li>
            <li>We reserve the right to suspend or terminate accounts that violate these terms.</li>
          </ul>
        </Section>

        <Section title="4. Subscription Plans and Payments">
          <p><strong>Explorer (Free):</strong> Browse all collections, basic search, 3 AI explanations per day, up to 40 saved hadiths, and 1 quiz per day at no cost.</p>
          <p className="mt-2"><strong>Pro (Paid):</strong> Unlimited AI explanations, advanced search, all learning paths, unlimited saves, and unlimited quizzes. Available as monthly ($9.99/mo), annual ($49.99/yr), or lifetime ($99.99 one-time) plans.</p>
          <ul className="list-disc pl-5 space-y-1.5 mt-3">
            <li>Web subscriptions are processed through Stripe. iOS subscriptions are processed through Apple In-App Purchases.</li>
            <li>Subscriptions auto-renew unless cancelled at least 24 hours before the end of the current billing period.</li>
            <li>You can cancel your subscription at any time through your account settings (web) or through the App Store (iOS).</li>
            <li>Refunds for web purchases are handled on a case-by-case basis. iOS refunds are handled by Apple per their refund policy.</li>
            <li>Prices may change with reasonable notice. Existing subscribers will be notified before any price increase takes effect on their next billing cycle.</li>
          </ul>
        </Section>

        <Section title="5. AI Assistant Disclaimer">
          <div className="rounded-lg bg-[#C5A059]/5 border border-[#C5A059]/20 p-4">
            <p className="font-medium text-foreground mb-2">Important:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>The AI assistant is an educational tool only. It does not issue fatwas or religious rulings.</li>
              <li>AI-generated explanations may contain errors. Always verify information with qualified Islamic scholars.</li>
              <li>The AI does not determine what is halal or haram for your specific situation.</li>
              <li>AI responses should not replace consultation with knowledgeable scholars for matters of religious practice.</li>
            </ul>
          </div>
        </Section>

        <Section title="6. Acceptable Use">
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1.5 mt-2">
            <li>Use the App for any unlawful purpose or in violation of any applicable laws.</li>
            <li>Attempt to reverse-engineer, decompile, or extract source code from the App.</li>
            <li>Scrape, crawl, or use automated means to access the App or its content.</li>
            <li>Share your account credentials with others or allow unauthorized access.</li>
            <li>Upload or transmit malicious content, spam, or harmful material.</li>
            <li>Misrepresent AI-generated content as scholarly rulings or fatwas.</li>
          </ul>
        </Section>

        <Section title="7. Intellectual Property">
          <p>
            The hadith texts are sourced from established public-domain Islamic scholarly traditions.
            The App's design, code, AI models, learning content, and original explanatory material are the
            intellectual property of Authentic Hadith and are protected by applicable copyright laws.
            You may share individual hadiths for personal, non-commercial, educational purposes with proper attribution.
          </p>
        </Section>

        <Section title="8. Content Accuracy">
          <p>
            We strive to present authentic, properly graded hadiths from recognized collections. However:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 mt-2">
            <li>We do not guarantee the accuracy or completeness of all translations.</li>
            <li>Grading information is provided for reference and may differ between scholars.</li>
            <li>Users should consult qualified scholars for definitive rulings based on hadith content.</li>
          </ul>
        </Section>

        <Section title="9. Limitation of Liability">
          <p>
            Authentic Hadith is provided "as is" without warranties of any kind, either express or implied.
            We are not liable for any damages arising from your use of the App, including but not limited to:
            decisions made based on AI-generated content, service interruptions, or data loss.
            Our total liability shall not exceed the amount you paid for the App in the 12 months preceding the claim.
          </p>
        </Section>

        <Section title="10. Changes to Terms">
          <p>
            We may modify these Terms at any time. Material changes will be communicated via the App or email.
            Continued use after changes constitutes acceptance. If you disagree with updated terms, you should stop using the App
            and contact us to delete your account.
          </p>
        </Section>

        <Section title="11. Governing Law">
          <p>
            These Terms shall be governed by and construed in accordance with applicable laws.
            Any disputes shall be resolved through good-faith negotiation before pursuing formal legal remedies.
          </p>
        </Section>

        <Section title="12. Contact">
          <p>
            Questions about these Terms? Contact us at:{" "}
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
