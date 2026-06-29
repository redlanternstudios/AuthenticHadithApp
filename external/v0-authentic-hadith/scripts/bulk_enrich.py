import os, json, time, urllib.request, urllib.error, ssl

SB_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SB_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
DI_KEY = os.environ["DEEPINFRA_API_KEY"]

CATS = {
    "afterlife":"3e74faa4-4ef8-4d48-bcc1-aff0afe114b2",
    "business":"a1b5b335-52f8-4334-98af-0501221c91a4",
    "character":"37c24695-be73-4ca2-9e64-a344faef50f3",
    "community":"2f376b8f-9018-45e9-8b3d-abf52d8efe33",
    "daily-life":"e1f1a80c-b53a-4026-bbe1-c49ec667c961",
    "dawah":"f688b61c-f6cf-4f31-a0b0-eebde5c6c57f",
    "dhikr":"00059e98-e2d4-413d-8a9c-fa4f325a4195",
    "faith":"f01910f6-1351-432f-88cc-0793b969d84a",
    "family":"17cfe241-9f49-4ce4-ad02-a689eb1134f2",
    "fasting":"74abe72e-f5a8-4967-bd2d-20e585148c9a",
    "fitna":"ceb742c5-d9b2-4113-8516-8513ba0c09bf",
    "hajj":"840ca8af-1567-44b9-b60f-a58803258b34",
    "history":"0281c191-19bb-48a4-8abd-3f74fe5e03a0",
    "knowledge":"8134685c-4093-4212-bd9e-1af8a5a5f671",
    "purification":"9ce15dc0-5c08-433e-bc2a-dadac0cc926f",
    "quran":"30eb4a06-9163-408d-9672-608685daf29c",
    "sunnah-acts":"01dfee45-b707-4d8e-99ed-b8fd57e5a629",
    "warfare":"659fd316-685f-42ed-ba01-3b77ea117e85",
    "worship":"e1a09a5f-bbd3-4d4b-ab86-78b9b5ca3d69",
    "zakat":"4a00508a-4ba5-4cf1-85e6-733909de3d0e",
}

TAGS = {
    "advice":"975adc6b-9b83-4724-904b-7c694550dd2b",
    "angels":"59dc64c3-42b3-465e-9810-6a4f1c14f544",
    "backbiting":"d42ebfab-15ba-479f-8721-c50e8231cd65",
    "brotherhood":"1c0bf792-2bac-45bb-9725-bbecdff6f0cf",
    "charity":"648c5e0d-298e-4d57-86df-4d8f469db115",
    "children":"a9ba6e21-246d-47f6-a043-f677e65498b3",
    "cleanliness":"5f72421c-abc2-4e67-91dc-83afd4f1e732",
    "companions":"eb5b0f7b-c40f-4137-8fa0-6cf15e9051b4",
    "day-of-judgment":"6f12454c-3eff-4002-959d-9bf7f4dcd8b2",
    "death":"ce3cb6ea-9c88-470b-aca5-c22ed92229f8",
    "dua-etiquette":"6427d685-7e74-44dd-a3f7-e37c09c136aa",
    "faith":"42d29e92-c730-4745-892e-b061f95ff38e",
    "fasting":"ee2fe961-0d3a-49e5-b24f-a04dcb75c4ae",
    "fear-of-allah":"c61ffbcd-055a-4edd-88c3-b56ffb381f06",
    "food":"a05c71ac-e10a-42c2-8d8f-f96d7f861d39",
    "forgiveness":"8caaa740-f619-49f4-a81c-df8cc1ad0293",
    "good-deeds":"5b73d1de-84df-4874-93eb-81cef02523c6",
    "gratitude":"7e75a211-a84a-469d-8331-92318c88ba5b",
    "hellfire":"09f68e90-eaf3-43c3-94cb-fbe444e15919",
    "honoring-parents":"4355c271-c47a-4bc4-bbaa-5872f5253f19",
    "humility":"580e0c5c-df72-4ab4-aff0-96c314782574",
    "intention":"e8a57fd4-cde8-4beb-9e13-8bb9f38fb777",
    "istighfar":"12880ad9-2cac-40ef-aa5f-5cc4f42c731d",
    "justice":"86706b42-66b0-4dc1-94bb-6b3e1ab52d39",
    "kindness":"c4e9ea3e-c0ce-481d-b03b-d011b4a329e9",
    "knowledge":"fe1511c7-0f46-47d1-a7ce-871e27c992f5",
    "marriage":"0b99adf0-5321-4917-8c22-34186fac262f",
    "mercy":"6dde3974-cc97-40ab-9478-8361469690db",
    "modesty":"fd41501a-cb6f-4cfe-8d4e-57b1280e2f7c",
    "night-prayer":"4ada450b-ffba-40e1-b717-c8ba9c03cefd",
    "paradise":"2570af90-c8fb-4c27-8eb0-a1bf1d801648",
    "patience":"8f488eb5-353e-4121-bbd8-500ca7e9032d",
    "prayer":"6a146ef0-d7ae-4532-b2f5-17d0d3a4694f",
    "quran":"6c1aeaba-2f38-4bfa-8507-60e473e83115",
    "remembrance":"232bc039-fad9-41ed-8581-73e7202c32ef",
    "seeking-knowledge":"fe1511c7-0f46-47d1-a7ce-871e27c992f5",
    "sincerity":"9eb0dbba-1fe0-4087-9341-9000df590cf1",
    "speech":"edc77bbc-4335-4253-9704-c9c6f904f845",
    "tawbah":"46582610-2445-4663-a364-1421b17062fa",
    "truthfulness":"495cbe20-f145-4a2b-8f5a-0774ab53aa5e",
    "wudu":"0067db39-e5e2-402e-917a-27acb89a1c2d",
}

