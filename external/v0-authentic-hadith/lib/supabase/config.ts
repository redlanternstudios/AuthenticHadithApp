// Supabase public configuration
// Uses environment variables from the Supabase integration, with hardcoded fallbacks for dev
// The anon key is designed to be public (it enforces RLS, not access control)

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://nqklipakrfuwebkdnhwg.supabase.co"

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xa2xpcGFrcmZ1d2Via2RuaHdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyODA3NDUsImV4cCI6MjA4Mzg1Njc0NX0.yhIe3hqiLlyF8atvSmNOL3HBq91V9Frw5jYcat-sZxY"
