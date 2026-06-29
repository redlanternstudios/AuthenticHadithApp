import urllib.request
import urllib.error

urls = [
    "https://api.groq.com/openai/v1/models",
    "https://api.openai.com/v1/models",
    "https://httpbin.org/get",
]
for u in urls:
    try:
        req = urllib.request.Request(u, headers={"User-Agent": "test"})
        resp = urllib.request.urlopen(req, timeout=5)
        print(f"OK {resp.status}: {u}")
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code}: {u} - {e.read().decode()[:100]}")
    except Exception as e:
        print(f"FAIL: {u} - {e}")
