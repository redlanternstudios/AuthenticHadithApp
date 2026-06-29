import os, json, urllib.request, ssl

SB_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SB_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
DI_KEY = os.environ["DEEPINFRA_API_KEY"]
ctx = ssl.create_default_context()

CATS = {
    "faith": "f01910f6-1351-432f-88cc-0793b969d84a",
    "worship": "e1a09a5f-bbd3-4d4b-ab86-78b9b5ca3d69",
    "character": "37c24695-be73-4ca2-9e64-a344faef50f3",
    "daily-life": "e1f1a80c-b53a-4026-bbe1-c49ec667c961",
    "family": "17cfe241-9f49-4ce4-ad02-a689eb1134f2",
    "knowledge": "8134685c-4093-4212-bd9e-1af8a5a5f671",
    "community": "2f376b8f-9018-45e9-8b3d-abf52d8efe33",
    "purification": "9ce15dc0-5c08-433e-bc2a-dadac0cc926f",
    "quran": "30eb4a06-9163-408d-9672-608685daf29c",
    "afterlife": "3e74faa4-4ef8-4d48-bcc1-aff0afe114b2",
}

TAGS = {
    "prayer": "6a146ef0-d7ae-4532-b2f5-17d0d3a4694f",
    "faith": "42d29e92-c730-4745-892e-b061f95ff38e",
    "charity": "648c5e0d-298e-4d57-86df-4d8f469db115",
    "forgiveness": "8caaa740-f619-49f4-a81c-df8cc1ad0293",
    "patience": "8f488eb5-353e-4121-bbd8-500ca7e9032d",
    "kindness": "c4e9ea3e-c0ce-481d-b03b-d011b4a329e9",
    "knowledge": "fe1511c7-0f46-47d1-a7ce-871e27c992f5",
    "good-deeds": "5b73d1de-84df-4874-93eb-81cef02523c6",
    "sincerity": "9eb0dbba-1fe0-4087-9341-9000df590cf1",
    "mercy": "6dde3974-cc97-40ab-9478-8361469690db",
}

SB_H = {"apikey": SB_KEY, "Authorization": "Bearer " + SB_KEY}


def sb_get(path):
    req = urllib.request.Request(
        SB_URL + "/rest/v1/" + path,
        headers=SB_H,
        method="GET",
    )
    return json.loads(urllib.request.urlopen(req, context=ctx, timeout=30).read())


def sb_post(path, data):
    body = json.dumps(data).encode("utf-8")
    hdr = dict(SB_H)
    hdr["Content-Type"] = "application/json"
    hdr["Prefer"] = "return=representation"
    req = urllib.request.Request(
        SB_URL + "/rest/v1/" + path,
        data=body,
        headers=hdr,
        method="POST",
    )
    return json.loads(urllib.request.urlopen(req, context=ctx, timeout=30).read())


def ai_call(prompt):
    body = json.dumps({
        "model": "meta-llama/Llama-3.3-70B-Instruct",
        "messages": [
            {"role": "system", "content": "Hadith scholar. Return ONLY valid JSON."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.3,
        "max_tokens": 800,
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://api.deepinfra.com/v1/openai/chat/completions",
        data=body,
        headers={
            "Content-Type": "application/json",
            "Authorization": "Bearer " + DI_KEY,
        },
        method="POST",
    )
    res = json.loads(urllib.request.urlopen(req, context=ctx, timeout=60).read())
    raw = res["choices"][0]["message"]["content"].strip()
    if raw.startswith("```"):
        raw = "\n".join(raw.split("\n")[1:-1])
    return json.loads(raw)


print("Fetching enriched IDs...")
enriched = sb_get("hadith_enrichment?select=hadith_id&limit=50000")
done = set(e["hadith_id"] for e in enriched)
print("Already enriched:", len(done))

hadiths = sb_get(
    "hadiths?select=id,english_translation,narrator,grade"
    "&order=hadith_number.asc&limit=500"
)
todo = [h for h in hadiths if h["id"] not in done][:10]
print("Processing:", len(todo))

ck = ",".join(CATS.keys())
tk = ",".join(TAGS.keys())
ok = 0

for i, h in enumerate(todo):
    try:
        t = (h.get("english_translation") or "")[:600]
        t = t.replace('"', "'").replace("\n", " ")
        p = "Analyze hadith: " + t + "\n"
        p += "Narrator: " + (h.get("narrator") or "?") + "\n"
        p += "Grade: " + (h.get("grade") or "?") + "\n"
        p += "Return JSON: summary_line(5-12 words), "
        p += "key_teaching_en(2-4 sent), key_teaching_ar(Arabic), "
        p += "summary_ar(3-10 Arabic words), "
        p += "category_slug(one of:" + ck + "), "
        p += "tag_slugs(1-4 of:" + tk + "), confidence(0-1)"

        o = ai_call(p)
        cat = o.get("category_slug", "daily-life")
        if cat not in CATS:
            cat = "daily-life"

        row = {
            "hadith_id": h["id"],
            "summary_line": (o.get("summary_line") or "")[:80],
            "summary_ar": (o.get("summary_ar") or "")[:120],
            "key_teaching_en": (o.get("key_teaching_en") or "")[:600],
            "key_teaching_ar": (o.get("key_teaching_ar") or "")[:800],
            "category_id": CATS[cat],
            "status": "published",
            "confidence": min(1, max(0, float(o.get("confidence", 0.8)))),
            "suggested_by": "deepinfra-llama-3.3-70b",
            "methodology_version": "v1.1",
        }
        sb_post("hadith_enrichment", row)

        for tg in (o.get("tag_slugs") or [])[:4]:
            if tg in TAGS:
                sb_post("hadith_tags", {
                    "hadith_id": h["id"],
                    "tag_id": TAGS[tg],
                    "status": "published",
                })

        s = (o.get("summary_line") or "?")[:50]
        print("[" + str(i + 1) + "] OK:", s)
        ok += 1
    except Exception as e:
        print("[" + str(i + 1) + "] FAIL:", str(e)[:80])

print("Done:", ok, "/", len(todo))
print("Total enriched:", len(done) + ok)
