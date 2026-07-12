import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  // Check Sunan Abu Dawud specifically
  const { data: coll } = await supabase
    .from("collections")
    .select("id")
    .eq("slug", "sunan-abu-dawud")
    .single();
  
  if (!coll) { console.log("Collection not found"); return; }
  console.log("Collection ID:", coll.id);

  // Get books
  const { data: books } = await supabase
    .from("books")
    .select("id, number, name_en, total_hadiths")
    .eq("collection_id", coll.id)
    .order("number")
    .limit(15);
  
  console.log("\nBooks (first 15):");
  for (const b of books) {
    console.log(`  Book ${b.number}: "${b.name_en}" (${b.total_hadiths} hadiths)`);
    
    // Get chapters for this book
    const { data: chapters } = await supabase
      .from("chapters")
      .select("id, number, name_en, total_hadiths")
      .eq("book_id", b.id)
      .order("number")
      .limit(12);
    
    for (const ch of chapters) {
      // Count actual collection_hadiths links
      const { count } = await supabase
        .from("collection_hadiths")
        .select("id", { count: "exact", head: true })
        .eq("chapter_id", ch.id);
      
      // Get a sample hadith from this chapter
      const { data: sampleLinks } = await supabase
        .from("collection_hadiths")
        .select("hadith_id, hadith_number")
        .eq("chapter_id", ch.id)
        .limit(2);
      
      let sampleContent = "no links";
      if (sampleLinks?.length) {
        const { data: hData } = await supabase
          .from("hadiths")
          .select("id, english_translation, arabic_text")
          .eq("id", sampleLinks[0].hadith_id)
          .single();
        
        if (hData) {
          const engLen = hData.english_translation?.length || 0;
          const arLen = hData.arabic_text?.length || 0;
          sampleContent = `eng=${engLen}chars, ar=${arLen}chars`;
        } else {
          sampleContent = "hadith NOT FOUND in hadiths table";
        }
      }
      
      console.log(`    Ch ${ch.number}: "${ch.name_en}" total_hadiths=${ch.total_hadiths}, actual_links=${count}, sample=[${sampleContent}]`);
    }
  }

  // Count all hadiths with empty english_translation for this collection
  const { data: emptyHadiths } = await supabase
    .from("collection_hadiths")
    .select("hadith_id")
    .eq("collection_id", coll.id)
    .limit(10);
  
  if (emptyHadiths?.length) {
    const ids = emptyHadiths.map(h => h.hadith_id);
    const { data: hds } = await supabase
      .from("hadiths")
      .select("id, english_translation, arabic_text")
      .in("id", ids);
    
    const empty = hds?.filter(h => !h.english_translation || h.english_translation.length < 10);
    console.log(`\nSample: ${empty?.length || 0} out of ${hds?.length} hadiths have empty/short english_translation`);
  }

  // Overall stats
  const { count: totalLinks } = await supabase
    .from("collection_hadiths")
    .select("id", { count: "exact", head: true })
    .eq("collection_id", coll.id);
  
  console.log(`\nTotal collection_hadiths links for Abu Dawud: ${totalLinks}`);
}

main().catch(console.error);
