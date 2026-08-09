const express = require("express");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

function formatTask(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    done: Boolean(row.done),
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

app.get("/health", (req, res) => {
  res.json({ status: "ok", database: "connected" });
});

app.get("/tasks", (req, res) => {
  const { search, done, sort } = req.query;
  let query = "SELECT * FROM tasks";
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push("title LIKE ?");
    params.push("%" + search + "%");
  }

  if (done !== undefined) {
    conditions.push("done = ?");
    params.push(done === "true" || done === "1" ? 1 : 0);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  if (sort === "asc") {
    query += " ORDER BY title ASC";
  } else if (sort === "desc") {
    query += " ORDER BY title DESC";
  } else {
    query += " ORDER BY id ASC";
  }

  const rows = db.prepare(query).all(...params);
  res.status(200).json(rows.map(formatTask));
});

app.get("/tasks/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid task ID" });
  }

  const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  if (!row) {
    return res.status(404).json({ error: "Task not found" });
  }

  res.status(200).json(formatTask(row));
});

app.post("/tasks", (req, res) => {
  const { title, done } = req.body || {};

  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ error: "Title is required" });
  }

  const isDone = done === true || done === 1 ? 1 : 0;
  const info = db.prepare("INSERT INTO tasks (title, done) VALUES (?, ?)").run(title.trim(), isDone);
  const newTaskRow = db.prepare("SELECT * FROM tasks WHERE id = ?").get(info.lastInsertRowid);

  res.status(201).json(formatTask(newTaskRow));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log("Server running on http://localhost:" + PORT);
  });
}

module.exports = app;
