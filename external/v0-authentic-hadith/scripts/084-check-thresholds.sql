SELECT slug, name_en, category, tier, xp_reward, criteria
FROM achievements
WHERE slug IN ('path-scholar','companion-connoisseur','prophet-stories','sunnah-seeker')
ORDER BY slug;

SELECT column_name FROM information_schema.columns WHERE table_name = 'achievements' AND column_name = 'threshold';
