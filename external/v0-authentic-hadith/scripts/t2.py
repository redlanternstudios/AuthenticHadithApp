import os, json, urllib.request, ssl
U = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
K = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
D = os.environ["DEEPINFRA_API_KEY"]
x = ssl.create_default_context()
H = {"apikey":K,"Authorization":"Bearer "+K,"Content-Type":"application/json"}

def rpc(fn, body):
    b = json.dumps(body).encode()
    r = urllib.request.Request(U+"/rest/v1/rpc/"+fn, data=b, headers=H, method="POST")
    raw = urllib.request.urlopen(r, context=x, timeout=30).read().decode()
    if not raw.strip():
        return None
    return json.loads(raw)

def ai(prompt):
    m = {"model":"meta-llama/Llama-3.3-70B-Instruct","temperature":0.3,"max_tokens":800}
    m["messages"] = [{"role":"system","content":"Return ONLY valid JSON."},{"role":"user","content":prompt}]
    b = json.dumps(m).encode()
    r = urllib.request.Request("https://api.deepinfra.com/v1/openai/chat/completions", data=b, method="POST")
    r.add_header("Content-Type", "application/json")
    r.add_header("Authorization", "Bearer "+D)
    res = json.loads(urllib.request.urlopen(r, context=x, timeout=60).read())
    raw = res["choices"][0]["message"]["content"].strip()
    if raw.startswith("```"):
        raw = "\n".join(raw.split("\n")[1:-1])
    return json.loads(raw)

todo = rpc("get_unenriched_hadiths", {"lim": 1})
h = todo[0]
t = (h.get("english_translation") or "")[:500].replace('"', "'").replace("\n", " ")
print("Hadith:", t[:80])
p = "Analyze hadith: " + t
p += "\nReturn JSON: summary_line, key_teaching_en, key_teaching_ar, summary_ar, category_slug, tag_slugs, confidence"
o = ai(p)
print("Summary:", o.get("summary_line"))
rpc("insert_enrichment", {
    "p_hadith_id": h["id"],
    "p_summary_line": (o.get("summary_line") or "")[:80],
    "p_summary_ar": (o.get("summary_ar") or "")[:120],
    "p_key_teaching_en": (o.get("key_teaching_en") or "")[:600],
    "p_key_teaching_ar": (o.get("key_teaching_ar") or "")[:800],
    "p_category_slug": o.get("category_slug", "daily-life"),
    "p_tag_slugs": (o.get("tag_slugs") or [])[:4],
    "p_confidence": min(1, max(0, float(o.get("confidence", 0.8))))
})
print("Inserted OK")
