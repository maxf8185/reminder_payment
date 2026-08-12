const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

// For dev, might want it in root, but userData is better
const dbPath = path.join(app.getPath('userData'), 'reminder_payment.sqlite');
const db = new Database(dbPath);

function initDb() {
  db.exec(`
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
  `);
}

module.exports = { db, initDb };
