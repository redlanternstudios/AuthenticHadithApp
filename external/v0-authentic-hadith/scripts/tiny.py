import os, json, urllib.request, ssl

SB_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SB_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
DI_KEY = os.environ["DEEPINFRA_API_KEY"]
ctx = ssl.create_default_context()

print("Testing Deep Infra call...")
body = json.dumps({
    "model": "meta-llama/Llama-3.3-70B-Instruct",
    "messages": [{"role": "user", "content": "Return JSON: {\"test\": true}"}],
    "temperature": 0.1,
    "max_tokens": 50,
}).encode("utf-8")

req = urllib.request.Request(
    "https://api.deepinfra.com/v1/openai/chat/completions",
    data=body,
    headers={
        "Content-Type": "application/json",
        "Authorization": "Bearer " + DI_KEY,
    },
    method="POST"
)
resp = urllib.request.urlopen(req, context=ctx, timeout=30)
result = json.loads(resp.read().decode("utf-8"))
print("Response:", result["choices"][0]["message"]["content"])
print("Done!")
