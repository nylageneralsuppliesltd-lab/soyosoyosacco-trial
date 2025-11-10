// docs/api/index.js
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..'))); // Serve website files

// Neon Postgres connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Create table if not exists
pool.query(`
  CREATE TABLE IF NOT EXISTS sacco_history (
    id SERIAL PRIMARY KEY,
    period VARCHAR(7) UNIQUE NOT NULL,
    members INTEGER,
    contributions BIGINT,
    loans BIGINT,
    bank_balance BIGINT,
    roa DECIMAL(5,2),
    date_saved DATE DEFAULT CURRENT_DATE
  )
`);

// GET: All history (public)
app.get('/api/history', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT period, members, contributions, loans, bank_balance AS "bankBalance", roa, date_saved AS "dateSaved"
      FROM sacco_history ORDER BY period DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST: Save/Update current month (called by website)
app.post('/api/history/save', async (req, res) => {
  const { members, contributions, loans, bankBalance, roa } = req.body;
  const period = new Date().toISOString().slice(0, 7); // YYYY-MM

  try {
    const query = `
      INSERT INTO sacco_history (period, members, contributions, loans, bank_balance, roa)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (period) DO UPDATE SET
        members = EXCLUDED.members,
        contributions = EXCLUDED.contributions,
        loans = EXCLUDED.loans,
        bank_balance = EXCLUDED.bank_balance,
        roa = EXCLUDED.roa,
        date_saved = CURRENT_DATE
      RETURNING *
    `;
    const values = [period, members, contributions, loans || 0, bankBalance || 0, roa || 0];
    const result = await pool.query(query, values);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Save failed' });
  }
});

// Serve website (fallback for GitHub Pages + Render)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'about.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
  console.log(`Visit: https://your-render-url.onrender.com/api/history`);
});
