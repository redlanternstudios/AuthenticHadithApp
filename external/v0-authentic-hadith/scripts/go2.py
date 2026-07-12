import os, json, urllib.request, ssl
U = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
K = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
D = os.environ["DEEPINFRA_API_KEY"]
x = ssl.create_default_context()
H = {"apikey": K, "Authorization": "Bearer " + K}
H["Content-Type"] = "application/json"

def rpc(fn, body, rd=True):
    b = json.dumps(body).encode()
    u = U + "/rest/v1/rpc/" + fn
    r = urllib.request.Request(u, data=b, headers=H, method="POST")
    resp = urllib.request.urlopen(r, context=x, timeout=30)
    if rd:
        return json.loads(resp.read())
    return None

def ai(p):
    msgs = [{"role": "system", "content": "Return ONLY valid JSON."}]
    msgs.append({"role": "user", "content": p})
    m = {"model": "meta-llama/Llama-3.3-70B-Instruct"}
    m["temperature"] = 0.3
    m["max_tokens"] = 800
    m["messages"] = msgs
    b = json.dumps(m).encode()
    u = "https://api.deepinfra.com/v1/openai/chat/completions"
    r = urllib.request.Request(u, data=b, method="POST")
    r.add_header("Content-Type", "application/json")
    r.add_header("Authorization", "Bearer " + D)
    resp = urllib.request.urlopen(r, context=x, timeout=60)
    raw = json.loads(resp.read())
    c = raw["choices"][0]["message"]["content"].strip()
    if c.startswith("```"):
        c = "\n".join(c.split("\n")[1:-1])
    return json.loads(c)

todo = rpc("get_unenriched_hadiths", {"lim": 3})
print("Todo:", len(todo))
for i, h in enumerate(todo):
    try:
        t = (h.get("english_translation") or "")[:400]
        t = t.replace('"', "'").replace("\n", " ")
        pr = "Analyze hadith: " + t
        pr += "\nReturn JSON: summary_line, "
        pr += "key_teaching_en, key_teaching_ar, "
        pr += "summary_ar, category_slug, "
        pr += "tag_slugs, confidence"
        o = ai(pr)
        d = {"p_hadith_id": h["id"]}
        d["p_summary_line"] = (o.get("summary_line") or "")[:80]
        d["p_summary_ar"] = (o.get("summary_ar") or "")[:120]
        d["p_key_teaching_en"] = (o.get("key_teaching_en") or "")[:600]
        d["p_key_teaching_ar"] = (o.get("key_teaching_ar") or "")[:800]
        d["p_category_slug"] = o.get("category_slug", "daily-life")
        d["p_tag_slugs"] = (o.get("tag_slugs") or [])[:4]
        d["p_confidence"] = float(o.get("confidence", 0.8))
        rpc("insert_enrichment", d, rd=False)
        s = (o.get("summary_line", ""))[:50]
        print(str(i + 1), "OK:", s)
    except Exception as e:
        print(str(i + 1), "ERR:", str(e)[:80])
print("Done")
