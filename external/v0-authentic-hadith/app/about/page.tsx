"use client"

import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  BookOpen,
  Shield,
  Bot,
  AlertTriangle,
  Info,
  Heart,
  CheckCircle2,
  XCircle,
  Mail,
  ExternalLink,
} from "lucide-react"
import { IslamicPattern } from "@/components/islamic-pattern"

const collections = [
  "Sahih al-Bukhari",
  "Sahih Muslim",
]

const aiDoes = [
  "Provides summaries and explanations for educational purposes",
  "Offers context and historical background",
  "Helps you discover related hadith and topics",
  "Answers general questions about Islamic concepts",
]

const aiDoesNot = [
  "Issue fatwas (religious rulings)",
  "Determine what is halal or haram for your specific situation",
  "Replace consultation with qualified Islamic scholars",
  "Make claims without citing authentic sources",
]

function SectionDivider() {
  return <div className="gold-divider my-10 sm:my-12 mx-auto max-w-xs" />
}

export default function AboutPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm md:block hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-11 h-11 rounded-full bg-background border border-border flex items-center justify-center hover:border-[#C5A059] transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">About</h1>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-card border-b border-border">
        <IslamicPattern />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold gold-text gold-text-heading mb-4">
            Authentic Hadith
          </h1>
          <p className="text-base sm:text-lg text-foreground leading-relaxed max-w-2xl mx-auto font-sans">
            A guided knowledge companion rooted in authentic Islamic sources.
          </p>
          <div className="mt-6 border-l-4 border-[#C5A059] pl-4 text-left max-w-xl mx-auto">
            <p className="text-sm sm:text-base text-foreground/70 leading-relaxed font-sans">
              Authentic Hadith makes verified prophetic narrations accessible,
              understandable, and thoughtfully presented. Our mission is to help
              Muslims grow in knowledge and character through reliable sources,
              structured learning, and responsible technology.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* Our Mission */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-[#1b5e43]/10 dark:bg-[#4a9973]/15 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 text-[#1b5e43] dark:text-[#6bb895]" />
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#1b5e43] dark:text-[#6bb895]">
              Our Mission
            </h2>
          </div>
          <p className="text-foreground/70 leading-relaxed mb-5 font-sans">
            We combine classical Islamic scholarship with modern technology
            in a way that preserves authenticity, clarity, and adab.
          </p>
          <div className="space-y-3">
            {[
              "Make authentic hadith accessible to all Muslims",
              "Preserve citation integrity and scholarly grading",
              "Support structured growth in Islamic knowledge",
              "Use technology responsibly with clear boundaries",
              "Never issue religious rulings or replace qualified scholars",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#C5A059] mt-2 shrink-0" />
                <p className="text-sm sm:text-base text-foreground/90 leading-relaxed font-sans">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <SectionDivider />

        {/* Sources & Authenticity */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-[#1b5e43]/10 dark:bg-[#4a9973]/15 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-[#1b5e43] dark:text-[#6bb895]" />
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#1b5e43] dark:text-[#6bb895]">
              Sources & Authenticity
            </h2>
          </div>

          <h3 className="text-base font-semibold text-foreground mb-3 font-sans">Collections Included</h3>
          <p className="text-sm text-muted-foreground mb-4 font-sans">
            All 14,444 hadiths are drawn exclusively from Al-Sahihayn — the two most rigorously authenticated collections in Islam:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
            {collections.map((c) => (
              <div
                key={c}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
              >
                <BookOpen className="w-4 h-4 text-[#C5A059] shrink-0" />
                <span className="text-sm font-medium text-foreground font-sans">{c}</span>
              </div>
            ))}
          </div>

          <h3 className="text-base font-semibold text-foreground mb-3 font-sans">Source Integrity</h3>
          <div className="space-y-3">
            {[
              "All narrations are presented with their original source references",
              "Authenticity gradings are displayed according to the cited collection or scholar",
              "We do not alter or modify canonical Arabic or English text",
              "Commentary and AI explanations are clearly marked and separated from primary sources",
              "Narrator chains (isnad) are preserved where available",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-[#1b5e43] dark:text-[#6bb895] mt-0.5 shrink-0" />
                <p className="text-sm text-foreground/90 leading-relaxed font-sans">{item}</p>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { label: "Hadith", value: "14,444" },
              { label: "Collections", value: "Al-Sahihayn" },
              { label: "Grading", value: "Sahih" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg border border-border bg-card p-3 text-center">
                <p className="text-lg sm:text-xl font-semibold gold-text font-serif">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1 font-sans">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <SectionDivider />

        {/* Responsible AI Use */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-[#1b5e43]/10 dark:bg-[#4a9973]/15 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-[#1b5e43] dark:text-[#6bb895]" />
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#1b5e43] dark:text-[#6bb895]">
              How We Use AI
            </h2>
          </div>

          <div className="border-l-4 border-[#C5A059] pl-4 mb-6">
            <p className="text-sm sm:text-base font-semibold text-foreground font-sans">
              AI as Educational Tool, Not Scholar
            </p>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed font-sans">
              The AI assistant in Authentic Hadith is designed to help you
              understand and explore hadith, not to replace qualified scholars
              or issue religious rulings.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* What AI Does */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-[#1b5e43] dark:text-[#6bb895]" />
                <h3 className="text-sm font-semibold text-foreground font-sans">What AI Does</h3>
              </div>
              <div className="space-y-2.5">
                {aiDoes.map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#1b5e43] dark:bg-[#6bb895] mt-1.5 shrink-0" />
                    <p className="text-sm text-foreground/90 leading-relaxed font-sans">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* What AI Does NOT Do */}
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="w-5 h-5 text-destructive" />
                <h3 className="text-sm font-semibold text-foreground font-sans">What AI Does NOT Do</h3>
              </div>
              <div className="space-y-2.5">
                {aiDoesNot.map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 shrink-0" />
                    <p className="text-sm text-foreground/90 leading-relaxed font-sans">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mt-4 leading-relaxed font-sans">
            All AI responses prioritize citation from primary sources.
            For personal rulings or complex jurisprudential matters,
            please consult qualified scholars in your community.
          </p>
        </section>

        <SectionDivider />

        {/* Sensitive Topics */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-[#C5A059]/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-[#C5A059]" />
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#1b5e43] dark:text-[#6bb895]">
              Handling Sensitive Topics
            </h2>
          </div>
          <p className="text-foreground/70 leading-relaxed mb-5 font-sans text-sm sm:text-base">
            Islamic knowledge includes topics that require careful context,
            scholarly understanding, and personal guidance.
          </p>
          <div className="space-y-3">
            {[
              "Prioritize authentic sources with full context",
              "Recognize that brief explanations cannot replace deep study",
              "Consult qualified scholars for personal application",
              "Understand that historical context matters",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#C5A059] mt-2 shrink-0" />
                <p className="text-sm sm:text-base text-foreground/90 leading-relaxed font-sans">{item}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-4 leading-relaxed font-sans">
            The app prioritizes clarity, authenticity, and responsible
            presentation. We encourage users to seek qualified scholars
            for personal rulings, medical questions, or complex
            jurisprudential matters.
          </p>
        </section>

        <SectionDivider />

        {/* Transparency & Version Info */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-[#1b5e43]/10 dark:bg-[#4a9973]/15 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5 text-[#1b5e43] dark:text-[#6bb895]" />
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#1b5e43] dark:text-[#6bb895]">
              Transparency & Version
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Version Info */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3 font-sans">Version Information</h3>
              <div className="space-y-2 text-sm font-sans">
                {[
                  { label: "App Version", value: "1.0.0" },
                  { label: "Database", value: "14,444 hadith" },
                  { label: "Last Update", value: "Jun 2026" },
                  { label: "Collections", value: "Al-Sahihayn" },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="text-foreground font-medium">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3 font-sans">Platform</h3>
              <div className="space-y-2 text-sm font-sans">
                {[
                  { label: "Web", value: "Next.js, Vercel" },
                  { label: "Mobile", value: "React Native, Expo" },
                  { label: "Database", value: "Supabase + RLS" },
                  { label: "AI", value: "Groq Llama 3.3 70B" },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="text-foreground font-medium">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="mt-4 rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 font-sans">Contact & Support</h3>
            <div className="space-y-2">
              <a
                href="mailto:support@authentichadith.app"
                className="flex items-center gap-3 text-sm text-foreground hover:text-[#C5A059] transition-colors font-sans"
              >
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>support@authentichadith.app</span>
              </a>
            </div>
          </div>

          {/* Open Source */}
          <div className="mt-4 rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 font-sans">Open Source Attribution</h3>
            <div className="space-y-2 text-sm font-sans">
              {[
                { label: "Hadith Data", value: "fawazahmed0/hadith-api", href: "https://github.com/fawazahmed0/hadith-api" },
                { label: "UI Components", value: "shadcn/ui, Radix UI", href: "https://ui.shadcn.com" },
                { label: "Icons", value: "Lucide Icons", href: "https://lucide.dev" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{row.label}</span>
                  <a
                    href={row.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-foreground font-medium hover:text-[#C5A059] transition-colors"
                  >
                    {row.value}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* Founder's Note */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-[#C5A059]/10 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 text-[#C5A059]" />
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#1b5e43] dark:text-[#6bb895]">
              A Note from the Team
            </h2>
          </div>

          <div className="rounded-xl gold-border p-5 sm:p-6">
            <div className="space-y-4 text-sm sm:text-base text-foreground/90 leading-relaxed font-sans">
              <p>
                Authentic Hadith was built out of a simple need: to learn about
                the Prophet&apos;s teachings in a way that felt modern, trustworthy,
                and accessible—without sacrificing scholarly integrity.
              </p>
              <p>
                Too much Islamic content online lacks proper citation, mixes
                weak narrations with authentic ones, or presents knowledge
                without context. We wanted to create something different.
              </p>
              <p>
                This app is built with deep respect for classical scholarship,
                clear boundaries around AI, and a commitment to helping Muslims
                grow in knowledge with dignity.
              </p>
              <p className="font-medium text-foreground">
                We&apos;re honored to serve you on this journey.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-border/50">
              <p className="text-sm font-semibold text-foreground font-sans">
                — The Authentic Hadith Team
              </p>
              <p className="text-xs text-muted-foreground mt-1 font-sans">
                byRed
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
