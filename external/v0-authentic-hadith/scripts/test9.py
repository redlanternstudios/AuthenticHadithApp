import urllib.request
import urllib.error
import json

# Try various AI providers to find one not behind Cloudflare
endpoints = [
    ("Anthropic", "https://api.anthropic.com/v1/messages"),
    ("Together", "https://api.together.xyz/v1/chat/completions"),
    ("Fireworks", "https://api.fireworks.ai/inference/v1/chat/completions"),
    ("Mistral", "https://api.mistral.ai/v1/chat/completions"),
    ("Deepseek", "https://api.deepseek.com/v1/chat/completions"),
    ("Ollama-test", "https://api.deepinfra.com/v1/openai/chat/completions"),
]

for name, url in endpoints:
    try:
        req = urllib.request.Request(url, 
            data=json.dumps({"model":"test","messages":[{"role":"user","content":"hi"}]}).encode(),
            headers={"Authorization":"Bearer dummy","Content-Type":"application/json"})
        resp = urllib.request.urlopen(req, timeout=5)
        print(f"{name}: OK {resp.status}")
    except urllib.error.HTTPError as e:
        code = e.code
        body = e.read().decode()[:80]
        blocked = "1010" in body or "1020" in body
        print(f"{name}: HTTP {code} {'BLOCKED' if blocked else 'REACHABLE'} - {body[:60]}")
    except Exception as e:
        print(f"{name}: FAIL - {str(e)[:60]}")
