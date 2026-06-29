import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const publicPaths = ["/pricing", "/checkout/success", "/reset-password"]
const publicPrefixes = ["/api", "/auth", "/admin", "/about", "/privacy", "/terms", "/contact", "/my-hadith"]
const authPages = ["/login"]
const protectedPrefixes = ["/home", "/dashboard", "/onboarding", "/profile", "/settings", "/saved", "/collections", "/hadith", "/assistant", "/search", "/learn", "/today", "/sunnah", "/stories", "/reflections", "/quiz", "/progress", "/share", "/topics", "/achievements"]

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Fast-path: skip auth check entirely for public pages (allows crawlers/bots through)
  const isPublic =
    publicPaths.some((p) => pathname === p) ||
    publicPrefixes.some((prefix) => pathname.startsWith(prefix))

  if (isPublic) {
    return NextResponse.next({ request })
  }

  // Root path "/" — check auth and redirect accordingly
  if (pathname === "/") {
    let supabaseResponse = NextResponse.next({ request })
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options),
            )
          },
        },
      },
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const hasOnboarded = request.cookies.get("ah_onboarded")?.value === "1"
      const hasSafetyAgreed = request.cookies.get("ah_safety_agreed")?.value === "1"
      const url = request.nextUrl.clone()
      url.pathname = hasOnboarded && hasSafetyAgreed ? "/home" : "/onboarding"
      return NextResponse.redirect(url)
    }
    // Not logged in — show the public landing page
    return NextResponse.next({ request })
  }

  const isAuthPage = authPages.some((p) => pathname === p)
  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix))

  // If the path isn't protected and isn't an auth page, just pass through
  if (!isProtected && !isAuthPage) {
    return NextResponse.next({ request })
  }

  // Only run Supabase auth for protected routes
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const hasOnboarded = request.cookies.get("ah_onboarded")?.value === "1"
  const hasSafetyAgreed = request.cookies.get("ah_safety_agreed")?.value === "1"

  // Auth page: redirect logged-in users away from login
  if (isAuthPage && user) {
    const url = request.nextUrl.clone()
    url.pathname = hasOnboarded ? "/home" : "/onboarding"
    return NextResponse.redirect(url)
  }

  // Auth page but not logged in: allow through
  if (isAuthPage) {
    return supabaseResponse
  }

  // Protected page: redirect unauthenticated users to login
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // Protected page: redirect to onboarding if safety not agreed or not onboarded
  if ((!hasOnboarded || !hasSafetyAgreed) && pathname !== "/onboarding") {
    const url = request.nextUrl.clone()
    url.pathname = "/onboarding"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
