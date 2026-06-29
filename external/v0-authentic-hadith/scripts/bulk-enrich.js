var SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
var SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
var GR_KEY = process.env.GROQ_API_KEY;

var CATS = {
  "afterlife":"3e74faa4-4ef8-4d48-bcc1-aff0afe114b2","business":"a1b5b335-52f8-4334-98af-0501221c91a4",
  "character":"37c24695-be73-4ca2-9e64-a344faef50f3","community":"2f376b8f-9018-45e9-8b3d-abf52d8efe33",
  "daily-life":"e1f1a80c-b53a-4026-bbe1-c49ec667c961","dawah":"f688b61c-f6cf-4f31-a0b0-eebde5c6c57f",
  "dhikr":"00059e98-e2d4-413d-8a9c-fa4f325a4195","faith":"f01910f6-1351-432f-88cc-0793b969d84a",
  "family":"17cfe241-9f49-4ce4-ad02-a689eb1134f2","fasting":"74abe72e-f5a8-4967-bd2d-20e585148c9a",
  "fitna":"ceb742c5-d9b2-4113-8516-8513ba0c09bf","hajj":"840ca8af-1567-44b9-b60f-a58803258b34",
  "history":"0281c191-19bb-48a4-8abd-3f74fe5e03a0","knowledge":"8134685c-4093-4212-bd9e-1af8a5a5f671",
  "purification":"9ce15dc0-5c08-433e-bc2a-dadac0cc926f","quran":"30eb4a06-9163-408d-9672-608685daf29c",
  "sunnah-acts":"01dfee45-b707-4d8e-99ed-b8fd57e5a629","warfare":"659fd316-685f-42ed-ba01-3b77ea117e85",
  "worship":"e1a09a5f-bbd3-4d4b-ab86-78b9b5ca3d69","zakat":"4a00508a-4ba5-4cf1-85e6-733909de3d0e"
};
var CAT_SLUGS = Object.keys(CATS);
var TAGS = {};

function wait(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

async function sbGet(path) {
  var r = await fetch(SB_URL + "/rest/v1/" + path, {
    headers: { "apikey": SB_KEY, "Authorization": "Bearer " + SB_KEY }
  });
  return r.json();
}

async function sbPost(path, data) {
  var r = await fetch(SB_URL + "/rest/v1/" + path, {
    method: "POST",
    headers: {
      "apikey": SB_KEY, "Authorization": "Bearer " + SB_KEY,
      "Content-Type": "application/json", "Prefer": "return=representation"
    },
    body: JSON.stringify(data)
  });
  if (!r.ok) {
    var t = await r.text();
    throw new Error("SB POST " + r.status + " " + t.slice(0, 150));
  }
  return r.json();
}

async function groq(text, narrator) {
  var p = "Analyze this hadith. Return JSON with: summary_line (5-12 words), category_slug (one of: " + CAT_SLUGS.join(",") + "), tag_slugs (1-4 from: prayer,fasting,charity,remembrance,patience,truthfulness,kindness,forgiveness,humility,parents,marriage,children,food,speech,cleanliness,seeking-knowledge,intention,faith,quran,justice,rights,brotherhood,death,judgment,paradise,hellfire,repentance,gratitude,sincerity,modesty,trust-in-allah,night-prayer,dhikr,dua-etiquette,companions,prophets,backbiting,envy,lying,wudu,ghusl), key_teaching_en (2-4 sentences: first accessible, then scholarly with scholar refs), key_teaching_ar (Arabic translation), summary_ar (3-10 Arabic words), confidence (0-1), rationale (brief).\n\nHadith: " + JSON.stringify(text.slice(0, 1200)) + "\nNarrator: " + (narrator || "Unknown");

  var r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": "Bearer " + GR_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are a hadith scholar. Respond with valid JSON only." },
        { role: "user", content: p }
      ],
      temperature: 0.3, max_tokens: 1200,
      response_format: { type: "json_object" }
    })
  });
  if (!r.ok) {
    var t = await r.text();
    throw new Error("Groq " + r.status + " " + t.slice(0, 150));
  }
  var d = await r.json();
  return JSON.parse(d.choices[0].message.content);
}

async function run() {
  // Load tags
  var tagRows = await sbGet("tags?select=id,slug&limit=200");
  tagRows.forEach(function(t) { TAGS[t.slug] = t.id; });
  console.log("Tags: " + Object.keys(TAGS).length);

  // Get already enriched IDs
  var enriched = await sbGet("hadith_enrichment?select=hadith_id");
  var done = {};
  enriched.forEach(function(e) { done[e.hadith_id] = true; });
  console.log("Already done: " + Object.keys(done).length);

  // Get hadiths
  var hadiths = await sbGet("hadiths?select=id,english_translation,narrator,grade&limit=1000&order=hadith_number.asc");
  var todo = hadiths.filter(function(h) { return !done[h.id]; });
  var batch = todo.slice(0, 20);
  console.log("Processing " + batch.length + " of " + todo.length + " remaining");

  var ok = 0;
  var fail = 0;

  for (var i = 0; i < batch.length; i++) {
    var h = batch[i];
    try {
      var r = await groq(h.english_translation || "", h.narrator);
      var cat = CAT_SLUGS.indexOf(r.category_slug) >= 0 ? r.category_slug : "daily-life";

      await sbPost("hadith_enrichment", {
        hadith_id: h.id,
        summary_line: (r.summary_line || "").slice(0, 80),
        summary_ar: (r.summary_ar || "").slice(0, 120),
        key_teaching_en: (r.key_teaching_en || "").slice(0, 600),
        key_teaching_ar: (r.key_teaching_ar || "").slice(0, 800),
        category_id: CATS[cat],
        status: "published",
        confidence: Math.min(1, Math.max(0, r.confidence || 0.7)),
        rationale: (r.rationale || "").slice(0, 200),
        suggested_by: "groq-llama-3.3-70b",
        methodology_version: "v1.1"
      });

      var tags = Array.isArray(r.tag_slugs) ? r.tag_slugs.slice(0, 4) : [];
      for (var j = 0; j < tags.length; j++) {
        if (TAGS[tags[j]]) {
          try { await sbPost("hadith_tags", { hadith_id: h.id, tag_id: TAGS[tags[j]], status: "published" }); } catch(e) {}
        }
      }

      ok++;
      console.log("[" + (i+1) + "] OK: " + (r.summary_line || "").slice(0, 60));
    } catch (err) {
      fail++;
      console.log("[" + (i+1) + "] FAIL: " + err.message.slice(0, 120));
    }
    if (i < batch.length - 1) await wait(2500);
  }

  console.log("DONE: ok=" + ok + " fail=" + fail);
}

run().catch(function(e) { console.log("Fatal: " + e.message); });
