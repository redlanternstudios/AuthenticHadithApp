"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "./sidebar"
import { MobileTopBar } from "./mobile-top-bar"
import { BottomNavigation } from "@/components/home/bottom-navigation"
import { cn } from "@/lib/utils"

// Pages that should NOT show the sidebar/navigation
const excludedPaths = ["/", "/login", "/onboarding", "/reset-password", "/checkout/success"]

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()

  // Check if current path should be excluded
  const isExcluded = excludedPaths.some((path) => pathname === path || (path !== "/" && pathname.startsWith(path)))

  if (isExcluded) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Top Bar with back/home buttons */}
      <MobileTopBar />

      {/* Main Content - Shifted right on desktop (xl+) to account for sidebar */}
      <div
        className={cn(
          "transition-all duration-300",
          "xl:ml-[260px]", // Default sidebar width on extra large screens
          "pb-20 xl:pb-0", // Bottom padding for mobile/tablet nav
        )}
      >
        {children}
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}
