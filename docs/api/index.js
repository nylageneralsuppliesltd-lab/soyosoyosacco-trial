// docs/api/index.js - Node.js backend with PostgreSQL
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// PostgreSQL connection (Render env variable DATABASE_URL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Needed for Neon/Postgres cloud
});

// Get current month YYYY-MM
const getCurrentPeriod = () => new Date().toISOString().slice(0, 7);

// GET: full history
app.get('/api/history', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sacco_history ORDER BY date_saved DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('DB fetch error:', err);
    res.status(500).json([]);
  }
});

// POST: save current month
app.post('/api/history/save', async (req, res) => {
  try {
    const {
      members = 0,
      contributions = 0,
      loansDisbursed = 0,
      loansBalance = 0,
      total_bank_balance = 0,
      profit = 0,
      roa = 0,
      extraFields = '{}'
    } = req.body;

    const period = getCurrentPeriod();

    const query = `
      INSERT INTO sacco_history
        (period, members, contributions, loans_disbursed, loans_balance, total_bank_balance, profit, roa, extra_fields, date_saved)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
      ON CONFLICT (period) DO UPDATE
        SET members=$2, contributions=$3, loans_disbursed=$4, loans_balance=$5,
            total_bank_balance=$6, profit=$7, roa=$8, extra_fields=$9, date_saved=NOW()
      RETURNING *;
    `;

    const values = [
      period,
      members,
      contributions,
      loansDisbursed,
      loansBalance,
      total_bank_balance,
      profit,
      roa,
      typeof extraFields === 'string' ? extraFields : JSON.stringify(extraFields)
    ];

    const result = await pool.query(query, values);
    console.log('Saved:', period);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('DB save error:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Soyosoyo SACCO API running on port ${PORT}`));
