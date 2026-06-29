ALTER TABLE sunnah_practices ALTER COLUMN collection DROP NOT NULL;
ALTER TABLE sunnah_practices ALTER COLUMN collection SET DEFAULT 'Hadith';
