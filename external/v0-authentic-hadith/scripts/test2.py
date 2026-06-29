import os
import json
import urllib.request
import urllib.error

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
print(f"URL set: {bool(url)}")
print(f"Key set: {bool(key)}")

if url and key:
    req = urllib.request.Request(
        f"{url}/rest/v1/hadiths?select=id,english_translation,narrator,grade,collection&limit=2",
        headers={"apikey": key, "Authorization": f"Bearer {key}"}
    )
    try:
        resp = urllib.request.urlopen(req)
        data = json.loads(resp.read().decode())
        print(f"Got {len(data)} hadiths")
        if data:
            print(f"First hadith id: {data[0]['id']}")
            print(f"Translation length: {len(data[0].get('english_translation',''))}")
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code} {e.read().decode()[:200]}")
