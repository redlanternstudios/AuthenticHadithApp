import * as SQLite from 'expo-sqlite'
import { Hadith } from '../../types/hadith'
import type { HadithFolder, SavedHadithWithNotes } from '../../types/my-hadith'

const DB_NAME = 'authentic_hadith.db'

let db: SQLite.SQLiteDatabase | null = null

export async function initDatabase() {
  if (db) return db

  db = await SQLite.openDatabaseAsync(DB_NAME)

  // Create tables
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS cached_hadiths (
      id TEXT PRIMARY KEY,
      hadith_number TEXT,
      arabic_text TEXT,
      english_text TEXT,
      grade TEXT,
      collection_slug TEXT,
      narrator TEXT,
      cached_at INTEGER,
      popularity_score INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_collection ON cached_hadiths(collection_slug);
    CREATE INDEX IF NOT EXISTS idx_popularity ON cached_hadiths(popularity_score DESC);

    CREATE TABLE IF NOT EXISTS cached_folders (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT,
      description TEXT,
      color TEXT,
      icon TEXT,
      privacy TEXT,
      cached_at INTEGER,
      synced BOOLEAN DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS cached_saved_hadiths (
      id TEXT PRIMARY KEY,
      hadith_id TEXT,
      folder_id TEXT,
      notes TEXT,
      tags TEXT,
      cached_at INTEGER,
      synced BOOLEAN DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_cached_folders_user ON cached_folders(user_id);
    CREATE INDEX IF NOT EXISTS idx_cached_saved_folder ON cached_saved_hadiths(folder_id);
  `)

  return db
}

export async function cacheHadith(hadith: Hadith) {
  const database = await initDatabase()
  
  await database.runAsync(
    `INSERT OR REPLACE INTO cached_hadiths 
     (id, hadith_number, arabic_text, english_text, grade, collection_slug, narrator, cached_at, popularity_score)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      hadith.id,
      hadith.hadith_number,
      hadith.arabic_text,
      hadith.english_text,
      hadith.grade,
      hadith.collection_slug,
      hadith.narrator || '',
      Date.now(),
      0,
    ]
  )
}

export async function getCachedHadith(id: string) {
  const database = await initDatabase()
  
  const result = await database.getFirstAsync(
    'SELECT * FROM cached_hadiths WHERE id = ?',
    [id]
  )
  
  return result
}

export async function getPopularHadiths(limit: number = 100) {
  const database = await initDatabase()
  
  const results = await database.getAllAsync(
    'SELECT * FROM cached_hadiths ORDER BY popularity_score DESC LIMIT ?',
    [limit]
  )
  
  return results
}

export async function clearCache() {
  const database = await initDatabase()
  await database.runAsync('DELETE FROM cached_hadiths')
}

export async function cacheFolder(folder: HadithFolder) {
  const database = await initDatabase()
  
  await database.runAsync(
    `INSERT OR REPLACE INTO cached_folders 
     (id, user_id, name, description, color, icon, privacy, cached_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      folder.id,
      folder.user_id,
      folder.name,
      folder.description || '',
      folder.color,
      folder.icon,
      folder.privacy,
      Date.now(),
      1
    ]
  )
}

export async function getCachedFolders(userId: string) {
  const database = await initDatabase()
  
  const results = await database.getAllAsync(
    'SELECT * FROM cached_folders WHERE user_id = ? ORDER BY cached_at DESC',
    [userId]
  )
  
  return results
}

export async function cacheSavedHadith(savedHadith: SavedHadithWithNotes) {
  const database = await initDatabase()
  
  await database.runAsync(
    `INSERT OR REPLACE INTO cached_saved_hadiths 
     (id, hadith_id, folder_id, notes, tags, cached_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      savedHadith.id,
      savedHadith.hadith_id,
      savedHadith.folder_id || '',
      savedHadith.notes || '',
      JSON.stringify(savedHadith.tags || []),
      Date.now(),
      1
    ]
  )
}