CAT_SLUGS = list(CATS.keys())
TAG_SLUGS = list(TAGS.keys())
ctx = ssl.create_default_context()

def http(method, url, data=None, headers=None):
    hdrs = headers or {}
    body = None
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        hdrs["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=body, headers=hdrs, method=method)
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=60) as r:
            return json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        txt = e.read().decode("utf-8")[:200]
        print(f"  HTTP {e.code}: {txt}")
        return None

def sb(method, path, data=None):
    h = {"apikey": SB_KEY, "Authorization": "Bearer " + SB_KEY, "Prefer": "return=representation"}
    return http(method, SB_URL + "/rest/v1/" + path, data, h)

def enrich(hadith):
    text = (hadith.get("english_translation") or "")[:1200]
    narrator = hadith.get("narrator") or "Unknown"
    grade = hadith.get("grade") or "Unknown"

    prompt = "Analyze this hadith and return ONLY valid JSON.\n\n"
    prompt += 'Hadith: "' + text.replace('"', "'") + '"\n'
    prompt += "Narrator: " + narrator + "\nGrade: " + grade + "\n\n"
    prompt += "Return JSON with:\n"
    prompt += "- summary_line: 5-12 word summary of core teaching\n"
    prompt += "- key_teaching_en: 2-4 sentences. First: plain accessible explanation. Rest: scholarly context with references to scholars or Quran. Do NOT repeat hadith text.\n"
    prompt += "- key_teaching_ar: Arabic translation of key_teaching_en in MSA\n"
    prompt += "- summary_ar: Arabic translation of summary_line (3-10 words)\n"
    prompt += "- category_slug: ONE from " + str(CAT_SLUGS) + "\n"
    prompt += "- tag_slugs: 1-4 from " + str(TAG_SLUGS) + "\n"
    prompt += "- confidence: 0-1 float\n"
    prompt += "\nReturn ONLY the JSON object."

    resp = http("POST", "https://api.deepinfra.com/v1/openai/chat/completions", {
        "model": "meta-llama/Llama-3.3-70B-Instruct",
        "messages": [
            {"role": "system", "content": "You are a hadith scholar. Return valid JSON only, no markdown."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3,
        "max_tokens": 1000,
    }, {"Authorization": "Bearer " + DI_KEY})

    if not resp or "choices" not in resp:
        return None
    raw = resp["choices"][0]["message"]["content"].strip()
    if raw.startswith("```"):
        lines = raw.split("\n")
        raw = "\n".join(lines[1:-1]) if len(lines) > 2 else raw
    return json.loads(raw)


# Main
print("Starting bulk enrichment via Deep Infra...")
print(f"ENV: sb={bool(SB_URL)} key={bool(SB_KEY)} di={bool(DI_KEY)}")

# Get already-enriched IDs
enriched = sb("GET", "hadith_enrichment?select=hadith_id&limit=50000") or []
done = set(e["hadith_id"] for e in enriched)
print(f"Already enriched: {len(done)}")

# Get batch of hadiths
BATCH = 20
offset = len(done)
hadiths = sb("GET", f"hadiths?select=id,english_translation,narrator,grade&order=hadith_number.asc&offset={offset}&limit={BATCH}") or []
# Filter any that might already be enriched
hadiths = [h for h in hadiths if h["id"] not in done][:BATCH]
print(f"Processing batch of {len(hadiths)}")

ok = 0
fail = 0

for i, h in enumerate(hadiths):
    hid = h["id"]
    print(f"\n[{i+1}/{len(hadiths)}] {hid[:8]}...")
    try:
        r = enrich(h)
        if not r:
            print("  SKIP: no AI response")
            fail += 1
            continue

        cat = r.get("category_slug", "daily-life")
        if cat not in CATS:
            cat = "daily-life"

        row = {
            "hadith_id": hid,
            "summary_line": (r.get("summary_line") or "")[:80],
            "summary_ar": (r.get("summary_ar") or "")[:120],
            "key_teaching_en": (r.get("key_teaching_en") or "")[:600],
            "key_teaching_ar": (r.get("key_teaching_ar") or "")[:800],
            "category_id": CATS[cat],
            "status": "published",
            "confidence": min(1.0, max(0.0, float(r.get("confidence", 0.8)))),
            "rationale": "Auto-enriched via DeepInfra Llama-3.3-70B",
            "suggested_by": "deepinfra-llama-3.3-70b",
            "methodology_version": "v1.1",
        }

        ins = sb("POST", "hadith_enrichment", row)
        if not ins:
            print("  FAIL: insert error")
            fail += 1
            continue

        tags = (r.get("tag_slugs") or [])[:4]
        for ts in tags:
            if ts in TAGS:
                sb("POST", "hadith_tags", {"hadith_id": hid, "tag_id": TAGS[ts], "status": "published"})

        summary = (r.get("summary_line") or "?")[:50]
        print(f"  OK: {summary}")
        ok += 1

    except Exception as ex:
        print(f"  ERROR: {ex}")
        fail += 1

    time.sleep(0.3)

print(f"\n=== DONE: {ok} success, {fail} failed ===")
print(f"Total enriched now: {len(done) + ok}")
print(f"Remaining: ~{31886 - len(done) - ok}")
