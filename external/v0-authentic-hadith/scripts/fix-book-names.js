const SB = "https://nqklipakrfuwebkdnhwg.supabase.co";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { "apikey": KEY, "Authorization": "Bearer " + KEY, "Content-Type": "application/json" };
const CDN = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions";

const COLLS = [
  { slug: "jami-tirmidhi", eng: "eng-tirmidhi" },
  { slug: "sunan-ibn-majah", eng: "eng-ibnmajah" },
  { slug: "sunan-abu-dawud", eng: "eng-abudawud" },
  { slug: "sahih-muslim", eng: "eng-muslim" },
  { slug: "sunan-nasai", eng: "eng-nasai" },
  { slug: "sahih-bukhari", eng: "eng-bukhari" },
  { slug: "muwatta-malik", eng: "eng-malik" },
  { slug: "musnad-ahmad", eng: "eng-ahmad" },
];

async function main() {
  let fixed = 0;
  for (const c of COLLS) {
    // Get collection ID
    const cr = await fetch(SB + "/rest/v1/collections?slug=eq." + c.slug + "&select=id", { headers: H });
    const colls = await cr.json();
    if (!colls.length) continue;
    const collId = colls[0].id;

    // Get books with generic names
    const br = await fetch(SB + "/rest/v1/books?collection_id=eq." + collId + "&name_en=like.Book *&select=id,number,name_en&limit=200", { headers: H });
    const books = await br.json();
    if (!books.length) { console.log(c.slug + ": all books named"); continue; }

    console.log(c.slug + ": " + books.length + " books need names");

    // Fetch section metadata to get real names
    for (const book of books) {
      try {
        const resp = await fetch(CDN + "/" + c.eng + "/" + book.number + ".min.json");
        if (!resp.ok) continue;
        const data = await resp.json();
        const name = data.metadata && data.metadata.section && data.metadata.section[String(book.number)];
        if (name && name !== book.name_en) {
          await fetch(SB + "/rest/v1/books?id=eq." + book.id, {
            method: "PATCH", headers: H, body: JSON.stringify({ name_en: name })
          });
          // Also update the chapter name
          await fetch(SB + "/rest/v1/chapters?book_id=eq." + book.id, {
            method: "PATCH", headers: H, body: JSON.stringify({ name_en: name })
          });
          fixed++;
        }
      } catch (e) { /* skip */ }
    }
  }
  console.log("Fixed " + fixed + " book names");
}

main().catch(function(e) { console.error(e); });
