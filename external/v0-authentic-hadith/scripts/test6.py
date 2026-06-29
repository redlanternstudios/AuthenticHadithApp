import os
print("VERCEL_URL:", os.environ.get("VERCEL_URL", "NOT SET"))
print("NEXT_PUBLIC_SITE_URL:", os.environ.get("NEXT_PUBLIC_SITE_URL", "NOT SET"))
print("VERCEL_PROJECT_PRODUCTION_URL:", os.environ.get("VERCEL_PROJECT_PRODUCTION_URL", "NOT SET"))

# Check all env vars with URL in name
for k, v in os.environ.items():
    if "URL" in k.upper() or "HOST" in k.upper() or "DOMAIN" in k.upper():
        print(f"  {k}: {v[:60]}")
