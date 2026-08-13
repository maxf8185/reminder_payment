const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(app.getPath('userData'), 'reminder_payment.sqlite');
const db = new Database(dbPath);

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS User (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS Student (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      comment TEXT,
      status TEXT DEFAULT 'Active',
      start_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS Schedule (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      day_of_week INTEGER NOT NULL,
      time TEXT NOT NULL,
      FOREIGN KEY (student_id) REFERENCES Student (id)
    );

    CREATE TABLE IF NOT EXISTS LessonPackage (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      total_lessons INTEGER NOT NULL,
      price REAL NOT NULL,
      payment_date TEXT NOT NULL,
      start_date TEXT,
      used_lessons INTEGER DEFAULT 0,
      status TEXT DEFAULT 'Active',
      FOREIGN KEY (student_id) REFERENCES Student (id)
    );

    CREATE TABLE IF NOT EXISTS Lesson (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      package_id TEXT,
      date TEXT NOT NULL,
      start_time TEXT,
      end_time TEXT,
      status TEXT DEFAULT 'Scheduled',
      comment TEXT,
      FOREIGN KEY (student_id) REFERENCES Student (id),
      FOREIGN KEY (package_id) REFERENCES LessonPackage (id)
    );

    CREATE TABLE IF NOT EXISTS Notification (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      reference_id TEXT,
      status TEXT DEFAULT 'UNREAD',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migrations for adding new columns to existing tables safely
  const migrations = [
    "ALTER TABLE Student ADD COLUMN teacher_id TEXT REFERENCES User(id);",
    "ALTER TABLE Student ADD COLUMN student_phone TEXT;",
    "ALTER TABLE Student ADD COLUMN parent_phone TEXT;",
    "ALTER TABLE Student ADD COLUMN level TEXT;",
    "ALTER TABLE Student ADD COLUMN contract_number TEXT;"
  ];

  for (const m of migrations) {
    try {
      db.exec(m);
    } catch (e) {
      // Column might already exist
    }
  }

  // Ensure default Admin exists
  const adminExists = db.prepare("SELECT * FROM User WHERE username = 'admin'").get();
  if (!adminExists) {
    db.prepare("INSERT INTO User (id, username, password, role, name) VALUES (?, ?, ?, ?, ?)").run(
      uuidv4(), 'admin', 'admin', 'ADMIN', 'System Administrator'
    );
  }
}

module.exports = { db, initDb };
