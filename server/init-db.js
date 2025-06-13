import fs from 'fs/promises';
import bcrypt from 'bcryptjs';
import pool from './db.js';

export default async function initDb() {
  const schema = await fs.readFile(new URL('./schema.sql', import.meta.url), 'utf-8');
  await pool.query(schema);

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    const { rows } = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (rows.length === 0) {
      const hash = await bcrypt.hash(password, 10);
      await pool.query('INSERT INTO users (email, password_hash, is_admin) VALUES ($1,$2,TRUE)', [email, hash]);
      console.log('Admin user created');
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  initDb().catch((err) => {
    console.error('Init DB failed', err);
    process.exit(1);
  }).finally(() => process.exit());
}
