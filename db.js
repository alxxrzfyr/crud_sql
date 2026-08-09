const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'tasks.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

// Database schema initialization
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

function seedInitialData() {
  const { count } = db.prepare('SELECT COUNT(*) as count FROM tasks').get();

  if (count === 0) {
    const insertStmt = db.prepare('INSERT INTO tasks (title, done) VALUES (?, ?)');
    const seedTransaction = db.transaction((tasks) => {
      for (const task of tasks) {
        insertStmt.run(task.title, task.done);
      }
    });

    seedTransaction([
      { title: 'Buy groceries', done: 0 },
      { title: 'Read a book', done: 0 },
      { title: 'Finish Week 3 assignment', done: 1 }
    ]);
  }
}

seedInitialData();

module.exports = db;
