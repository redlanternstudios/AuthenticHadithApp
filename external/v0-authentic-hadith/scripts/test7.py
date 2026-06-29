import os
import json
import urllib.request
import urllib.error

# Check for any AI API keys
for k in sorted(os.environ.keys()):
    kl = k.lower()
    if any(x in kl for x in ["key", "token", "secret", "api"]):
        v = os.environ[k]
        print(f"  {k}: {v[:12]}...{v[-4:]}" if len(v) > 16 else f"  {k}: [short]")

# Try OpenAI with a dummy to see if reachable
req = urllib.request.Request(
    "https://api.openai.com/v1/chat/completions",
    data=json.dumps({"model":"gpt-4o-mini","messages":[{"role":"user","content":"say hi"}],"max_tokens":5}).encode(),
    headers={"Authorization": "Bearer dummy", "Content-Type": "application/json"}
)
try:
    resp = urllib.request.urlopen(req)
    print("OpenAI OK")
except urllib.error.HTTPError as e:
    code = e.code
    body = e.read().decode()[:100]
    print(f"OpenAI HTTP {code}: {body}")
    if code == 401:
        print("OpenAI IS REACHABLE (just needs valid key)")
