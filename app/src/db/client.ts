import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const DEFAULT_DB = path.resolve(process.cwd(), "..", "data", "hospital.db");

function resolveDbPath() {
  if (process.env.HOSPITAL_DB_PATH) {
    return path.resolve(process.env.HOSPITAL_DB_PATH);
  }
  if (process.env.VERCEL) {
    return path.join("/tmp", "hospital.db");
  }
  return DEFAULT_DB;
}

export function getDbPath() {
  return resolveDbPath();
}

let cached: ReturnType<typeof drizzle<typeof schema>> | null = null;
let cachedSqlite: Database.Database | null = null;

export function getSqlite() {
  if (cachedSqlite) return cachedSqlite;
  const dbPath = resolveDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  cachedSqlite = new Database(dbPath);
  cachedSqlite.pragma("journal_mode = WAL");
  cachedSqlite.pragma("foreign_keys = ON");
  return cachedSqlite;
}

export function getDb() {
  if (cached) return cached;
  cached = drizzle(getSqlite(), { schema });
  return cached;
}

export function resetDbConnection() {
  if (cachedSqlite) {
    cachedSqlite.close();
  }
  cachedSqlite = null;
  cached = null;
}

export function ensureSchema() {
  const sqlite = getSqlite();
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      date_of_birth TEXT NOT NULL,
      gender TEXT NOT NULL,
      role TEXT NOT NULL,
      specialty TEXT,
      phone TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      suspended_until TEXT,
      spam_strikes INTEGER NOT NULL DEFAULT 0,
      deleted INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL REFERENCES users(username),
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      floor INTEGER NOT NULL DEFAULT 1,
      area_sqm INTEGER NOT NULL DEFAULT 20,
      status TEXT NOT NULL DEFAULT 'ACTIVE'
    );
    CREATE TABLE IF NOT EXISTS inventory_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL REFERENCES rooms(id),
      name TEXT NOT NULL,
      kind TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS equipment_transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_room_id INTEGER NOT NULL REFERENCES rooms(id),
      to_room_id INTEGER NOT NULL REFERENCES rooms(id),
      item_name TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      apply_at TEXT NOT NULL,
      applied INTEGER NOT NULL DEFAULT 0,
      created_by TEXT NOT NULL REFERENCES users(username)
    );
    CREATE TABLE IF NOT EXISTS room_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL REFERENCES rooms(id),
      job_type TEXT NOT NULL,
      details TEXT NOT NULL DEFAULT '',
      apply_at TEXT NOT NULL,
      applied INTEGER NOT NULL DEFAULT 0,
      created_by TEXT NOT NULL REFERENCES users(username)
    );
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'SCHEDULED',
      doctor_username TEXT NOT NULL REFERENCES users(username),
      patient_username TEXT NOT NULL REFERENCES users(username),
      room_id INTEGER REFERENCES rooms(id),
      starts_at TEXT NOT NULL,
      ends_at TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      anamnesis TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS medical_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_username TEXT NOT NULL UNIQUE REFERENCES users(username),
      blood_type TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS allergens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_username TEXT NOT NULL REFERENCES users(username),
      name TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS therapies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_username TEXT NOT NULL REFERENCES users(username),
      description TEXT NOT NULL,
      started_at TEXT NOT NULL,
      ended_at TEXT
    );
    CREATE TABLE IF NOT EXISTS hospitalizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_username TEXT NOT NULL REFERENCES users(username),
      room_id INTEGER NOT NULL REFERENCES rooms(id),
      reason TEXT NOT NULL,
      admitted_at TEXT NOT NULL,
      discharged_at TEXT
    );
    CREATE TABLE IF NOT EXISTS referrals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_username TEXT NOT NULL REFERENCES users(username),
      from_doctor TEXT NOT NULL REFERENCES users(username),
      to_doctor TEXT NOT NULL REFERENCES users(username),
      reason TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS vacations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doctor_username TEXT NOT NULL REFERENCES users(username),
      starts_at TEXT NOT NULL,
      ends_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'SCHEDULED',
      note TEXT NOT NULL DEFAULT '',
      created_by TEXT NOT NULL REFERENCES users(username)
    );
    CREATE TABLE IF NOT EXISTS medicines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING_REVIEW'
    );
    CREATE TABLE IF NOT EXISTS medicine_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      medicine_id INTEGER NOT NULL REFERENCES medicines(id),
      doctor_username TEXT NOT NULL REFERENCES users(username),
      decision TEXT NOT NULL,
      comment TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS prescriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_username TEXT NOT NULL REFERENCES users(username),
      doctor_username TEXT NOT NULL REFERENCES users(username),
      medicine_id INTEGER NOT NULL REFERENCES medicines(id),
      dosage TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      author_username TEXT NOT NULL REFERENCES users(username),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL REFERENCES users(username),
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_username TEXT NOT NULL REFERENCES users(username),
      medicine_name TEXT NOT NULL,
      remind_at TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS surveys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL REFERENCES users(username),
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL REFERENCES users(username),
      message TEXT NOT NULL,
      rating INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}
