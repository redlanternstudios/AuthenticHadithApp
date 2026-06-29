import os, json, urllib.request, ssl
U = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
K = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
x = ssl.create_default_context()
H = {"apikey":K,"Authorization":"Bearer "+K,"Content-Type":"application/json"}
try:
    b = json.dumps({"lim":1}).encode()
    r = urllib.request.Request(U+"/rest/v1/rpc/get_unenriched_hadiths",data=b,headers=H,method="POST")
    todo = json.loads(urllib.request.urlopen(r,context=x,timeout=30).read())
    hid = todo[0]["id"]
    print("Hadith:",hid[:8])
    d = {"p_hadith_id":hid,"p_summary_line":"Test summary","p_summary_ar":"ملخص","p_key_teaching_en":"Test teaching","p_key_teaching_ar":"تعليم","p_category_slug":"faith","p_tag_slugs":["prayer"],"p_confidence":0.9}
    b2 = json.dumps(d).encode()
    r2 = urllib.request.Request(U+"/rest/v1/rpc/insert_enrichment",data=b2,headers=H,method="POST")
    resp = urllib.request.urlopen(r2,context=x,timeout=30)
    print("Status:",resp.status)
    print("Body:",resp.read().decode()[:100])
    print("OK!")
except Exception as e:
    print("ERR:",e)
