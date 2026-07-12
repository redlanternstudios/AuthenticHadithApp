// Minimal test to see if we can call Supabase + Groq
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GROQ_KEY = process.env.GROQ_API_KEY;

console.log("ENV check:", !!SUPABASE_URL, !!SUPABASE_KEY, !!GROQ_KEY);

async function run() {
  // 1. Test Supabase - get 1 hadith
  console.log("Fetching 1 hadith...");
  const sbRes = await fetch(SUPABASE_URL + "/rest/v1/hadiths?select=id,english_translation,narrator,grade&limit=1", {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": "Bearer " + SUPABASE_KEY,
    },
  });
  console.log("Supabase status:", sbRes.status);
  const hadiths = await sbRes.json();
  console.log("Got hadith:", hadiths[0]?.id, (hadiths[0]?.english_translation || "").slice(0, 80));

  // 2. Test Groq
  console.log("Calling Groq...");
  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + GROQ_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: "Say hello in JSON: {\"greeting\": \"...\"}" }],
      temperature: 0.1,
      max_tokens: 50,
      response_format: { type: "json_object" },
    }),
  });
  console.log("Groq status:", groqRes.status);
  const groqData = await groqRes.json();
  console.log("Groq response:", JSON.stringify(groqData.choices?.[0]?.message?.content || groqData));

  console.log("Both APIs working!");
}

run().catch(e => console.log("Error:", e.message));
