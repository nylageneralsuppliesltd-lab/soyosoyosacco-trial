// docs/api/index.js  ← FINAL WORKING VERSION
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Critical middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..'))); // Serve all files from /docs

// Neon DB
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Create table
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
`).catch(err => console.error('Table creation error:', err));

// API ROUTES — MUST COME BEFORE STATIC FALLBACK
const apiRouter = express.Router();

apiRouter.get('/history', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        period, 
        members, 
        contributions, 
        loans, 
        bank_balance AS "bankBalance", 
        roa, 
        date_saved AS "dateSaved"
      FROM sacco_history 
      ORDER BY period DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('GET /api/history error:', err);
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/history/save', async (req, res) => {
  const { members, contributions, loans, bank_balance, roa } = req.body;
  const period = new Date().toISOString().slice(0, 7);

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
    const values = [period, members, contributions, loans || 0, bank_balance || 0, roa || 0];
    const result = await pool.query(query, values);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('POST /api/history/save error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Mount API routes
app.use('/api', apiRouter);

// Fallback: serve about.html for any unknown route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'about.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`SOYOSOYO SACCO API LIVE`);
  console.log(`→ GET:  https://soyosoyo-sacco-api.onrender.com/api/history`);
  console.log(`→ POST: https://soyosoyo-sacco-api.onrender.com/api/history/save`);
});
