SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'achievements' ORDER BY ordinal_position;

SELECT slug, category, tier FROM achievements ORDER BY category, tier LIMIT 30;
