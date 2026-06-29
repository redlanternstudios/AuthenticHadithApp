import os, json, time, urllib.request, urllib.error, ssl

SB_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SB_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
DI_KEY = os.environ["DEEPINFRA_API_KEY"]
ctx = ssl.create_default_context()

CATS = {"faith":"f01910f6-1351-432f-88cc-0793b969d84a","worship":"e1a09a5f-bbd3-4d4b-ab86-78b9b5ca3d69","character":"37c24695-be73-4ca2-9e64-a344faef50f3","daily-life":"e1f1a80c-b53a-4026-bbe1-c49ec667c961","family":"17cfe241-9f49-4ce4-ad02-a689eb1134f2","knowledge":"8134685c-4093-4212-bd9e-1af8a5a5f671","community":"2f376b8f-9018-45e9-8b3d-abf52d8efe33","purification":"9ce15dc0-5c08-433e-bc2a-dadac0cc926f","quran":"30eb4a06-9163-408d-9672-608685daf29c","afterlife":"3e74faa4-4ef8-4d48-bcc1-aff0afe114b2","business":"a1b5b335-52f8-4334-98af-0501221c91a4","dawah":"f688b61c-f6cf-4f31-a0b0-eebde5c6c57f","dhikr":"00059e98-e2d4-413d-8a9c-fa4f325a4195","fasting":"74abe72e-f5a8-4967-bd2d-20e585148c9a","fitna":"ceb742c5-d9b2-4113-8516-8513ba0c09bf","hajj":"840ca8af-1567-44b9-b60f-a58803258b34","history":"0281c191-19bb-48a4-8abd-3f74fe5e03a0","sunnah-acts":"01dfee45-b707-4d8e-99ed-b8fd57e5a629","warfare":"659fd316-685f-42ed-ba01-3b77ea117e85","zakat":"4a00508a-4ba5-4cf1-85e6-733909de3d0e"}

TAGS = {"prayer":"6a146ef0-d7ae-4532-b2f5-17d0d3a4694f","faith":"42d29e92-c730-4745-892e-b061f95ff38e","charity":"648c5e0d-298e-4d57-86df-4d8f469db115","forgiveness":"8caaa740-f619-49f4-a81c-df8cc1ad0293","patience":"8f488eb5-353e-4121-bbd8-500ca7e9032d","kindness":"c4e9ea3e-c0ce-481d-b03b-d011b4a329e9","knowledge":"fe1511c7-0f46-47d1-a7ce-871e27c992f5","good-deeds":"5b73d1de-84df-4874-93eb-81cef02523c6","sincerity":"9eb0dbba-1fe0-4087-9341-9000df590cf1","mercy":"6dde3974-cc97-40ab-9478-8361469690db","remembrance":"232bc039-fad9-41ed-8581-73e7202c32ef","companions":"eb5b0f7b-c40f-4137-8fa0-6cf15e9051b4","paradise":"2570af90-c8fb-4c27-8eb0-a1bf1d801648","hellfire":"09f68e90-eaf3-43c3-94cb-fbe444e15919","death":"ce3cb6ea-9c88-470b-aca5-c22ed92229f8","truthfulness":"495cbe20-f145-4a2b-8f5a-0774ab53aa5e","intention":"e8a57fd4-cde8-4beb-9e13-8bb9f38fb777","humility":"580e0c5c-df72-4ab4-aff0-96c314782574","quran":"6c1aeaba-2f38-4bfa-8507-60e473e83115","fasting":"ee2fe961-0d3a-49e5-b24f-a04dcb75c4ae"}

def sb_get(path):
    req = urllib.request.Request(SB_URL + "/rest/v1/" + path, headers={"apikey": SB_KEY, "Authorization": "Bearer " + SB_KEY}, method="GET")
    with urllib.request.urlopen(req, context=ctx, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))

def sb_post(path, data):
    body = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(SB_URL + "/rest/v1/" + path, data=body, headers={"apikey": SB_KEY, "Authorization": "Bearer " + SB_KEY, "Content-Type": "application/json", "Prefer": "return=representation"}, method="POST")
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=30) as r:
            return json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print(f"    DB error {e.code}: {e.read().decode()[:100]}")
        return None

