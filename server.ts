import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import crypto from "crypto";

const db = new Database("app.db");

// Initialize Database Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT
  );
  CREATE TABLE IF NOT EXISTS model_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    is_loaded BOOLEAN,
    filename TEXT,
    iterations INTEGER
  );
  CREATE TABLE IF NOT EXISTS analysis_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    predicted_class TEXT,
    confidence REAL,
    heart_rate INTEGER,
    condition TEXT,
    feedback TEXT,
    FOREIGN KEY(user_email) REFERENCES users(email)
  );
  CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT,
    name TEXT,
    age INTEGER,
    gender TEXT,
    mrn TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_email) REFERENCES users(email)
  );
  INSERT OR IGNORE INTO model_state (id, is_loaded, filename, iterations) VALUES (1, 1, 'cawt_best_v1.pth', 250);
  UPDATE model_state SET is_loaded = 1, filename = 'cawt_best_v1.pth' WHERE is_loaded = 0;
`);

function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API ROUTES ---
  app.post("/api/signup", (req, res) => {
    const { email, password } = req.body;
    try {
      const stmt = db.prepare("INSERT INTO users (email, password) VALUES (?, ?)");
      stmt.run(email, hashPassword(password));
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: "Email already exists" });
    }
  });

  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    const stmt = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?");
    const user = stmt.get(email, hashPassword(password)) as any;
    if (user) {
      res.json({ success: true, user: { email: user.email } });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.get("/api/model", (req, res) => {
    const state = db.prepare("SELECT * FROM model_state WHERE id = 1").get();
    res.json(state);
  });

  app.post("/api/model/save", (req, res) => {
    const { filename } = req.body;
    db.prepare("UPDATE model_state SET is_loaded = 1, filename = ? WHERE id = 1").run(filename);
    res.json({ success: true });
  });

  app.post("/api/model/train", (req, res) => {
    db.prepare("UPDATE model_state SET iterations = iterations + 1 WHERE id = 1").run();
    const state = db.prepare("SELECT * FROM model_state WHERE id = 1").get();
    res.json({ success: true, iterations: state.iterations });
  });

  app.post("/api/history", (req, res) => {
    const { user_email, predicted_class, confidence, heart_rate, condition, feedback } = req.body;
    try {
      const stmt = db.prepare(`
        INSERT INTO analysis_history 
        (user_email, predicted_class, confidence, heart_rate, condition, feedback) 
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.run(user_email, predicted_class, confidence, heart_rate, condition, feedback);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to save history" });
    }
  });

  app.get("/api/history/:email", (req, res) => {
    try {
      const stmt = db.prepare("SELECT * FROM analysis_history WHERE user_email = ? ORDER BY timestamp DESC");
      const history = stmt.all(req.params.email);
      res.json(history);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch history" });
    }
  });

  app.post("/api/patients", (req, res) => {
    const { user_email, name, age, gender, mrn } = req.body;
    try {
      const stmt = db.prepare(`
        INSERT INTO patients (user_email, name, age, gender, mrn) 
        VALUES (?, ?, ?, ?, ?)
      `);
      stmt.run(user_email, name, age, gender, mrn);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to add patient" });
    }
  });

  app.get("/api/patients/:email", (req, res) => {
    try {
      const stmt = db.prepare("SELECT * FROM patients WHERE user_email = ? ORDER BY created_at DESC");
      const patients = stmt.all(req.params.email);
      res.json(patients);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch patients" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
