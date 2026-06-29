'use client'

import Image from "next/image"
import Link from "next/link"
import { BookOpen, Zap, Moon, MessageCircle, Volume2, Bookmark, Share2, Apple, Smartphone } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-85 transition">
            <Image src="/authentic-hadith-logo.png" alt="Authentic Hadith" width={48} height={48} className="w-10 h-10 md:w-12 md:h-12 object-contain" priority />
            <span className="hidden sm:inline text-sm md:text-base font-semibold text-[#0d2b1e]">Authentic Hadith</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-[#0d2b1e] hover:text-[#2d5a3d] transition-colors">
              Sign In
            </Link>
            <Link href="/login" className="px-4 py-2 bg-[#0d2b1e] text-white text-sm font-medium rounded-lg hover:bg-[#0a1f15] transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* SECTION 1 — HERO */}
      <section className="relative bg-[#0d2b1e] px-6 py-32 md:py-48 overflow-hidden">
        {/* Arabic watermark background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
          <div className="text-9xl md:text-[12rem] font-serif text-[#b8860b] text-center leading-none" style={{ direction: 'rtl' }}>
            بِسْمِ اللَّهِ
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text */}
            <div className="text-white">
              <p className="text-sm uppercase tracking-widest text-[#b8860b] font-semibold mb-6">14,444 Authenticated Hadiths</p>
              <h1 className="font-serif text-5xl md:text-7xl leading-tight mb-8 text-white">
                The Sunnah, <span className="text-[#b8860b]">Authenticated</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-300 mb-10 leading-relaxed max-w-lg">
                Browse, search, and understand authentic hadith — with Arabic text, scholarly grading, AI-powered explanation, and stories of the Prophets and Companions.
              </p>

              {/* App Store Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/login" className="px-6 py-4 bg-white text-[#0d2b1e] rounded-xl font-semibold hover:bg-gray-100 transition-all flex items-center gap-3 justify-center">
                  <Apple className="w-5 h-5" />
                  <div>
                    <div className="text-xs text-gray-600">Download on</div>
                    <div>App Store</div>
                  </div>
                </Link>
                <Link href="/login" className="px-6 py-4 bg-white text-[#0d2b1e] rounded-xl font-semibold hover:bg-gray-100 transition-all flex items-center gap-3 justify-center">
                  <Smartphone className="w-5 h-5" />
                  <div>
                    <div className="text-xs text-gray-600">Get it on</div>
                    <div>Google Play</div>
                  </div>
                </Link>
              </div>

              <p className="text-xs text-gray-400 font-medium">
                Sahih Bukhari · Sahih Muslim
              </p>
            </div>

            {/* Right: Two Phone Mockups */}
            <div className="relative h-96 md:h-[600px] flex items-center justify-center perspective">
              {/* Left phone (tilted) */}
              <div className="absolute -left-12 md:-left-20 top-0 transform -rotate-12 transition-transform hover:rotate-0">
                <div className="relative w-64 md:w-80 h-auto bg-black rounded-[3rem] p-3 shadow-2xl border-[10px] border-gray-900">
                  <div className="w-full bg-[#0d2b1e] rounded-[2.5rem] overflow-hidden flex flex-col h-[500px]">
                    {/* Status bar */}
                    <div className="bg-[#0a1f15] px-4 py-2 text-white text-xs flex justify-between items-center border-b border-[#2d5a3d]">
                      <span>9:41</span>
                      <span>●●●●●</span>
                    </div>

                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#0d2b1e] to-[#1a3a2d] px-4 py-3 border-b-2 border-[#b8860b]">
                      <p className="text-[#b8860b] text-xs font-bold text-center">BROWSE BY TOPIC</p>
                      <p className="text-gray-400 text-xs text-center mt-1">14,444 tagged hadiths · 20 categories</p>
                    </div>

                    {/* Categories */}
                    <div className="px-4 py-3 overflow-y-auto flex-1 space-y-2">
                      {[
                        { icon: "🕌", name: "Salah & Prayer", ar: "الصلاة", count: "5787" },
                        { icon: "🌙", name: "Fasting & Ramadan", ar: "الصيام", count: "1383" },
                        { icon: "💛", name: "Zakat & Charity", ar: "الزكاة", count: "1253" },
                        { icon: "🕋", name: "Hajj & Umrah", ar: "الحج", count: "2074" },
                        { icon: "♡", name: "Character & Manners", ar: "الأخلاق", count: "1727" },
                        { icon: "⭐", name: "Iman & Aqeedah", ar: "الإيمان", count: "2864" },
                      ].map((cat, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 rounded hover:bg-[#2d5a3d]/40 cursor-pointer transition">
                          <span className="text-lg">{cat.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-semibold truncate">{cat.name}</p>
                            <p className="text-gray-400 text-xs">{cat.ar}</p>
                          </div>
                          <p className="text-[#b8860b] text-xs font-bold whitespace-nowrap">{cat.count}</p>
                        </div>
                      ))}
                    </div>

                    {/* Bottom nav */}
                    <div className="border-t border-[#2d5a3d] px-4 py-2 flex justify-around text-center">
                      <div className="text-[#b8860b] text-xs">🏠 Home</div>
                      <div className="text-gray-400 text-xs">🗂 Topics</div>
                      <div className="text-gray-400 text-xs">💬 Chat</div>
                      <div className="text-gray-400 text-xs">📍 Saved</div>
                    </div>
                  </div>

                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-3xl"></div>
                </div>
              </div>

              {/* Right phone (straight) */}
              <div className="absolute right-0 md:right-auto md:left-1/3 top-8 md:top-0 transform md:translate-x-0 transition-transform hover:scale-105">
                <div className="relative w-64 md:w-80 h-auto bg-black rounded-[3rem] p-3 shadow-2xl border-[10px] border-gray-900">
                  <div className="w-full bg-[#0d2b1e] rounded-[2.5rem] overflow-hidden flex flex-col h-[500px]">
                    {/* Status bar */}
                    <div className="bg-[#0a1f15] px-4 py-2 text-white text-xs flex justify-between items-center border-b border-[#2d5a3d]">
                      <span>9:41</span>
                      <span>●●●●●</span>
                    </div>

                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#0d2b1e] to-[#1a3a2d] px-4 py-3 border-b-2 border-[#b8860b]">
                      <p className="text-[#b8860b] text-xs font-bold text-center">✦ HADITH OF THE DAY ✦</p>
                    </div>

                    {/* Badges */}
                    <div className="px-4 pt-3 pb-2 flex gap-2 items-center flex-wrap">
                      <span className="px-2 py-1 bg-[#2d5a3d] text-[#b8860b] text-xs font-semibold rounded border border-[#b8860b]">Sahih Muslim #2710</span>
                      <span className="px-2 py-1 bg-[#3a7a52] text-white text-xs font-bold rounded">✓ Sahih</span>
                    </div>

                    {/* Arabic text */}
                    <div className="px-4 py-2 text-white text-xs text-right leading-relaxed overflow-y-auto flex-1 border-l-3 border-[#b8860b] bg-[#0a1f15]">
                      <p className="font-serif leading-loose mb-2">حَدَّثَنَا أَبُو بَكْرِ بْنُ أَبِي شَيْبَةَ، حَدَّثَنَا غُنْدَرٌ، حَدَّثَنَا شُعْبَةُ، عَنْ سَعْدٍ، عَنْ سَهْلِ بْنِ سَعْدٍ قَالَ، قَالَ رَسُولُ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ إِنَّ فِي الْجَنَّةِ بَابًا يُقَالُ لَهُ الرَّيَّانُ يَدْخُلُ مِنْهُ الصَّائِمُونَ</p>
                    </div>

                    {/* Summary & Translation */}
                    <div className="px-4 py-2 border-t border-[#2d5a3d] space-y-1 text-xs bg-[#0a1f15]">
                      <p className="text-gray-300 leading-snug">The Prophet ﷺ said: "In Paradise there is a gate called Ar-Rayyan through which only the fasting people will enter."</p>
                      <div className="bg-[#1a3a2d] rounded p-1 mt-1 border-l-2 border-[#b8860b]">
                        <p className="text-[#b8860b] font-bold text-[0.7rem]">✨ AI Summary</p>
                        <p className="text-white text-[0.65rem] leading-tight">Special honor for fasting people in Paradise</p>
                      </div>
                    </div>

                    {/* Bottom actions */}
                    <div className="px-4 py-2 border-t border-[#2d5a3d] flex items-center justify-between">
                      <div className="flex gap-3 text-[#3a7a52]">
                        <Volume2 className="w-4 h-4 cursor-pointer hover:text-[#b8860b]" />
                        <Bookmark className="w-4 h-4 cursor-pointer hover:text-[#b8860b]" />
                        <Share2 className="w-4 h-4 cursor-pointer hover:text-[#b8860b]" />
                      </div>
                      <p className="text-xs font-bold text-[#b8860b]">READ ›</p>
                    </div>
                  </div>

                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-3xl"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — STATS BAR */}
      <section className="bg-[#f5f0e8] px-6 py-12 border-y border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { icon: "📚", number: "14,444", label: "Hadiths", desc: "Sahih Bukhari & Sahih Muslim" },
              { icon: "🗂", number: "20", label: "Topics", desc: "Every domain of Islamic life" },
              { icon: "🌙", number: "365", label: "Sunnah", desc: "Daily practices of the Prophet ﷺ" },
              { icon: "🤖", number: "AI", label: "HadithChat", desc: "Grounded in authentic narrations" },
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-3xl md:text-4xl mb-2">{stat.icon}</div>
                <p className="text-2xl md:text-3xl font-bold text-[#0d2b1e] mb-1">{stat.number}</p>
                <p className="font-semibold text-[#0d2b1e] mb-1 text-sm">{stat.label}</p>
                <p className="text-xs text-gray-600">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3 — BROWSE BY TOPIC */}
      <section className="bg-white px-6 py-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#0d2b1e] font-semibold mb-3">Organized Knowledge</p>
            <h2 className="font-serif text-4xl md:text-5xl text-[#0d2b1e] mb-8 leading-tight">
              Every topic.<br /><span className="text-[#b8860b]">Every hadith.</span><br />In one place.
            </h2>
            <p className="text-base text-gray-700 mb-6 leading-relaxed">
              14,444 hadiths tagged and organized across 20 categories — from Salah & Prayer to Family & Marriage to Business & Trade. Each with Arabic text, English translation, scholarly grading, and complete narrator chain.
            </p>
            <Link href="/login" className="inline-flex items-center gap-2 text-[#0d2b1e] font-semibold hover:text-[#2d5a3d] transition-colors">
              Explore all categories <span>→</span>
            </Link>
          </div>
          <div className="hidden md:flex justify-center">
            <div className="text-center text-gray-400 p-12">Browse by Topic mockup appears on left side of hero above</div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — STORIES */}
      <section className="bg-[#0d2b1e] px-6 py-24">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <p className="text-xs uppercase tracking-widest text-[#b8860b] font-semibold mb-4">Stories</p>
          <h2 className="font-serif text-4xl md:text-5xl text-white mb-6">
            13 Companions. 25 Prophets.<br /><span className="text-[#b8860b]">Their full stories.</span>
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Multi-part narratives with Quranic references, historical context, and reading times. From Abu Bakr as-Siddiq to Adam (peace be upon him).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Companions */}
          <div className="text-white space-y-6">
            <h3 className="font-serif text-2xl">Stories — Companions</h3>
            {[
              { name: "Abu Bakr as-Siddiq", title: "The Truthful One", parts: "5 parts · 25 min", tags: "First Male Believer · First Caliph" },
              { name: "Khadijah bint Khuwaylid", title: "Mother of the Believers", parts: "4 parts · 20 min", tags: "First Believer · Prophet's Wife" },
              { name: "Umar ibn al-Khattab", title: "The Criterion", parts: "6 parts · 32 min", tags: "Second Caliph · Spreader of Islam" },
            ].map((comp, idx) => (
              <div key={idx} className="bg-[#2d5a3d]/40 rounded-lg p-4 border border-[#b8860b]/30 cursor-pointer hover:bg-[#2d5a3d]/60 transition">
                <p className="text-white font-semibold">{comp.name}</p>
                <p className="text-[#b8860b] text-sm mb-2">{comp.title}</p>
                <p className="text-gray-300 text-sm mb-2">{comp.parts}</p>
                <p className="text-gray-400 text-xs">{comp.tags}</p>
              </div>
            ))}
          </div>

          {/* Prophets */}
          <div className="text-white space-y-6">
            <h3 className="font-serif text-2xl">Stories — Prophets</h3>
            {[
              { num: "01", name: "Adam", ar: "آدم", title: "Father of Humanity", mentions: "25 mentions" },
              { num: "02", name: "Nuh (Noah)", ar: "نوح", title: "The Preacher", mentions: "43 mentions" },
              { num: "03", name: "Ibrahim (Abraham)", ar: "إبراهيم", title: "The Khalil", mentions: "69 mentions" },
            ].map((prophet, idx) => (
              <div key={idx} className="border-l-4 border-[#b8860b] pl-4 py-2 cursor-pointer hover:bg-[#2d5a3d]/20 transition rounded pr-4">
                <p className="text-white font-semibold text-sm">{prophet.num} · {prophet.name}</p>
                <p className="text-gray-300 text-xs">{prophet.ar} · {prophet.title}</p>
                <p className="text-gray-400 text-xs mt-1">{prophet.mentions} in the Quran</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 — SUNNAH PRACTICES */}
      <section className="bg-white px-6 py-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#0d2b1e] font-semibold mb-3">Sunnah Practices</p>
            <h2 className="font-serif text-4xl md:text-5xl text-[#0d2b1e] mb-8">
              365 ways to live<br /><span className="text-[#b8860b]">the Sunnah today.</span>
            </h2>
            <p className="text-base text-gray-700 mb-6 leading-relaxed">
              Not just reading — practicing. 365 authentic Sunnah acts organized across 10 categories with step-by-step guidance, supporting hadith, and daily reminders.
            </p>
            <Link href="/login" className="inline-flex items-center gap-2 text-[#0d2b1e] font-semibold hover:text-[#2d5a3d] transition-colors">
              Start practicing <span>→</span>
            </Link>
          </div>

          <div className="bg-[#f5f0e8] rounded-lg p-8">
            <div className="space-y-3">
              {[
                { icon: "🕌", name: "Sunnah of Salah", count: "37" },
                { icon: "❤️", name: "Sunnah of Character", count: "49" },
                { icon: "🏘️", name: "Sunnah at Home", count: "28" },
                { icon: "👥", name: "Sunnah with People", count: "42" },
                { icon: "🍽️", name: "Sunnah of Eating", count: "33" },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded hover:bg-white transition cursor-pointer">
                  <span className="text-2xl">{item.icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-[#0d2b1e]">{item.name}</p>
                  </div>
                  <p className="font-bold text-[#b8860b]">{item.count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 — HADITHCHAT AI */}
      <section className="bg-[#0d2b1e] px-6 py-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="text-white">
            <p className="text-xs uppercase tracking-widest text-[#b8860b] font-semibold mb-3">HadithChat AI</p>
            <h2 className="font-serif text-4xl md:text-5xl mb-8">
              Ask anything.<br /><span className="text-[#b8860b]">Answered from authentic sources.</span>
            </h2>
            <p className="text-base text-gray-300 mb-8 leading-relaxed">
              Powered by AI grounded in the 14,444 authenticated hadiths from Sahih Bukhari and Sahih Muslim. Ask about Islamic practice, ethics, history — every answer is traced back to the original hadith.
            </p>
            <div className="space-y-4 mb-8">
              <p className="text-sm text-gray-300">Example questions:</p>
              {[
                '"What does Islam say about honesty in business?"',
                '"How did the Prophet handle family disputes?"',
                '"What are the benefits of dhikr (remembrance)?"',
              ].map((q, idx) => (
                <p key={idx} className="text-[#b8860b] text-sm pl-4 border-l-2 border-[#b8860b]">{q}</p>
              ))}
            </div>
            <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 bg-[#b8860b] text-[#0d2b1e] font-semibold rounded-lg hover:bg-[#d4af37] transition-colors">
              Try HadithChat <span>→</span>
            </Link>
          </div>

          <div className="bg-[#2d5a3d]/30 rounded-lg p-6 border border-[#b8860b]/20">
            <div className="space-y-4 text-sm">
              <div className="bg-[#1a3a2d] rounded-lg p-3 text-gray-300">
                <p className="text-[0.8rem]">User: "What's the Sunnah about seeking knowledge?"</p>
              </div>
              <div className="bg-[#3a7a52]/30 rounded-lg p-3 text-gray-200">
                <p className="text-[0.8rem] mb-2 text-[#b8860b] font-semibold">HadithChat:</p>
                <p className="text-[0.8rem] leading-snug">The Prophet ﷺ said, "Seeking knowledge is an obligation for every Muslim." (Sahih Muslim 224)</p>
                <p className="text-[0.7rem] text-gray-400 mt-2">3 more hadiths about this topic</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7 — DOWNLOAD CTA */}
      <section className="bg-[#0d2b1e] px-6 py-24 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-[#b8860b] font-semibold mb-4">Begin with knowledge</p>
          <h2 className="font-serif text-4xl md:text-5xl text-white mb-6">Download Authentic Hadith today</h2>
          <p className="text-lg text-gray-300 mb-10">
            64,464 authentic hadiths from Sahih Bukhari, Sahih Muslim, and the Four Sunans — in one beautifully designed app.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/login" className="px-8 py-4 bg-white text-[#0d2b1e] rounded-xl font-semibold hover:bg-gray-100 transition-all flex items-center gap-3 justify-center">
              <Apple className="w-5 h-5" />
              <div>
                <div className="text-xs text-gray-600">Download on</div>
                <div>App Store</div>
              </div>
            </Link>
            <Link href="/login" className="px-8 py-4 bg-white text-[#0d2b1e] rounded-xl font-semibold hover:bg-gray-100 transition-all flex items-center gap-3 justify-center">
              <Smartphone className="w-5 h-5" />
              <div>
                <div className="text-xs text-gray-600">Get it on</div>
                <div>Google Play</div>
              </div>
            </Link>
          </div>

          <p className="text-sm text-gray-400">Available on iOS and Android · Free with optional premium features</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div>
              <p className="text-white font-semibold mb-4">Product</p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#" className="hover:text-white transition">Browse Hadiths</Link></li>
                <li><Link href="#" className="hover:text-white transition">HadithChat</Link></li>
                <li><Link href="#" className="hover:text-white transition">Sunnah Practices</Link></li>
                <li><Link href="#" className="hover:text-white transition">Stories</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-white font-semibold mb-4">Company</p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#" className="hover:text-white transition">About</Link></li>
                <li><Link href="#" className="hover:text-white transition">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition">Careers</Link></li>
                <li><Link href="#" className="hover:text-white transition">Contact</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-white font-semibold mb-4">Legal</p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#" className="hover:text-white transition">Privacy</Link></li>
                <li><Link href="#" className="hover:text-white transition">Terms</Link></li>
                <li><Link href="#" className="hover:text-white transition">License</Link></li>
              </ul>
            </div>
            <div className="col-span-2 md:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4 hover:opacity-80 transition">
                <Image src="/authentic-hadith-logo.png" alt="Authentic Hadith" width={32} height={32} className="w-8 h-8 object-contain" />
                <span className="text-white font-semibold">Authentic Hadith</span>
              </Link>
              <p className="text-sm text-gray-400">64,464 authenticated hadiths from the Six Books of Hadith</p>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <p className="text-sm text-gray-400 text-center">
              © 2026 Authentic Hadith. All rights reserved. Hadiths sourced from Sahih Bukhari, Sahih Muslim, Abu Dawud, Tirmidhi, Ibn Majah, and Nasai.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
