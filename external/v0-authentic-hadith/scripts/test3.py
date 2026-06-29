import os
import json
import urllib.request
import urllib.error

groq_key = os.environ.get("GROQ_API_KEY", "")
print(f"Groq key set: {bool(groq_key)}")

payload = json.dumps({
    "model": "llama-3.3-70b-versatile",
    "messages": [{"role": "user", "content": "Reply with exactly: {\"test\": true}"}],
    "response_format": {"type": "json_object"},
    "temperature": 0.3,
    "max_tokens": 50
}).encode()

req = urllib.request.Request(
    "https://api.groq.com/openai/v1/chat/completions",
    data=payload,
    headers={
        "Authorization": f"Bearer {groq_key}",
        "Content-Type": "application/json"
    }
)
try:
    resp = urllib.request.urlopen(req)
    data = json.loads(resp.read().decode())
    content = data["choices"][0]["message"]["content"]
    print(f"Groq response: {content}")
    parsed = json.loads(content)
    print(f"Parsed OK: {parsed}")
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code} {e.read().decode()[:300]}")
except Exception as e:
    print(f"Error: {e}")
