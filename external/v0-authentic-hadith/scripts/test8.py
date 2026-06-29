import os
import json
import urllib.request
import urllib.error

xai_key = os.environ.get("XAI_API_KEY", "").strip()
print(f"xAI key: {xai_key[:12]}...")

payload = json.dumps({
    "model": "grok-3-mini-fast",
    "messages": [{"role": "user", "content": "Reply with exactly this JSON: {\"test\": true}"}],
    "response_format": {"type": "json_object"},
    "temperature": 0.3,
    "max_tokens": 50
}).encode()

req = urllib.request.Request(
    "https://api.x.ai/v1/chat/completions",
    data=payload,
    headers={
        "Authorization": f"Bearer {xai_key}",
        "Content-Type": "application/json"
    }
)
try:
    resp = urllib.request.urlopen(req)
    data = json.loads(resp.read().decode())
    content = data["choices"][0]["message"]["content"]
    print(f"xAI response: {content}")
    parsed = json.loads(content)
    print(f"Parsed OK: {parsed}")
except urllib.error.HTTPError as e:
    print(f"HTTP {e.code}: {e.read().decode()[:300]}")
except Exception as e:
    print(f"Error: {e}")