def ai_call(prompt):
    body = json.dumps({"model": "meta-llama/Llama-3.3-70B-Instruct", "messages": [{"role": "system", "content": "You are a hadith scholar. Return ONLY valid JSON, no markdown fences or extra text."}, {"role": "user", "content": prompt}], "temperature": 0.3, "max_tokens": 800}).encode("utf-8")
    req = urllib.request.Request("https://api.deepinfra.com/v1/openai/chat/completions", data=body, headers={"Content-Type": "application/json", "Authorization": "Bearer " + DI_KEY}, method="POST")
    with urllib.request.urlopen(req, context=ctx, timeout=60) as r:
        result = json.loads(r.read().decode("utf-8"))
    raw = result["choices"][0]["message"]["content"].strip()
    if raw.startswith("```"):
        lines = raw.split("\n")
        raw = "\n".join(lines[1:-1])
    return json.loads(raw)

# Use RPC call to get unenriched hadith IDs efficiently
print("Fetching unenriched hadiths using left join approach...")

# Paginate through enriched IDs in batches of 1000
enriched_ids = set()
for page in range(0, 50):
    batch = sb_get(f"hadith_enrichment?select=hadith_id&limit=1000&offset={page * 1000}")
    if not batch:
        break
    for e in batch:
        enriched_ids.add(e["hadith_id"])
    if len(batch) < 1000:
        break

print(f"Already enriched: {len(enriched_ids)}")

# Now fetch hadiths page by page until we find enough unenriched ones
todo = []
BATCH_SIZE = 20
page_offset = 0

while len(todo) < BATCH_SIZE:
    hadiths = sb_get(f"hadiths?select=id,english_translation,narrator,grade&order=hadith_number.asc&limit=200&offset={page_offset}")
    if not hadiths:
        break
    for h in hadiths:
        if h["id"] not in enriched_ids:
            todo.append(h)
            if len(todo) >= BATCH_SIZE:
                break
    page_offset += 200

print(f"Found {len(todo)} unenriched hadiths to process")

cat_list = ",".join(CATS.keys())
tag_list = ",".join(TAGS.keys())
ok = 0
fail = 0

for i, h in enumerate(todo):
    hid = h["id"]
    text = (h.get("english_translation") or "")[:800].replace('"', "'").replace("\n", " ")
    narrator = h.get("narrator") or "Unknown"
    grade = h.get("grade") or "Unknown"

    print(f"[{i+1}/{len(todo)}] {hid[:8]}...", end=" ")

    try:
        prompt = "Analyze this hadith and return a JSON object.\n\n"
        prompt += "Hadith: " + text + "\n"
        prompt += "Narrator: " + narrator + "\nGrade: " + grade + "\n\n"
        prompt += "JSON keys: summary_line (5-12 words), key_teaching_en (2-4 sentences, first accessible then scholarly with scholar refs), "
        prompt += "key_teaching_ar (Arabic MSA of key_teaching_en), summary_ar (3-10 Arabic words), "
        prompt += "category_slug (one of: " + cat_list + "), "
        prompt += "tag_slugs (1-4 of: " + tag_list + "), confidence (0-1 float)"

        obj = ai_call(prompt)

        cat = obj.get("category_slug", "daily-life")
        if cat not in CATS:
            cat = "daily-life"

        row = {
            "hadith_id": hid,
            "summary_line": (obj.get("summary_line") or "")[:80],
            "summary_ar": (obj.get("summary_ar") or "")[:120],
            "key_teaching_en": (obj.get("key_teaching_en") or "")[:600],
            "key_teaching_ar": (obj.get("key_teaching_ar") or "")[:800],
            "category_id": CATS[cat],
            "status": "published",
            "confidence": min(1.0, max(0.0, float(obj.get("confidence", 0.8)))),
            "rationale": "Auto-enriched via DeepInfra Llama-3.3-70B",
            "suggested_by": "deepinfra-llama-3.3-70b",
            "methodology_version": "v1.1",
        }

        ins = sb_post("hadith_enrichment", row)
        if not ins:
            print("FAIL (db)")
            fail += 1
            continue

        tags = (obj.get("tag_slugs") or [])[:4]
        for ts in tags:
            if ts in TAGS:
                sb_post("hadith_tags", {"hadith_id": hid, "tag_id": TAGS[ts], "status": "published"})

        summary = (obj.get("summary_line") or "?")[:50]
        print(f"OK - {summary}")
        ok += 1

    except Exception as ex:
        print(f"FAIL - {ex}")
        fail += 1

    time.sleep(0.3)

total = len(enriched_ids) + ok
print(f"\n=== BATCH DONE: {ok} success, {fail} failed ===")
print(f"Total enriched: {total} / ~31886")
print(f"Remaining: ~{31886 - total}")
