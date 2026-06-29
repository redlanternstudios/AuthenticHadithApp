-- 013: My Hadith database functions

-- 1. Generate share token function
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'base64');
END;
$$ LANGUAGE plpgsql;

-- 2. Create note version on update
CREATE OR REPLACE FUNCTION create_note_version()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.notes IS DISTINCT FROM NEW.notes THEN
    INSERT INTO hadith_note_versions (saved_hadith_id, notes, notes_html, version, created_by)
    VALUES (OLD.id, OLD.notes, OLD.notes_html, OLD.version, auth.uid());
    
    NEW.version = OLD.version + 1;
    NEW.last_edited_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_note_update ON saved_hadiths;
CREATE TRIGGER on_note_update
  BEFORE UPDATE ON saved_hadiths
  FOR EACH ROW
  EXECUTE FUNCTION create_note_version();

-- 3. Track folder share views
CREATE OR REPLACE FUNCTION track_folder_view(p_share_token TEXT, p_viewer_ip TEXT)
RETURNS void AS $$
DECLARE
  v_folder_id UUID;
  v_share_id UUID;
BEGIN
  SELECT id INTO v_folder_id 
  FROM hadith_folders 
  WHERE share_token = p_share_token;
  
  IF v_folder_id IS NOT NULL THEN
    -- Check if record exists
    SELECT id INTO v_share_id
    FROM folder_shares
    WHERE folder_id = v_folder_id AND share_token = p_share_token;
    
    IF v_share_id IS NOT NULL THEN
      -- Update existing record
      UPDATE folder_shares 
      SET views = views + 1,
          last_viewed_at = NOW()
      WHERE id = v_share_id;
    ELSE
      -- Insert new record
      INSERT INTO folder_shares (folder_id, share_token, views, last_viewed_at, viewer_ip)
      VALUES (v_folder_id, p_share_token, 1, NOW(), p_viewer_ip);
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
