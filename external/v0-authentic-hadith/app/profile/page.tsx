"use client"

import React from "react"

import { useEffect, useState, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, User, Bookmark, Settings, LogOut, Camera, X, Loader2, Pencil, Check, ChevronDown, Star } from "lucide-react"
import { Input } from "@/components/ui/input"

import { getSupabaseBrowserClient } from "@/lib/supabase/client"

interface UserProfile {
  name: string
  avatar_url: string | null
  school_of_thought: string | null
}

function ProfileContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = searchParams.get("tab") || "profile"
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [savedHadiths, setSavedHadiths] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [editSchool, setEditSchool] = useState("")
  const [saving, setSaving] = useState(false)
  const [schoolDropdownOpen, setSchoolDropdownOpen] = useState(false)

  const SCHOOLS_OF_THOUGHT = ["Hanafi", "Maliki", "Shafi'i", "Hanbali", "Other / Prefer not to say"]

  useEffect(() => {
    const fetchData = async () => {
      const supabase = getSupabaseBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setUserId(user.id)
        const { data: profileData } = await supabase.from("profiles").select("*").eq("user_id", user.id).single()

        if (profileData) {
          setProfile(profileData)
        }

        if (tab === "saved") {
          const { data: savedData } = await supabase
            .from("saved_hadiths")
            .select(`
              created_at,
              hadiths (*)
            `)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })

          setSavedHadiths(savedData?.map((s: any) => s.hadiths).filter(Boolean) || [])
        }
      }
      setLoading(false)
    }

    fetchData()
  }, [tab])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB")
      return
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      alert("Please upload a JPG, PNG, or WebP image")
      return
    }

    setUploading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const fileExt = file.name.split(".").pop()
      const filePath = `${userId}/avatar.${fileExt}`

      // Delete old avatar if exists
      await supabase.storage.from("avatars").remove([`${userId}/avatar.jpg`, `${userId}/avatar.png`, `${userId}/avatar.webp`])

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath)

      // Add cache-busting query param
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("user_id", userId)

      if (updateError) throw updateError

      setProfile((prev) => (prev ? { ...prev, avatar_url: publicUrl } : prev))
    } catch (err) {
      console.error("Avatar upload failed:", err)
      alert("Failed to upload image. Please try again.")
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemoveAvatar = async () => {
    if (!userId) return

    setUploading(true)
    try {
      const supabase = getSupabaseBrowserClient()

      // Remove all possible avatar files
      await supabase.storage.from("avatars").remove([`${userId}/avatar.jpg`, `${userId}/avatar.png`, `${userId}/avatar.webp`])

      // Clear avatar_url in profile
      await supabase.from("profiles").update({ avatar_url: null }).eq("user_id", userId)

      setProfile((prev) => (prev ? { ...prev, avatar_url: null } : prev))
    } catch (err) {
      console.error("Avatar removal failed:", err)
    } finally {
      setUploading(false)
    }
  }

  const startEditing = () => {
    setEditName(profile?.name || "")
    setEditSchool(profile?.school_of_thought || "")
    setEditing(true)
  }

  const handleSaveProfile = async () => {
    if (!userId || !editName.trim()) return
    setSaving(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase
        .from("profiles")
        .update({
          name: editName.trim(),
          school_of_thought: editSchool || null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)

      if (error) throw error

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              name: editName.trim(),
              school_of_thought: editSchool || null,
            }
          : prev,
      )
      setEditing(false)
    } catch (err) {
      console.error("Profile save failed:", err)
      alert("Failed to save profile. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient()
    await fetch("/api/auth/signout", { method: "POST" })
    await supabase.auth.signOut({ scope: "global" })
    document.cookie = "ah_onboarded=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    router.push("/login")
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen marble-bg pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center hover:border-[#C5A059] transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Profile</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Profile Card */}
        <div className="gold-border rounded-xl p-6 premium-card mb-6">
          <div className="flex items-center gap-4">
            {/* Avatar with upload */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[#C5A059] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C5A059]/50 focus:ring-offset-2 disabled:cursor-wait"
                aria-label="Upload profile picture"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url || "/placeholder.svg"}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-background flex items-center justify-center">
                    <User className="w-10 h-10 text-[#C5A059]" />
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploading ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </div>

                {/* Always show camera badge */}
                {!uploading && (
                  <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#C5A059] border-2 border-white flex items-center justify-center shadow-sm">
                    <Camera className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                {uploading && (
                  <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#C5A059] border-2 border-white flex items-center justify-center shadow-sm">
                    <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                  </div>
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarUpload}
                className="hidden"
                aria-label="Choose profile picture"
              />
            </div>

            <div className="flex-1">
              {editing ? (
                <div className="space-y-3">
                  <div>
                    <label htmlFor="edit-name" className="text-xs font-medium text-muted-foreground mb-1 block">
                      Name
                    </label>
                    <Input
                      id="edit-name"
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-10 premium-input rounded-lg"
                      maxLength={50}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="relative">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      School of Thought
                    </label>
                    <button
                      type="button"
                      onClick={() => setSchoolDropdownOpen(!schoolDropdownOpen)}
                      className="w-full h-10 px-3 flex items-center justify-between premium-input rounded-lg text-left text-sm"
                    >
                      <span className={editSchool ? "text-foreground" : "text-muted-foreground"}>
                        {editSchool || "Select school"}
                      </span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </button>
                    {schoolDropdownOpen && (
                      <div className="absolute z-20 w-full mt-1 bg-card border border-border rounded-lg shadow-lg overflow-y-auto max-h-48">
                        {SCHOOLS_OF_THOUGHT.map((school) => (
                          <button
                            key={school}
                            type="button"
                            onClick={() => {
                              setEditSchool(school)
                              setSchoolDropdownOpen(false)
                            }}
                            className="w-full px-3 py-2.5 text-left text-sm hover:bg-background transition-colors flex items-center justify-between"
                          >
                            <span className="text-foreground">{school}</span>
                            {editSchool === school && <Check className="w-4 h-4 text-[#C5A059]" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      disabled={saving || !editName.trim()}
                      className="px-4 py-1.5 rounded-lg gold-button text-sm font-medium disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(false)
                        setSchoolDropdownOpen(false)
                      }}
                      className="px-4 py-1.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold text-foreground">{profile?.name || "User"}</h2>
                    <button
                      type="button"
                      onClick={startEditing}
                      className="p-1 rounded-md hover:bg-background transition-colors"
                      aria-label="Edit profile"
                    >
                      <Pencil className="w-4 h-4 text-[#C5A059]" />
                    </button>
                  </div>
                  {profile?.school_of_thought && (
                    <p className="text-sm text-muted-foreground">{profile.school_of_thought}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="mt-1 text-xs text-[#C5A059] hover:text-[#a8863e] transition-colors disabled:opacity-50"
                  >
                    {uploading ? "Uploading..." : profile?.avatar_url ? "Change photo" : "Add photo"}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Remove photo option */}
          {profile?.avatar_url && !uploading && !editing && (
            <button
              type="button"
              onClick={handleRemoveAvatar}
              className="mt-3 ml-24 text-xs text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Remove photo
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => router.push("/profile")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              tab === "profile"
                ? "bg-gradient-to-r from-[#C5A059] to-[#E8C77D] text-white"
                : "bg-background border border-border text-foreground"
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => router.push("/profile?tab=saved")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              tab === "saved"
                ? "bg-gradient-to-r from-[#C5A059] to-[#E8C77D] text-white"
                : "bg-background border border-border text-foreground"
            }`}
          >
            Saved
          </button>
        </div>

        {tab === "profile" ? (
          <div className="space-y-4">
            {/* Premium upsell card */}
            <button
              onClick={() => router.push("/pricing")}
              className="w-full rounded-xl overflow-hidden hover:-translate-y-0.5 transition-transform"
            >
              <div className="bg-gradient-to-r from-[#C5A059] to-[#E8C77D] p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-white">Go Premium</h3>
                  <p className="text-sm text-white/80">Advanced search, AI explanations & more</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push("/settings")}
              className="w-full gold-border rounded-xl p-4 premium-card flex items-center gap-4 hover:-translate-y-0.5 transition-transform"
            >
              <div className="w-10 h-10 rounded-lg gold-icon-bg flex items-center justify-center">
                <Settings className="w-5 h-5 text-[#C5A059]" />
              </div>
              <span className="font-medium text-foreground">Settings</span>
            </button>
            <button
              onClick={handleSignOut}
              className="w-full border border-red-200 rounded-xl p-4 bg-red-50 flex items-center gap-4 hover:-translate-y-0.5 transition-transform"
            >
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <LogOut className="w-5 h-5 text-red-600" />
              </div>
              <span className="font-medium text-red-600">Sign Out</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {savedHadiths.length > 0 ? (
              savedHadiths.map((hadith) => (
                <button
                  key={hadith.id}
                  onClick={() => router.push(`/hadith/${hadith.id}`)}
                  className="w-full gold-border rounded-xl p-4 premium-card text-left hover:-translate-y-0.5 transition-transform"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 rounded text-xs font-bold text-white bg-gradient-to-r from-[#1B5E43] to-[#2D7A5B]">
                      {hadith.collection}
                    </span>
                  </div>
                  <p className="text-sm text-foreground line-clamp-2">{hadith.english_translation}</p>
                </button>
              ))
            ) : (
              <div className="text-center py-12">
                <Bookmark className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
                <p className="text-muted-foreground">No saved hadiths yet</p>
                <p className="text-sm text-muted-foreground mt-1">Tap the bookmark icon on any hadith to save it</p>
              </div>
            )}
          </div>
        )}
      </main>

    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen marble-bg flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  )
}
