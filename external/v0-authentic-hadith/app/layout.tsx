import type React from "react"
import type { Metadata, Viewport } from "next"
import { Cinzel, Geist, Geist_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AppShell } from "@/components/layout/app-shell"
import "./globals.css"

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  weight: ["400", "500", "600", "700"],
})

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: "Authentic Hadith - Learn From Verified Sources",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://authentichadith.app"),
  description:
    "Access verified hadith collections, guided learning paths, daily sunnah practices, stories of the prophets and companions, and AI-powered study tools -- all from authenticated sources.",
  verification: {
    google: "pu6PCNjJGNwTlF-CoQmeSTi_sDeWH5vwBexQ-cUA6B4",
  },
  icons: {
    icon: [
      {
        url: "/favicon.jpg",
        sizes: "32x32",
        type: "image/jpeg",
      },
      {
        url: "/icon-light-32x32.png",
        sizes: "32x32",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        sizes: "32x32",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    shortcut: "/favicon.jpg",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Authentic Hadith - Learn From Verified Sources",
    description: "Access verified hadith collections, guided learning paths, daily sunnah practices, stories of the prophets and companions, and AI-powered study tools.",
    url: "https://authentichadith.app",
    siteName: "Authentic Hadith",
    images: [
      {
        url: "/images/gemini-generated-image-xw5svjxw5svjxw5s.jpeg",
        width: 1024,
        height: 1024,
        alt: "Authentic Hadith - Learn From Verified Sources",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Authentic Hadith - Learn From Verified Sources",
    description: "Access verified hadith collections, guided learning paths, and AI-powered study tools from authenticated sources.",
    images: ["/images/gemini-generated-image-xw5svjxw5svjxw5s.jpeg"],
  },
    generator: 'v0.app'
}

export const viewport: Viewport = {
  themeColor: "#1B5E43",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background" suppressHydrationWarning>
      <body className={`${cinzel.variable} ${geist.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  )
}
