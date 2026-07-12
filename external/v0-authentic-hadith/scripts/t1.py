import os, json, urllib.request, ssl
U = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
K = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
x = ssl.create_default_context()
H = {"apikey":K,"Authorization":"Bearer "+K,"Content-Type":"application/json"}
b = json.dumps({"lim": 2}).encode()
r = urllib.request.Request(U+"/rest/v1/rpc/get_unenriched_hadiths", data=b, headers=H, method="POST")
res = json.loads(urllib.request.urlopen(r, context=x, timeout=30).read())
print("Got:", len(res), "hadiths")
for h in res:
    print(" -", h["id"][:8], (h.get("english_translation") or "")[:60])
