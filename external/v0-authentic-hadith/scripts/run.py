import os, json, urllib.request, ssl
U = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
K = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
D = os.environ["DEEPINFRA_API_KEY"]
x = ssl.create_default_context()
H = {"apikey":K,"Authorization":"Bearer "+K,"Content-Type":"application/json"}

def rpc(fn, body):
    b = json.dumps(body).encode()
    r = urllib.request.Request(U+"/rest/v1/rpc/"+fn, data=b, headers=H, method="POST")
    return json.loads(urllib.request.urlopen(r, context=x, timeout=30).read())

def ai(prompt):
    m = {"model":"meta-llama/Llama-3.3-70B-Instruct","temperature":0.3,"max_tokens":800}
    m["messages"] = [
        {"role":"system","content":"Hadith scholar. Return ONLY valid JSON."},
        {"role":"user","content":prompt}
    ]
    b = json.dumps(m).encode()
    r = urllib.request.Request("https://api.deepinfra.com/v1/openai/chat/completions", data=b, method="POST")
    r.add_header("Content-Type", "application/json")
    r.add_header("Authorization", "Bearer "+D)
    res = json.loads(urllib.request.urlopen(r, context=x, timeout=60).read())
    raw = res["choices"][0]["message"]["content"].strip()
    if raw.startswith("```"):
        raw = "\n".join(raw.split("\n")[1:-1])
    return json.loads(raw)

todo = rpc("get_unenriched_hadiths", {"lim": 5})
print("Todo:", len(todo))
ok = 0
for i, h in enumerate(todo):
    try:
        t = (h.get("english_translation") or "")[:500]
        t = t.replace('"', "'").replace("\n", " ")
        p = "Analyze hadith: " + t
        p += "\nReturn JSON with: summary_line, key_teaching_en, "
        p += "key_teaching_ar, summary_ar, category_slug, tag_slugs, confidence"
        o = ai(p)
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
        print(str(i+1)+" OK: "+(o.get("summary_line",""))[:50])
        ok += 1
    except Exception as e:
        print(str(i+1)+" ERR: "+str(e)[:80])
print("Done:", ok, "/", len(todo))
