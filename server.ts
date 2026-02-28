import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("database.sqlite");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    name TEXT,
    avatar TEXT,
    role TEXT DEFAULT 'player'
  );

  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    level INTEGER,
    question TEXT,
    answer INTEGER
  );

  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER,
    level INTEGER,
    score INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(player_id) REFERENCES players(id)
  );
`);

// Seed initial questions if empty
const questionCount = db.prepare("SELECT COUNT(*) as count FROM questions").get() as { count: number };
if (questionCount.count === 0) {
  const insertQ = db.prepare("INSERT INTO questions (level, question, answer) VALUES (?, ?, ?)");
  for (let level = 1; level <= 3; level++) {
    const range = level * 10;
    for (let i = 0; i < 10; i++) {
      const a = Math.floor(Math.random() * (range * 2)) - range;
      const b = Math.floor(Math.random() * (range * 2)) - range;
      insertQ.run(level, `${a} + (${b})`, a + b);
    }
  }
}

// Seed admin if not exists
const adminExists = db.prepare("SELECT * FROM players WHERE username = 'admin'").get();
if (!adminExists) {
  db.prepare("INSERT INTO players (username, name, avatar, role) VALUES (?, ?, ?, ?)").run('admin', 'Administrator', '👨‍🏫', 'admin');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/login", (req, res) => {
    const { username, name, avatar } = req.body;
    let player = db.prepare("SELECT * FROM players WHERE username = ?").get(username) as any;
    
    if (!player) {
      const info = db.prepare("INSERT INTO players (username, name, avatar) VALUES (?, ?, ?)").run(username, name, avatar);
      player = { id: info.lastInsertRowid, username, name, avatar, role: 'player' };
    }
    res.json(player);
  });

  app.get("/api/questions/:level", (req, res) => {
    const questions = db.prepare("SELECT * FROM questions WHERE level = ?").all(req.params.level);
    res.json(questions);
  });

  app.post("/api/scores", (req, res) => {
    const { player_id, level, score } = req.body;
    db.prepare("INSERT INTO scores (player_id, level, score) VALUES (?, ?, ?)").run(player_id, level, score);
    res.json({ success: true });
  });

  app.get("/api/leaderboard", (req, res) => {
    const leaderboard = db.prepare(`
      SELECT p.name, p.avatar, SUM(s.score) as total_score
      FROM players p
      JOIN scores s ON p.id = s.player_id
      GROUP BY p.id
      ORDER BY total_score DESC
      LIMIT 10
    `).all();
    res.json(leaderboard);
  });

  // Admin Routes
  app.get("/api/admin/players", (req, res) => {
    const players = db.prepare("SELECT * FROM players").all();
    res.json(players);
  });

  app.delete("/api/admin/players/:id", (req, res) => {
    db.prepare("DELETE FROM players WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/admin/questions", (req, res) => {
    const questions = db.prepare("SELECT * FROM questions").all();
    res.json(questions);
  });

  app.post("/api/admin/questions", (req, res) => {
    const { level, question, answer } = req.body;
    db.prepare("INSERT INTO questions (level, question, answer) VALUES (?, ?, ?)").run(level, question, answer);
    res.json({ success: true });
  });

  app.delete("/api/admin/questions/:id", (req, res) => {
    db.prepare("DELETE FROM questions WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
