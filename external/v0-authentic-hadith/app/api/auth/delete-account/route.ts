import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

const USER_DATA_TABLES = [
  "discussion_likes",
  "discussions",
  "quiz_attempts",
  "reading_progress",
  "hadith_views",
  "reflections",
  "saved_hadiths",
  "saved_collections",
  "sahaba_reading_progress",
  "user_achievements",
  "user_activity_log",
  "user_bookmarks",
  "user_notes",
  "user_folders",
  "user_stats",
  "user_streaks",
  "user_preferences",
  "subscriptions",
  "profiles",
] as const

export async function POST(request: Request) {
  try {
    const body = await request.json()
    // Accept "DELETE" (mobile app) and "DELETE MY ACCOUNT" (web). Mismatch =
    // Guideline 5.1.1 rejection — deletion silently fails on device. FIX-065.
    const confirmation = body?.confirmation
    if (confirmation !== "DELETE" && confirmation !== "DELETE MY ACCOUNT") {
      return NextResponse.json(
        { error: "Invalid confirmation. Please type 'DELETE' to proceed." },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdmin()

    // Mobile sends Authorization: Bearer <token> — no cookies. Old cookie-only
    // path 401'd every mobile delete with a valid session. FIX-065.
    let user = null
    const authHeader = request.headers.get("authorization") || ""
    const bearer = authHeader.replace(/^Bearer\s+/i, "").trim()
    if (bearer) {
      const { data, error } = await admin.auth.getUser(bearer)
      if (!error) user = data.user
    } else {
      const supabase = await createClient()
      const { data, error } = await supabase.auth.getUser()
      if (!error) user = data.user
    }

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const userId = user.id
    const deletionErrors: string[] = []

    for (const table of USER_DATA_TABLES) {
      const { error } = await admin.from(table).delete().eq("user_id", userId)
      if (error) {
        console.error(`Failed to delete from ${table}:`, error.message)
        deletionErrors.push(`${table}: ${error.message}`)
      }
    }

    const { data: avatarFiles } = await admin.storage.from("avatars").list(userId)
    if (avatarFiles && avatarFiles.length > 0) {
      const filePaths = avatarFiles.map((f) => `${userId}/${f.name}`)
      await admin.storage.from("avatars").remove(filePaths)
    }

    const { error: deleteUserError } = await admin.auth.admin.deleteUser(userId)
    if (deleteUserError) {
      return NextResponse.json(
        { error: "Failed to delete account. Please contact support." },
        { status: 500 }
      )
    }

    // Best-effort cookie sign-out (web only). Mobile has no cookie client so
    // this must never throw — the user is already deleted. FIX-065.
    try {
      const cookieClient = await createClient()
      await cookieClient.auth.signOut()
    } catch {
      // no cookie session on mobile — nothing to sign out
    }

    const response = NextResponse.json({
      success: true,
      deletionErrors: deletionErrors.length > 0 ? deletionErrors : undefined,
    })
    response.cookies.set("qbos_onboarded", "", { path: "/", maxAge: 0 })
    return response
  } catch (error) {
    console.error("Account deletion error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
