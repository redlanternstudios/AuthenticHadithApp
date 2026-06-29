// Check which env vars are available for bulk enrichment
const keys = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'OPENAI_API_KEY',
  'AI_GATEWAY_API_KEY',
  'GROQ_API_KEY',
]

for (const k of keys) {
  const val = process.env[k]
  console.log(`${k}: ${val ? val.slice(0, 12) + '...' : 'NOT SET'}`)
}
