import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';
import initDb from './init-db.js';

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'change-me';

initDb().catch((err) => console.error('Schema init failed', err));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, '../dist')));

app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1,$2) RETURNING id, is_admin',
      [email, hash]
    );
    const user = rows[0];
    const token = jwt.sign({ id: user.id, is_admin: user.is_admin }, JWT_SECRET);
    res.json({ token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, is_admin: user.is_admin }, JWT_SECRET);
    res.json({ token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Login failed' });
  }
});

function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.sendStatus(401);
  const token = authHeader.split(' ')[1];
  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch (e) {
    res.sendStatus(401);
  }
}

function adminOnly(req, res, next) {
  if (!req.user?.is_admin) return res.sendStatus(403);
  next();
}

app.post('/api/diagrams', auth, async (req, res) => {
  const { diagram } = req.body;
  if (!diagram?.id) return res.status(400).json({ error: 'Missing diagram id' });
  try {
    await pool.query(
      'INSERT INTO diagrams (id, owner_id, name, visibility, database_type, database_edition, data, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [
        diagram.id,
        req.user.id,
        diagram.name,
        diagram.visibility || 'private',
        diagram.databaseType,
        diagram.databaseEdition,
        JSON.stringify(diagram),
        diagram.createdAt ? new Date(diagram.createdAt) : new Date(),
        diagram.updatedAt ? new Date(diagram.updatedAt) : new Date(),
      ]
    );
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to save diagram' });
  }
});

app.get('/api/users', auth, adminOnly, async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, email, is_admin FROM users ORDER BY id');
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.delete('/api/users/:id', auth, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

const port = process.env.PORT || 3000;
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});
app.listen(port, () => {
  console.log('API server listening on', port);
});
