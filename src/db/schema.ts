import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'drydock.db');

export function initDatabase(): Database.Database {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const db = new Database(DB_PATH);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS ship_packets (
      id TEXT PRIMARY KEY,
      pr_url TEXT NOT NULL,
      pr_number INTEGER NOT NULL,
      pr_title TEXT NOT NULL,
      pr_author TEXT NOT NULL,
      repo_path TEXT NOT NULL,
      base_branch TEXT NOT NULL,
      head_branch TEXT NOT NULL,
      verdict TEXT NOT NULL,
      verdict_reasons TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      
      rebuild_data TEXT NOT NULL,
      test_replay_data TEXT NOT NULL,
      blast_radius_data TEXT NOT NULL,
      contracts_data TEXT NOT NULL,
      witness_data TEXT NOT NULL,
      parallax_data TEXT NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_ship_packets_created_at 
      ON ship_packets(created_at DESC);
    
    CREATE INDEX IF NOT EXISTS idx_ship_packets_verdict 
      ON ship_packets(verdict);
  `);

  return db;
}

export function getDatabase(): Database.Database {
  return initDatabase();
}
