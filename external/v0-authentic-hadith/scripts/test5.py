import os
import json
import urllib.request
import urllib.error

groq_key = os.environ.get("GROQ_API_KEY", "").strip()
print(f"Key length: {len(groq_key)}")
print(f"Key starts: {groq_key[:8]}...")
print(f"Key ends: ...{groq_key[-4:]}")

# Test models endpoint with auth
req = urllib.request.Request(
    "https://api.groq.com/openai/v1/models",
    headers={"Authorization": f"Bearer {groq_key}"}
)
try:
    resp = urllib.request.urlopen(req)
    data = json.loads(resp.read().decode())
    models = [m["id"] for m in data.get("data", [])]
    print(f"Available models: {len(models)}")
    has_llama = any("llama-3.3" in m for m in models)
    print(f"Has llama-3.3: {has_llama}")
except urllib.error.HTTPError as e:
    body = e.read().decode()[:300]
    print(f"HTTP {e.code}: {body}")
