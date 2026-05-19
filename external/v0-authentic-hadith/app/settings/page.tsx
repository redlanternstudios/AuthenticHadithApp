"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft, Bell, Moon, Globe, Shield, HelpCircle, Star } from "lucide-react"
import { BottomNavigation } from "@/components/home/bottom-navigation"

// Notion SVG icon as an inline component
function NotionIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z" />
    </svg>
  )
}

const settingsItems = [
  { id: "notifications", icon: Bell, label: "Notifications", description: "Manage push notifications" },
  { id: "appearance", icon: Moon, label: "Appearance", description: "Dark mode and display settings" },
  { id: "language", icon: Globe, label: "Language", description: "Change app language" },
  { id: "privacy", icon: Shield, label: "Privacy & Security", description: "Manage your data" },
  { id: "help", icon: HelpCircle, label: "Help & Support", description: "Get help and contact us" },
]

export default function SettingsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen marble-bg pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#e5e7eb] bg-[#F8F6F2]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-[#F8F6F2] border border-[#e5e7eb] flex items-center justify-center hover:border-[#C5A059] transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-[#6b7280]" />
          </button>
          <h1 className="text-lg font-semibold text-[#1a1f36]">Settings</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="space-y-3">
          {settingsItems.map((item) => (
            <button
              key={item.id}
              className="w-full gold-border rounded-xl p-4 premium-card flex items-center gap-4 hover:-translate-y-0.5 transition-transform text-left"
            >
              <div className="w-10 h-10 rounded-lg gold-icon-bg flex items-center justify-center shrink-0">
                <item.icon className="w-5 h-5 text-[#C5A059]" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-[#1a1f36]">{item.label}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Integrations */}
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-[#6b7280] uppercase tracking-wider mb-3 px-1">
            Integrations
          </h2>
          <div className="space-y-3">
            <button
              onClick={() => router.push("/settings/notion")}
              className="w-full gold-border rounded-xl p-4 premium-card flex items-center gap-4 hover:-translate-y-0.5 transition-transform text-left"
            >
              <div className="w-10 h-10 rounded-lg gold-icon-bg flex items-center justify-center shrink-0">
                <NotionIcon className="w-5 h-5 text-[#C5A059]" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-[#1a1f36]">Notion</h3>
                <p className="text-sm text-muted-foreground">Export saved hadiths to Notion</p>
              </div>
            </button>
          </div>
        </div>

        {/* Premium & Support */}
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-[#6b7280] uppercase tracking-wider mb-3 px-1">
            Premium & Support
          </h2>
          <div className="space-y-3">
            <button
              onClick={() => router.push("/pricing")}
              className="w-full gold-border rounded-xl p-4 premium-card flex items-center gap-4 hover:-translate-y-0.5 transition-transform text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#C5A059] to-[#E8C77D] flex items-center justify-center shrink-0">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-[#1a1f36]">Upgrade to Premium</h3>
                <p className="text-sm text-muted-foreground">AI explanations, advanced search & more</p>
              </div>
            </button>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Authentic Hadith v1.0.0</p>
          <p className="mt-1">Made with care for the Muslim community</p>
        </div>
      </main>

      <BottomNavigation />
    </div>
  )
}
