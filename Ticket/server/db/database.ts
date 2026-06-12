import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_DIR = path.join(__dirname, '../../database');
const DB_PATH = path.join(DB_DIR, 'helpdesk.db');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema ────────────────────────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  department  TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  role        TEXT NOT NULL DEFAULT 'employee',
  status      TEXT NOT NULL DEFAULT 'active',
  password    TEXT NOT NULL DEFAULT 'Com@1234'
);

CREATE TABLE IF NOT EXISTS tickets (
  id             TEXT PRIMARY KEY,
  title          TEXT NOT NULL,
  description    TEXT NOT NULL,
  category       TEXT NOT NULL,
  priority       TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'new',
  requester_id   TEXT NOT NULL,
  requester_name TEXT NOT NULL,
  department     TEXT NOT NULL,
  email          TEXT NOT NULL,
  assignee_id    TEXT,
  assignee_name  TEXT,
  sla_due_time   TEXT NOT NULL,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL,
  FOREIGN KEY (requester_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS comments (
  id          TEXT PRIMARY KEY,
  ticket_id   TEXT NOT NULL,
  user_id     TEXT NOT NULL,
  user_name   TEXT NOT NULL,
  user_role   TEXT NOT NULL,
  message     TEXT NOT NULL,
  is_internal INTEGER NOT NULL DEFAULT 0,
  timestamp   TEXT NOT NULL,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id)
);

CREATE TABLE IF NOT EXISTS ticket_timeline (
  id          TEXT PRIMARY KEY,
  ticket_id   TEXT NOT NULL,
  from_status TEXT,
  to_status   TEXT NOT NULL,
  changed_by  TEXT NOT NULL,
  timestamp   TEXT NOT NULL,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id)
);

CREATE TABLE IF NOT EXISTS ticket_attachments (
  id            TEXT PRIMARY KEY,
  ticket_id     TEXT NOT NULL,
  filename      TEXT NOT NULL,
  original_name TEXT NOT NULL,
  size          INTEGER,
  created_at    TEXT NOT NULL,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id)
);

CREATE TABLE IF NOT EXISTS ot_records (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL,
  user_name     TEXT NOT NULL,
  date          TEXT NOT NULL,
  start_time    TEXT NOT NULL,
  end_time      TEXT NOT NULL,
  hours         REAL NOT NULL,
  description   TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'draft',
  created_at    TEXT NOT NULL,
  submitted_at  TEXT,
  approved_by   TEXT,
  approved_at   TEXT,
  reject_reason TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS services (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  name_en         TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'operational',
  last_checked    TEXT NOT NULL,
  uptime_percent  REAL NOT NULL DEFAULT 100,
  description     TEXT
);

CREATE TABLE IF NOT EXISTS incidents (
  id               TEXT PRIMARY KEY,
  title            TEXT NOT NULL,
  description      TEXT NOT NULL,
  affected_services TEXT NOT NULL DEFAULT '[]',
  status           TEXT NOT NULL DEFAULT 'investigating',
  severity         TEXT NOT NULL DEFAULT 'medium',
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL,
  resolved_at      TEXT,
  created_by       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS chat_rooms (
  id         TEXT PRIMARY KEY,
  name       TEXT,
  type       TEXT NOT NULL DEFAULT 'direct',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS chat_room_members (
  room_id      TEXT NOT NULL,
  user_id      TEXT NOT NULL,
  joined_at    TEXT NOT NULL,
  last_read_at TEXT,
  PRIMARY KEY (room_id, user_id),
  FOREIGN KEY (room_id) REFERENCES chat_rooms(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id         TEXT PRIMARY KEY,
  room_id    TEXT NOT NULL,
  sender_id  TEXT NOT NULL,
  content    TEXT NOT NULL,
  type       TEXT NOT NULL DEFAULT 'text',
  file_url   TEXT,
  file_name  TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (room_id) REFERENCES chat_rooms(id),
  FOREIGN KEY (sender_id) REFERENCES users(id)
);
`);

// Migrations — add new columns without breaking existing data
try { db.exec('ALTER TABLE users ADD COLUMN avatar TEXT'); } catch {}

export default db;
